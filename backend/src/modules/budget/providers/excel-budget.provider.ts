import { BadRequestException, Injectable } from '@nestjs/common';
import { BudgetSourceType } from '@prisma/client';
import * as ExcelJS from 'exceljs';
import { createHash } from 'crypto';
import { BudgetImportIssue, BudgetSourceDocument, BudgetSourceLine } from '../domain/budget-source.types';
import { IBudgetSourceProvider } from './budget-source-provider.interface';

@Injectable()
export class ExcelBudgetProvider implements IBudgetSourceProvider {
  readonly sourceType = BudgetSourceType.EXCEL;
  private readonly sheetName = 'Detalle TI';
  private readonly fixedHeaders: Record<string, string> = { B: 'ITEM', C: 'PAÍS', D: 'BU', E: 'OBJ', F: 'SUB', G: 'CUENTA', H: 'DESCRIPCIÓN CTA', I: 'DESCRIPCIÓN', J: 'AREA', K: 'FRECUENCIA' };
  private readonly monthColumns = ['BT', 'BU', 'BV', 'BW', 'BX', 'BY', 'BZ', 'CA', 'CB', 'CC', 'CD', 'CE'];
  private readonly monthNames = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

  async parse(input: { buffer: Buffer; fileName: string; currencyCode: string }): Promise<BudgetSourceDocument> {
    const workbook = new ExcelJS.Workbook();
    try { await workbook.xlsx.load(input.buffer as any); } catch { throw new BadRequestException('El archivo no es un libro XLSX válido.'); }
    const issues: BudgetImportIssue[] = []; const sheet = workbook.getWorksheet(this.sheetName);
    if (!sheet) return this.empty(input, [{ severity: 'ERROR', code: 'MISSING_SHEET', message: `No existe la hoja obligatoria ${this.sheetName}.` }]);
    for (const [column, expected] of Object.entries(this.fixedHeaders)) { const actual = normalize(this.text(sheet.getCell(`${column}6`).value)); if (actual !== normalize(expected)) issues.push({ severity: 'ERROR', code: 'INVALID_HEADER', message: `Se esperaba "${expected}" y se encontró "${actual || '(vacío)'}".`, sheet: this.sheetName, row: 6, column }); }
    const yearMatch = normalize(this.text(sheet.getCell('BT6').value)).match(/^ENE(\d{2}|\d{4})$/); const fiscalYear = yearMatch ? (yearMatch[1].length === 2 ? 2000 + Number(yearMatch[1]) : Number(yearMatch[1])) : 0;
    if (!fiscalYear || fiscalYear < 2000 || fiscalYear > 2100) issues.push({ severity: 'ERROR', code: 'INVALID_FISCAL_YEAR', message: 'No fue posible determinar un año fiscal válido desde el encabezado de enero.', sheet: this.sheetName, row: 6, column: 'BT' });
    const suffix = fiscalYear ? String(fiscalYear).slice(-2) : '';
    this.monthColumns.forEach((column, index) => { const actual = normalize(this.text(sheet.getCell(`${column}6`).value)); const expected = `${this.monthNames[index]}${suffix}`; if (actual !== expected) issues.push({ severity: 'ERROR', code: 'INVALID_MONTH_HEADER', message: `Se esperaba "${expected}" y se encontró "${actual || '(vacío)'}".`, sheet: this.sheetName, row: 6, column }); });
    const totalHeader = normalize(this.text(sheet.getCell('CF6').value)); if (totalHeader !== `TOTAL${suffix}`) issues.push({ severity: 'ERROR', code: 'INVALID_TOTAL_HEADER', message: `Se esperaba "TOTAL${suffix}" y se encontró "${totalHeader || '(vacío)'}".`, sheet: this.sheetName, row: 6, column: 'CF' });
    if (sheet.columnCount > 87) issues.push({ severity: 'ERROR', code: 'NEW_COLUMNS', message: `La hoja contiene columnas nuevas fuera del rango oficial B:CI (${sheet.columnCount} columnas).`, sheet: this.sheetName });
    const raw: BudgetSourceLine[] = [];
    for (let rowNumber = 7; rowNumber <= sheet.rowCount; rowNumber++) {
      const item = this.text(sheet.getCell(`B${rowNumber}`).value); if (!item) continue; if (normalize(item) === 'TOTAL') break; if (!/^\d+$/.test(item)) continue;
      for (const column of ['C', 'D', 'E', 'F', 'G', 'H', 'J']) if (!this.text(sheet.getCell(`${column}${rowNumber}`).value)) issues.push({ severity: 'ERROR', code: 'EMPTY_REQUIRED_VALUE', message: `Valor obligatorio vacío en ${column}${rowNumber}.`, sheet: this.sheetName, row: rowNumber, column });
      const months = this.monthColumns.map((column) => this.number(sheet.getCell(`${column}${rowNumber}`).value, issues, rowNumber, column));
      const businessUnit = this.text(sheet.getCell(`D${rowNumber}`).value), objectCode = this.text(sheet.getCell(`E${rowNumber}`).value), subCode = this.text(sheet.getCell(`F${rowNumber}`).value), accountCode = this.text(sheet.getCell(`G${rowNumber}`).value);
      if (accountCode !== `${businessUnit}.${objectCode}.${subCode}`) issues.push({ severity: 'ERROR', code: 'INVALID_ACCOUNT', message: `La cuenta ${accountCode} no coincide con BU.OBJ.SUB.`, sheet: this.sheetName, row: rowNumber, column: 'G' });
      const annualAmount = round(months.reduce((sum, value) => sum + value, 0)); const sourceAnnualAmount = this.optionalNumber(sheet.getCell(`CF${rowNumber}`).value, issues, rowNumber, 'CF');
      if (sourceAnnualAmount !== undefined && Math.abs(annualAmount - sourceAnnualAmount) > 0.01) issues.push({ severity: 'WARNING', code: 'ANNUAL_MISMATCH', message: `El total (${sourceAnnualAmount}) no coincide con los meses (${annualAmount}); se utilizará la suma mensual.`, sheet: this.sheetName, row: rowNumber, column: 'CF' });
      raw.push({ sourceRow: rowNumber, sourceCountryCode: this.text(sheet.getCell(`C${rowNumber}`).value), businessUnit, objectCode, subCode, accountCode, accountDescription: this.text(sheet.getCell(`H${rowNumber}`).value), detailDescription: this.text(sheet.getCell(`I${rowNumber}`).value), area: this.text(sheet.getCell(`J${rowNumber}`).value), frequency: this.text(sheet.getCell(`K${rowNumber}`).value), currency: input.currencyCode, months, annualAmount, sourceAnnualAmount, sourceComment: this.text(sheet.getCell(`CH${rowNumber}`).value) });
    }
    const grouped = new Map<string, BudgetSourceLine>();
    for (const line of raw) { const key = naturalKey(line); const current = grouped.get(key); if (!current) grouped.set(key, line); else { issues.push({ severity: 'WARNING', code: 'DUPLICATE_LINE', message: `Fila duplicada de la fila ${current.sourceRow}; sus importes serán consolidados.`, sheet: this.sheetName, row: line.sourceRow }); current.months = current.months.map((value, index) => round(value + line.months[index])); current.annualAmount = round(current.months.reduce((sum, value) => sum + value, 0)); current.sourceAnnualAmount = round((current.sourceAnnualAmount || 0) + (line.sourceAnnualAmount || 0)); } }
    return { sourceType: this.sourceType, sourceFileName: input.fileName, sourceHash: createHash('sha256').update(input.buffer).update(input.currencyCode).digest('hex'), sourceSheet: this.sheetName, sourceUpdatedAt: this.text(sheet.getCell('B4').value), fiscalYear: fiscalYear || new Date().getFullYear(), lines: [...grouped.values()], issues, metadata: { workbookSheets: workbook.worksheets.map((item) => ({ name: item.name, state: item.state, rowCount: item.rowCount, columnCount: item.columnCount })), sourceRows: raw.length, consolidatedRows: grouped.size, title: this.text(sheet.getCell('B2').value), units: this.text(sheet.getCell('B3').value), currencyCode: input.currencyCode } };
  }
  private empty(input: { buffer: Buffer; fileName: string; currencyCode: string }, issues: BudgetImportIssue[]): BudgetSourceDocument { return { sourceType: this.sourceType, sourceFileName: input.fileName, sourceHash: createHash('sha256').update(input.buffer).update(input.currencyCode).digest('hex'), sourceSheet: this.sheetName, fiscalYear: new Date().getFullYear(), lines: [], issues, metadata: { currencyCode: input.currencyCode } }; }
  private text(value: ExcelJS.CellValue): string { if (value && typeof value === 'object' && 'result' in value) return String(value.result ?? '').trim(); if (value && typeof value === 'object' && 'richText' in value) return value.richText.map((part) => part.text).join('').trim(); return String(value ?? '').trim(); }
  private number(value: ExcelJS.CellValue, issues: BudgetImportIssue[], row: number, column: string): number { const raw = value && typeof value === 'object' && 'result' in value ? value.result : value; if (raw === null || raw === undefined || raw === '') return 0; const parsed = Number(raw); if (!Number.isFinite(parsed)) { issues.push({ severity: 'ERROR', code: 'INVALID_NUMBER', message: `Valor numérico inválido en ${column}${row}.`, sheet: this.sheetName, row, column }); return 0; } if (parsed < 0) { issues.push({ severity: 'ERROR', code: 'NEGATIVE_AMOUNT', message: `El monto en ${column}${row} no puede ser negativo.`, sheet: this.sheetName, row, column }); return 0; } return round(parsed); }
  private optionalNumber(value: ExcelJS.CellValue, issues: BudgetImportIssue[], row: number, column: string): number | undefined { const raw = value && typeof value === 'object' && 'result' in value ? value.result : value; if (raw === null || raw === undefined || raw === '') return undefined; const parsed = Number(raw); if (!Number.isFinite(parsed)) { issues.push({ severity: 'ERROR', code: 'INVALID_NUMBER', message: `Valor numérico inválido en ${column}${row}.`, sheet: this.sheetName, row, column }); return undefined; } if (parsed < 0) issues.push({ severity: 'ERROR', code: 'NEGATIVE_AMOUNT', message: `El monto en ${column}${row} no puede ser negativo.`, sheet: this.sheetName, row, column }); return round(parsed); }
}
export function naturalKey(line: BudgetSourceLine) { return [line.sourceCountryCode, line.businessUnit, line.objectCode, line.subCode, line.area, line.detailDescription].map(normalize).join('|'); }
function normalize(value: string) { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim().toUpperCase(); }
function round(value: number) { return Math.round((value + Number.EPSILON) * 100) / 100; }
