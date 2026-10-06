import { BadRequestException, Injectable } from '@nestjs/common';
import { BudgetReservationStatus, Prisma } from '@prisma/client';
import { BudgetEngineService } from './budget-engine.service';
import { BudgetRepository } from './budget.repository';

@Injectable()
export class BudgetReservationService {
  constructor(private readonly repository: BudgetRepository, private readonly engine: BudgetEngineService) {}

  async reserve(requestId: string) {
    return this.repository.transaction(async (tx) => {
      const request = await this.repository.request(requestId, tx);
      if (!request) throw new BadRequestException('Solicitud no encontrada.');
      await this.lockBudgetScope(tx, request.budgetLineId, request.budgetPeriodId);
      const existing = await this.repository.requestReservations(requestId, tx);
      const active = existing.find((item: any) => item.status === BudgetReservationStatus.RESERVED || item.status === BudgetReservationStatus.EXECUTED);
      if (active) return existing;
      const result = await this.engine.evaluateRequest(requestId, tx);
      await this.validation(tx, requestId, result.status, result.message);
      if (result.status !== 'AVAILABLE') throw new BadRequestException(result.message);
      const reusable = existing.find((item: any) => item.status === BudgetReservationStatus.RELEASED && item.budgetLineId === request.budgetLineId);
      if (reusable) {
        await tx.budgetReservation.update({ where: { id: reusable.id }, data: { amount: request.budgetAmount, budgetPeriodId: request.budgetPeriodId, currency: request.budgetCurrency.code, status: BudgetReservationStatus.RESERVED, reservedAt: new Date(), releasedAt: null, releaseReason: null, executedAt: null } });
      } else {
        await tx.budgetReservation.create({ data: { expenseRequestId: requestId, budgetLineId: request.budgetLineId, budgetPeriodId: request.budgetPeriodId, amount: request.budgetAmount, currency: request.budgetCurrency.code, status: BudgetReservationStatus.RESERVED } });
      }
      await this.trace(tx, request, 'PRESUPUESTO_RESERVADO', `Reserva presupuestaria por ${request.budgetCurrency.code} ${Number(request.budgetAmount).toFixed(2)} (original ${request.currency} ${Number(request.estimatedAmount).toFixed(2)}, tasa ${request.exchangeRate}) en ${result.detail.fiscalYear}-${String(result.detail.month).padStart(2, '0')}.`);
      return this.repository.requestReservations(requestId, tx);
    });
  }

  /** Reconciles an existing reservation after an editable request changed. */
  async reconcile(requestId: string) {
    return this.repository.transaction(async (tx) => {
      const request = await this.repository.request(requestId, tx);
      if (!request) throw new BadRequestException('Solicitud no encontrada.');
      await this.lockBudgetScope(tx, request.budgetLineId, request.budgetPeriodId);
      const reservations = await this.repository.requestReservations(requestId, tx);
      const active = reservations.find((item: any) => item.status === BudgetReservationStatus.RESERVED);
      if (!active) return this.reserveInTransaction(tx, request, reservations);
      if (active.budgetLineId !== request.budgetLineId || active.budgetPeriodId !== request.budgetPeriodId || active.currency !== request.budgetCurrency.code) {
        await this.lockBudgetScope(tx, active.budgetLineId, active.budgetPeriodId);
        await tx.budgetReservation.update({ where: { id: active.id }, data: { status: BudgetReservationStatus.RELEASED, releasedAt: new Date(), releaseReason: 'Reasignación presupuestaria por modificación de solicitud.' } });
        return this.reserveInTransaction(tx, request, reservations);
      }
      const oldAmount = new Prisma.Decimal(active.amount);
      const newAmount = new Prisma.Decimal(request.budgetAmount);
      const delta = newAmount.minus(oldAmount);
      if (delta.isZero()) return reservations;
      if (delta.gt(0)) {
        const result = await this.engine.evaluateRequest(requestId, tx);
        const effectiveAnnual = new Prisma.Decimal(result.available).plus(oldAmount);
        const effectiveMonthly = new Prisma.Decimal(result.monthlyAvailable).plus(oldAmount);
        if (Prisma.Decimal.min(effectiveAnnual, effectiveMonthly).lt(newAmount)) throw new BadRequestException('El nuevo importe excede la disponibilidad presupuestaria.');
      }
      await tx.budgetReservation.update({ where: { id: active.id }, data: { amount: newAmount } });
      await this.trace(tx, request, delta.gt(0) ? 'PRESUPUESTO_RESERVA_AUMENTADA' : 'PRESUPUESTO_RESERVA_REDUCIDA', `Ajuste de reserva por ${delta.toFixed(2)} ${request.budgetCurrency.code}.`);
      return this.repository.requestReservations(requestId, tx);
    });
  }

