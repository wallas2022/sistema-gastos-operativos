import { Injectable } from '@nestjs/common';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import * as ExcelJS from 'exceljs';
import { ExportPayload } from './reports.types';

@Injectable()
export class ReportExportService {
  private readonly blue = '1F4E78';

  async excel(payload: ExportPayload, filters: Record<string, unknown>, user: any) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistema de Gastos Operativos';
    workbook.created = new Date();
    const sheet = workbook.addWorksheet(payload.title.slice(0, 31), { views: [{ state: 'frozen', ySplit: 5 }] });
    sheet.mergeCells(1, 1, 1, Math.max(1, payload.columns.length));
    const title = sheet.getCell(1, 1); title.value = payload.title; title.font = { bold: true, size: 18, color: { argb: 'FFFFFFFF' } }; title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${this.blue}` } }; title.alignment = { vertical: 'middle', horizontal: 'center' }; sheet.getRow(1).height = 30;
    sheet.getCell('A2').value = `Generado: ${new Date().toLocaleString('es-GT')}`;
    sheet.getCell('A3').value = `Usuario: ${user?.name || user?.email || 'No identificado'}`;
    sheet.getCell('A4').value = `Filtros: ${this.filterText(filters)}`;
    sheet.columns = payload.columns.map((column) => ({ key: column.key, width: column.width || Math.max(14, column.header.length + 2) }));
    const header = sheet.getRow(5);
    payload.columns.forEach((column, index) => { const cell = header.getCell(index + 1); cell.value = column.header; cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }; cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${this.blue}` } }; cell.alignment = { vertical: 'middle', horizontal: 'center' }; });
    payload.rows.forEach((row) => { const excelRow = sheet.addRow(row); payload.columns.forEach((column, index) => { const cell = excelRow.getCell(index + 1); if (column.format === 'money') cell.numFmt = '#,##0.00'; if (column.format === 'percent') cell.numFmt = '0.00%'; if (column.format === 'date') cell.numFmt = 'dd/mm/yyyy hh:mm'; }); });
    if (payload.totals) { const row = sheet.addRow(payload.totals); row.font = { bold: true }; row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9EAF7' } }; }
    sheet.eachRow((row, rowNumber) => { if (rowNumber >= 5) row.eachCell((cell) => { cell.border = { top: { style: 'thin', color: { argb: 'FFD9E2F3' } }, left: { style: 'thin', color: { argb: 'FFD9E2F3' } }, bottom: { style: 'thin', color: { argb: 'FFD9E2F3' } }, right: { style: 'thin', color: { argb: 'FFD9E2F3' } } }; }); });
    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  async pdf(payload: ExportPayload, filters: Record<string, unknown>, user: any) {
    const document = await PDFDocument.create();
    const regular = await document.embedFont(StandardFonts.Helvetica);
    const bold = await document.embedFont(StandardFonts.HelveticaBold);
    const pageSize: [number, number] = [841.89, 595.28];
    const margin = 32, lineHeight = 16;
    const usable = pageSize[0] - margin * 2;
    const widths = payload.columns.map((column) => column.width || 16);
    const widthTotal = widths.reduce((sum, value) => sum + value, 0);
    const columnWidths = widths.map((value) => usable * value / widthTotal);
    let page = document.addPage(pageSize), y = pageSize[1] - margin;
    const drawHeader = () => {
      page.drawRectangle({ x: margin, y: y - 26, width: usable, height: 30, color: rgb(0.12, 0.31, 0.47) });
      page.drawText(payload.title, { x: margin + 8, y: y - 17, size: 16, font: bold, color: rgb(1, 1, 1) }); y -= 40;
      page.drawText(`Fecha: ${new Date().toLocaleString('es-GT')}  |  Usuario: ${this.clean(user?.name || user?.email || 'No identificado')}`, { x: margin, y, size: 8, font: regular }); y -= 13;
      page.drawText(this.crop(`Filtros: ${this.filterText(filters)}`, 150), { x: margin, y, size: 8, font: regular }); y -= 20;
      let x = margin; payload.columns.forEach((column, index) => { page.drawRectangle({ x, y: y - lineHeight + 3, width: columnWidths[index], height: lineHeight, color: rgb(0.85, 0.92, 0.97) }); page.drawText(this.crop(column.header, Math.max(5, Math.floor(columnWidths[index] / 5))), { x: x + 2, y: y - 10, size: 7, font: bold }); x += columnWidths[index]; }); y -= lineHeight;
    };
    const newPage = () => { page = document.addPage(pageSize); y = pageSize[1] - margin; drawHeader(); };
    drawHeader();
    for (const row of payload.rows) {
      if (y < margin + 25) newPage();
      let x = margin; payload.columns.forEach((column, index) => { const value = this.display(row[column.key], column.format); page.drawText(this.crop(value, Math.max(4, Math.floor(columnWidths[index] / 4.6))), { x: x + 2, y: y - 10, size: 7, font: regular }); x += columnWidths[index]; }); y -= lineHeight;
    }
    if (payload.totals) { if (y < margin + 25) newPage(); let x = margin; payload.columns.forEach((column, index) => { const value = this.display(payload.totals![column.key], column.format); page.drawText(this.crop(value, Math.max(4, Math.floor(columnWidths[index] / 4.6))), { x: x + 2, y: y - 10, size: 7, font: bold }); x += columnWidths[index]; }); }
    const pages = document.getPages(); pages.forEach((item, index) => item.drawText(`Sistema de Gastos Operativos  |  Página ${index + 1} de ${pages.length}`, { x: margin, y: 14, size: 8, font: regular, color: rgb(0.35, 0.35, 0.35) }));
    return Buffer.from(await document.save());
  }

  private filterText(filters: Record<string, unknown>) { const ignored = new Set(['page', 'pageSize', 'sortBy', 'sortOrder']); const values = Object.entries(filters).filter(([key, value]) => !ignored.has(key) && value !== undefined && value !== '').map(([key, value]) => `${key}=${value}`); return values.length ? values.join(', ') : 'Sin filtros'; }
  private display(value: unknown, format?: string) { if (value === null || value === undefined) return ''; if (format === 'date') return new Date(value as string).toLocaleString('es-GT'); if (format === 'money') return Number(value).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); if (format === 'percent') return `${(Number(value) * 100).toFixed(2)}%`; if (format === 'duration') return `${Number(value).toFixed(0)} min`; return this.clean(String(value)); }
  private clean(value: string) { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\x20-\x7E]/g, ''); }
  private crop(value: string, max: number) { const clean = this.clean(value); return clean.length > max ? `${clean.slice(0, Math.max(1, max - 3))}...` : clean; }
}
