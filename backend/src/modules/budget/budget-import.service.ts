import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { BudgetSourceType, BudgetVersionStatus, Prisma } from '@prisma/client';
import { BudgetRepository } from './budget.repository';
import { BudgetSourceDocument, BudgetSourceLine } from './domain/budget-source.types';
import { ExcelBudgetProvider, naturalKey } from './providers/excel-budget.provider';
import { OracleJdeProvider } from './providers/oracle-jde.provider';

@Injectable()
export class BudgetImportService {
  constructor(private readonly repository: BudgetRepository, private readonly excel: ExcelBudgetProvider, private readonly oracle: OracleJdeProvider) {}
  async preview(file: Express.Multer.File, currencyId: string) { const currency = await this.currency(currencyId); const document = await this.provider(BudgetSourceType.EXCEL).parse({ buffer: file.buffer, fileName: file.originalname, currencyCode: currency.code }); await this.enrichMappings(document); return this.previewResult(document); }
  async importBudget(file: Express.Multer.File, comment: string | undefined, currencyId: string, user: any) {
    const currency = await this.currency(currencyId);
    const document = await this.provider(BudgetSourceType.EXCEL).parse({ buffer: file.buffer, fileName: file.originalname, currencyCode: currency.code });
    await this.enrichMappings(document);
    const errors = document.issues.filter((issue) => issue.severity === 'ERROR');
    if (errors.length) throw new BadRequestException({ message: 'La importación contiene errores y fue revertida.', issues: errors });
    const previous = await this.repository.activeVersion(document.fiscalYear, currency.id);
    const comparison = this.compare(document, previous);
    try {
      return await this.repository.transaction(async (tx) => {
        const latest = await tx.budgetVersion.findFirst({ where: { fiscalYear: document.fiscalYear }, orderBy: { versionNumber: 'desc' } });
        if (previous) {
          const sourceKeys = new Set(document.lines.map((line) => naturalKey(line)));
          const activeReservations = await tx.budgetReservation.findMany({ where: { status: { in: ['RESERVED', 'EXECUTED'] }, budgetLine: { versionId: previous.id } }, include: { budgetLine: { select: { naturalKey: true } } } });
          const unmatched = activeReservations.filter((reservation: any) => !sourceKeys.has(reservation.budgetLine.naturalKey));
          if (unmatched.length) throw new ConflictException('No puede activarse una nueva versión mientras existan reservas activas sin partida equivalente; se requiere una política explícita de reasignación.');
        }
        if (previous) await tx.budgetVersion.update({ where: { id: previous.id }, data: { active: false, status: BudgetVersionStatus.SUPERSEDED } });
        const version = await tx.budgetVersion.create({
          data: { fiscalYear: document.fiscalYear, versionNumber: (latest?.versionNumber || 0) + 1, currencyId: currency.id, sourceType: document.sourceType, sourceFileName: document.sourceFileName, sourceHash: document.sourceHash, sourceSheet: document.sourceSheet, sourceUpdatedAt: document.sourceUpdatedAt, comment, status: BudgetVersionStatus.ACTIVE, active: true, importedByUserId: user.id, rowCount: document.lines.length, warningCount: document.issues.filter((issue) => issue.severity === 'WARNING').length, approvedTotal: total(document.lines), metadata: { ...document.metadata, issues: document.issues, comparison, lifecycleEvents: ['PRESUPUESTO_VALIDADO', 'PRESUPUESTO_VERSIONADO', 'PRESUPUESTO_IMPORTADO'] } as unknown as Prisma.InputJsonValue },
        });
        for (const line of document.lines) {
          const mapping = await this.mapLine(line, tx);
          await tx.budgetLine.create({ data: { versionId: version.id, naturalKey: naturalKey(line), sourceRow: line.sourceRow, sourceCountryCode: line.sourceCountryCode, countryId: mapping.countryId, companyId: null, businessUnit: line.businessUnit, objectCode: line.objectCode, subCode: line.subCode, accountCode: line.accountCode, accountDescription: line.accountDescription, detailDescription: line.detailDescription, area: line.area, frequency: line.frequency, currency: line.currency, annualAmount: line.annualAmount, sourceAnnualAmount: line.sourceAnnualAmount, sourceComment: line.sourceComment, periods: { create: line.months.map((amount, index) => ({ fiscalYear: document.fiscalYear, month: index + 1, approvedAmount: amount })) } } });
        }
        // Carry active reservations/commitments to the equivalent line and period in the new version.
        if (previous) {
          const oldLines = await tx.budgetLine.findMany({ where: { versionId: previous.id }, include: { periods: true, reservations: { where: { status: { in: ['RESERVED', 'EXECUTED'] } } } } });
          const newLines = await tx.budgetLine.findMany({ where: { versionId: version.id }, include: { periods: true } });
          const byKey = new Map(newLines.map((line: any) => [line.naturalKey, line]));
          for (const oldLine of oldLines as any[]) {
            const target = byKey.get(oldLine.naturalKey) as any;
            if (!target) continue;
            for (const reservation of oldLine.reservations) {
              const oldPeriod = oldLine.periods.find((period: any) => period.id === reservation.budgetPeriodId);
              const targetPeriod = oldPeriod ? target.periods.find((period: any) => period.month === oldPeriod.month) : null;
              await tx.budgetReservation.update({ where: { id: reservation.id }, data: { budgetLineId: target.id, budgetPeriodId: targetPeriod?.id || null } });
              await tx.expenseRequest.updateMany({ where: { id: reservation.expenseRequestId, budgetLineId: oldLine.id }, data: { budgetLineId: target.id, budgetPeriodId: targetPeriod?.id || null } });
            }
          }
        }
        return { version: await tx.budgetVersion.findUnique({ where: { id: version.id }, include: { _count: { select: { lines: true } } } }), issues: document.issues, comparison };
      });
    } catch (error: any) { if (error?.code === 'P2002') throw new ConflictException('Este mismo archivo ya fue importado para el ejercicio fiscal.'); throw error; }
  }
  listVersions() { return this.repository.versions(); }
  async getVersion(id: string) { const version = await this.repository.version(id); if (!version) throw new NotFoundException('Versión presupuestaria no encontrada.'); return version; }
  async compareVersions(currentId: string, previousId: string) { const [current, previous] = await Promise.all([this.getVersion(currentId), this.getVersion(previousId)]); return this.compare({ lines: current.lines.map(toSourceLine) }, previous); }
  private provider(type: BudgetSourceType) { return type === BudgetSourceType.EXCEL ? this.excel : this.oracle; }
  private async currency(id: string) { if (!id) throw new BadRequestException('Debe seleccionar la moneda principal del presupuesto.'); const currency = await this.repository.currency(id); if (!currency) throw new BadRequestException('La moneda principal no existe o está inactiva.'); return currency; }
  private async enrichMappings(document: BudgetSourceDocument) { const known = new Set((await this.repository.countryCodes()).map((item) => item.code)); const reported = new Set<string>(); for (const line of document.lines) { const code = countryAlias(line.sourceCountryCode); if ((!code || !known.has(code)) && !reported.has(line.sourceCountryCode)) { reported.add(line.sourceCountryCode); document.issues.push({ severity: 'ERROR', code: 'UNMAPPED_COUNTRY', message: `El valor PAÍS "${line.sourceCountryCode}" no tiene correspondencia en el catálogo activo.`, sheet: document.sourceSheet, row: line.sourceRow, column: 'C' }); } } document.issues.push({ severity: 'WARNING', code: 'COMPANY_NOT_PROVIDED', message: 'El archivo no contiene una columna Empresa. Las líneas se importarán con alcance de país para empresas activas de ese país.' }); }
  private async mapLine(line: BudgetSourceLine, tx: any) { const code = countryAlias(line.sourceCountryCode); const country = code ? await tx.country.findUnique({ where: { code } }) : null; return { countryId: country?.id || null }; }
  private async previewResult(document: BudgetSourceDocument) { const currency = await this.repository.currencyByCode(document.lines[0]?.currency || String(document.metadata.currencyCode || '')); const previous = await this.repository.activeVersion(document.fiscalYear, currency?.id); return { source: { type: document.sourceType, fileName: document.sourceFileName, hash: document.sourceHash, sheet: document.sourceSheet, updatedAt: document.sourceUpdatedAt, fiscalYear: document.fiscalYear, currency: currency || null }, summary: { sourceRows: document.metadata.sourceRows, importRows: document.lines.length, approvedTotal: total(document.lines), errors: document.issues.filter((item) => item.severity === 'ERROR').length, warnings: document.issues.filter((item) => item.severity === 'WARNING').length }, issues: document.issues, preview: document.lines.slice(0, 25), comparison: this.compare(document, previous), canImport: !document.issues.some((item) => item.severity === 'ERROR') }; }
  private compare(document: Pick<BudgetSourceDocument, 'lines'>, previous: any) { if (!previous) return { hasPrevious: false, added: document.lines.length, removed: 0, monthlyChanges: 0, annualChanges: 0, approvedDifference: total(document.lines) }; const old = new Map<string, any>(previous.lines.map((line: any) => [line.naturalKey, line])); const current = new Map<string, BudgetSourceLine>(document.lines.map((line) => [naturalKey(line), line])); let added = 0, removed = 0, monthlyChanges = 0, annualChanges = 0; for (const [key, line] of current) { const prior = old.get(key); if (!prior) { added++; continue; } if (Math.abs(Number(prior.annualAmount) - line.annualAmount) > 0.01) annualChanges++; const periods = new Map<number, number>(prior.periods.map((period: any) => [period.month, Number(period.approvedAmount)])); if (line.months.some((amount, index) => Math.abs((periods.get(index + 1) || 0) - amount) > 0.01)) monthlyChanges++; } for (const key of old.keys()) if (!current.has(key)) removed++; return { hasPrevious: true, previousVersionId: previous.id, added, removed, monthlyChanges, annualChanges, approvedDifference: round(total(document.lines) - Number(previous.approvedTotal)) }; }
}
function countryAlias(value: string) { return ({ GTM: 'GT', HN: 'HN', SLV: 'SV', SV: 'SV', CR: 'CR', NI: 'NI', NIC: 'NI' } as Record<string, string>)[value.trim().toUpperCase()] || null; }
function total(lines: BudgetSourceLine[]) { return round(lines.reduce((sum, line) => sum + line.annualAmount, 0)); }
function round(value: number) { return Math.round((value + Number.EPSILON) * 100) / 100; }
function toSourceLine(line: any): BudgetSourceLine { return { sourceRow: line.sourceRow, sourceCountryCode: line.sourceCountryCode, businessUnit: line.businessUnit, objectCode: line.objectCode, subCode: line.subCode, accountCode: line.accountCode, accountDescription: line.accountDescription, detailDescription: line.detailDescription, area: line.area, frequency: line.frequency, currency: line.currency, annualAmount: Number(line.annualAmount), sourceAnnualAmount: Number(line.sourceAnnualAmount || 0), sourceComment: line.sourceComment, months: line.periods.sort((a: any, b: any) => a.month - b.month).map((period: any) => Number(period.approvedAmount)) }; }