  async release(requestId: string, reason: string) {
    return this.repository.transaction(async (tx) => {
      const request = await this.repository.request(requestId, tx);
      if (!request) return [];
      await this.lockBudgetScope(tx, request.budgetLineId, request.budgetPeriodId);
      const changed = await tx.budgetReservation.updateMany({ where: { expenseRequestId: requestId, status: BudgetReservationStatus.RESERVED }, data: { status: BudgetReservationStatus.RELEASED, releasedAt: new Date(), releaseReason: reason } });
      if (changed.count) await this.trace(tx, request, 'PRESUPUESTO_LIBERADO', reason);
      return this.repository.requestReservations(requestId, tx);
    });
  }

  async execute(requestId: string) {
    return this.repository.transaction(async (tx) => {
      const request = await this.repository.request(requestId, tx);
      if (!request) return [];
      await this.lockBudgetScope(tx, request.budgetLineId, request.budgetPeriodId);
      const changed = await tx.budgetReservation.updateMany({ where: { expenseRequestId: requestId, status: BudgetReservationStatus.RESERVED }, data: { status: BudgetReservationStatus.EXECUTED, executedAt: new Date() } });
      if (changed.count) await this.trace(tx, request, 'PRESUPUESTO_EJECUTADO', 'La reserva fue convertida en ejecución presupuestaria.');
      return this.repository.requestReservations(requestId, tx);
    });
  }

  private async reserveInTransaction(tx: any, request: any, existing: any[]) {
    const result = await this.engine.evaluateRequest(request.id, tx);
    await this.validation(tx, request.id, result.status, result.message);
    if (result.status !== 'AVAILABLE') throw new BadRequestException(result.message);
    const reusable = existing.find((item: any) => item.status === BudgetReservationStatus.RELEASED && item.budgetLineId === request.budgetLineId);
    if (reusable) await tx.budgetReservation.update({ where: { id: reusable.id }, data: { amount: request.budgetAmount, budgetPeriodId: request.budgetPeriodId, currency: request.budgetCurrency.code, status: BudgetReservationStatus.RESERVED, reservedAt: new Date(), releasedAt: null, releaseReason: null, executedAt: null } });
    else await tx.budgetReservation.create({ data: { expenseRequestId: request.id, budgetLineId: request.budgetLineId, budgetPeriodId: request.budgetPeriodId, amount: request.budgetAmount, currency: request.budgetCurrency.code, status: BudgetReservationStatus.RESERVED } });
    await this.trace(tx, request, 'PRESUPUESTO_RESERVADO', `Reserva presupuestaria por ${request.budgetCurrency.code} ${Number(request.budgetAmount).toFixed(2)}.`);
    return this.repository.requestReservations(request.id, tx);
  }

  private async lockBudgetScope(tx: any, lineId?: string | null, periodId?: string | null) {
    if (lineId) await tx.$queryRaw`SELECT id FROM "BudgetLine" WHERE id = ${lineId} FOR UPDATE`;
    if (periodId) await tx.$queryRaw`SELECT id FROM "BudgetPeriod" WHERE id = ${periodId} FOR UPDATE`;
  }
  private validation(tx: any, requestId: string, status: string, message: string) { return tx.expenseRequestValidation.create({ data: { requestId, type: 'BUDGET_AVAILABILITY', status, message } }); }
  private trace(tx: any, request: any, event: string, description: string) { return tx.expenseRequestTrace.create({ data: { requestId: request.id, event, description, userName: 'Budget Engine', fromStatus: request.status, toStatus: request.status } }); }
}
