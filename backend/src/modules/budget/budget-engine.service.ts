import { Injectable, NotFoundException } from '@nestjs/common';
import { BudgetReservationStatus, Prisma } from '@prisma/client';
import { BudgetRepository } from './budget.repository';
import { BudgetEvaluationInput, BudgetEvaluationResult } from './domain/budget-evaluation.types';

@Injectable()
export class BudgetEngineService {
  constructor(private readonly repository: BudgetRepository) {}

  async evaluate(input: BudgetEvaluationInput, tx?: any): Promise<BudgetEvaluationResult> {
    const base = { approved: 0, reserved: 0, committed: 0, executed: 0, available: 0, balance: 0, consumedPercentage: 0, monthlyApproved: 0, monthlyCommitted: 0, monthlyExecuted: 0, monthlyAvailable: 0, monthlyBalance: 0, detail: { lineIds: [] as string[], fiscalYear: input.fiscalYear, month: input.month, accountCode: input.accountCode, currency: input.currency } };
    if (!input.budgetLineId || !input.budgetPeriodId) return { ...base, status: 'NO_APPLIES', message: 'La solicitud no tiene una partida y período presupuestarios seleccionados.' };
    const line = await this.repository.selectedLine(input.budgetLineId, input.budgetPeriodId, tx);
    if (!line) return { ...base, status: 'NOT_FOUND', message: 'La partida presupuestaria seleccionada no existe.' };
    const budgetCurrency = line.version.currency.code;
    const detail = { ...base.detail, versionId: line.version.id, lineIds: [line.id], budgetPeriodId: input.budgetPeriodId, accountCode: line.accountCode, currency: budgetCurrency };
    if (!line.version.active || line.version.status !== 'ACTIVE') return { ...base, detail, status: 'CLOSED', message: 'La partida no pertenece a un presupuesto activo.' };
    const period = line.periods[0];
    if (!period || period.fiscalYear !== input.fiscalYear || period.month !== input.month) return { ...base, detail, status: 'NOT_FOUND', message: 'El período no corresponde al año y mes de la solicitud.' };
    if (line.version.fiscalYear !== input.fiscalYear) return { ...base, detail, status: 'NOT_FOUND', message: 'La partida no corresponde al ejercicio de la solicitud.' };
    if ((line.companyId && line.companyId !== input.companyId) || (line.countryId && line.countryId !== input.countryId)) return { ...base, detail, status: 'NOT_FOUND', message: 'La partida no corresponde a la empresa o país de la solicitud.' };
    if (line.currency !== budgetCurrency || input.currency !== budgetCurrency) return { ...base, detail, status: 'NO_APPLIES', message: `El impacto presupuestario debe estar expresado en ${budgetCurrency}.` };

    const [annualGroups, monthlyGroups] = await Promise.all([this.repository.reservationTotals([line.id], tx), this.repository.periodReservationTotals(period.id, tx)]);
    const annual = this.amounts(annualGroups), monthly = this.amounts(monthlyGroups);
    const approved = new Prisma.Decimal(line.annualAmount), monthlyApproved = new Prisma.Decimal(period.approvedAmount);
    const available = approved.minus(annual.reserved).minus(annual.executed).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
    const monthlyAvailable = monthlyApproved.minus(monthly.reserved).minus(monthly.executed).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
    const amount = new Prisma.Decimal(input.amount).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
    const effectiveAvailable = Prisma.Decimal.min(available, monthlyAvailable);
    const status = effectiveAvailable.gte(amount) ? 'AVAILABLE' : effectiveAvailable.gt(0) ? 'PARTIAL' : 'INSUFFICIENT';
    return {
      status,
      approved: approved.toNumber(), reserved: annual.reserved.toNumber(), committed: annual.reserved.toNumber(), executed: annual.executed.toNumber(), available: available.toNumber(), balance: available.minus(amount).toNumber(),
      consumedPercentage: approved.isZero() ? 0 : annual.reserved.plus(annual.executed).div(approved).mul(100).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP).toNumber(),
      monthlyApproved: monthlyApproved.toNumber(), monthlyCommitted: monthly.reserved.toNumber(), monthlyExecuted: monthly.executed.toNumber(), monthlyAvailable: monthlyAvailable.toNumber(), monthlyBalance: monthlyAvailable.minus(amount).toNumber(),
      detail,
      message: status === 'AVAILABLE' ? 'Presupuesto anual y mensual disponible.' : status === 'PARTIAL' ? 'El saldo mensual o anual cubre solo una parte de la solicitud.' : 'Presupuesto mensual o anual insuficiente.',
    };
  }

  async evaluateRequest(requestId: string, tx?: any) {
    const request = await this.repository.request(requestId, tx);
    if (!request) throw new NotFoundException('Solicitud no encontrada.');
    if (request.budgetAmount === null || !request.budgetCurrency) throw new NotFoundException('La solicitud no tiene un impacto monetario presupuestario registrado.');
    const date = new Date(request.estimatedDate || request.createdAt);
    return this.evaluate({ requestId, fiscalYear: date.getFullYear(), month: date.getMonth() + 1, budgetLineId: request.budgetLineId, budgetPeriodId: request.budgetPeriodId, accountCode: request.budgetAccount, companyId: request.companyId, countryId: request.countryId, currency: request.budgetCurrency.code, amount: request.budgetAmount }, tx);
  }

  private amounts(groups: any[]) {
    const values = new Map(groups.map((item: any) => [item.status, new Prisma.Decimal(item._sum.amount || 0)]));
    return { reserved: values.get(BudgetReservationStatus.RESERVED) || new Prisma.Decimal(0), executed: values.get(BudgetReservationStatus.EXECUTED) || new Prisma.Decimal(0) };
  }
}
