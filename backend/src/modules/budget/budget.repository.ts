import { Injectable } from '@nestjs/common';
import { BudgetReservationStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BudgetRepository {
  constructor(private readonly prisma: PrismaService) {}
  countryCodes() { return this.prisma.country.findMany({ select: { code: true } }); }
  currency(id: string) { return this.prisma.currency.findFirst({ where: { id, active: true } }); }
  currencyByCode(code: string) { return this.prisma.currency.findFirst({ where: { code, active: true } }); }
  request(id: string, tx: any = this.prisma) { return tx.expenseRequest.findUnique({ where: { id }, include: { company: true, Country: true, currencyRef: true, budgetCurrency: true, budgetLine: { include: { version: { include: { currency: true } } } }, budgetPeriod: true } }); }
  activeVersion(year: number, currencyId?: string, tx: any = this.prisma) { return tx.budgetVersion.findFirst({ where: { fiscalYear: year, currencyId, active: true, status: 'ACTIVE' }, include: { currency: true, lines: { include: { periods: true } } } }); }
  versions() { return this.prisma.budgetVersion.findMany({ orderBy: [{ fiscalYear: 'desc' }, { versionNumber: 'desc' }], include: { currency: true, importedBy: { select: { id: true, name: true, email: true } }, _count: { select: { lines: true } } } }); }
  version(id: string) { return this.prisma.budgetVersion.findUnique({ where: { id }, include: { currency: true, importedBy: { select: { id: true, name: true, email: true } }, lines: { include: { periods: { orderBy: { month: 'asc' } } }, orderBy: { sourceRow: 'asc' } } } }); }
  async matchingLines(input: { year: number; accountCode: string; countryId?: string | null; companyId?: string | null }, tx: any = this.prisma) { return tx.budgetLine.findMany({ where: { version: { fiscalYear: input.year, active: true }, accountCode: input.accountCode, OR: [{ companyId: input.companyId || undefined }, { companyId: null, countryId: input.countryId || undefined }] }, include: { periods: true, reservations: true }, orderBy: { sourceRow: 'asc' } }); }
  selectedLine(lineId: string, periodId: string, tx: any = this.prisma) { return tx.budgetLine.findUnique({ where: { id: lineId }, include: { version: { include: { currency: true } }, periods: { where: { id: periodId } }, reservations: true } }); }
  transaction<T>(operation: (tx: Prisma.TransactionClient) => Promise<T>) { return this.prisma.$transaction(operation, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }); }
  reservationTotals(lineIds: string[], tx: any = this.prisma) { return tx.budgetReservation.groupBy({ by: ['status'], where: { budgetLineId: { in: lineIds } }, _sum: { amount: true } }); }
  periodReservationTotals(periodId: string, tx: any = this.prisma) { return tx.budgetReservation.groupBy({ by: ['status'], where: { budgetPeriodId: periodId }, _sum: { amount: true } }); }
  requestReservations(requestId: string, tx: any = this.prisma) { return tx.budgetReservation.findMany({ where: { expenseRequestId: requestId }, include: { budgetLine: true } }); }
  static reservedStatuses() { return [BudgetReservationStatus.RESERVED]; }
}
