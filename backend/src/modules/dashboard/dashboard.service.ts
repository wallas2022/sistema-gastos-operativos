import { requirePermission, authorizedCompanyId } from '../auth/permissions.util';
import { Injectable } from '@nestjs/common';
import { ApprovalFlowStatus, ApprovalStepStatus, BudgetReservationStatus, ExpenseRequestStatus, ExpenseType, Prisma, RequestPriority } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SlaService } from '../workflow/sla.service';

export interface DashboardFilters { companyId?: string; countryId?: string; dateFrom?: string; dateTo?: string; status?: string; priority?: string; type?: string; costCenter?: string; requesterId?: string; }

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService, private readonly sla: SlaService) {}

  async summary(filters: DashboardFilters, user: any) {
    requirePermission(user, 'REPORTS_VIEW');
    filters = { ...filters, companyId: authorizedCompanyId(user, filters.companyId) };
    const where = this.requestWhere(filters);
    const [total, grouped] = await Promise.all([this.prisma.expenseRequest.count({ where }), this.prisma.expenseRequest.groupBy({ by: ['status'], where, _count: { _all: true } })]);
    const counts = this.countMap(grouped, 'status');
    return { total, drafts: counts.BORRADOR || 0, pending: this.sumKeys(counts, ['ENVIADA', 'EN_REVISION', 'PENDIENTE_APROBACION', 'VALIDADA']), approved: counts.APROBADA || 0, rejected: counts.RECHAZADA || 0, observed: counts.OBSERVADA || 0, cancelled: counts.CANCELADA || 0 };
  }

  async budget(filters: DashboardFilters, user: any) {
    requirePermission(user, 'REPORTS_VIEW');
    filters = { ...filters, companyId: authorizedCompanyId(user, filters.companyId) };
    const version = await this.prisma.budgetVersion.findFirst({ where: { active: true, ...(filters.companyId ? { lines: { some: { companyId: filters.companyId } } } : {}) }, include: { currency: true }, orderBy: [{ fiscalYear: 'desc' }, { versionNumber: 'desc' }] });
    if (!version) return { version: null, approved: 0, reserved: 0, executed: 0, available: 0, consumptionPercentage: 0 };
    const lineWhere: Prisma.BudgetLineWhereInput = { versionId: version.id, companyId: filters.companyId || undefined, countryId: filters.countryId || undefined };
    const [approvedResult, reservations] = await Promise.all([
      this.prisma.budgetLine.aggregate({ where: lineWhere, _sum: { annualAmount: true } }),
      this.prisma.budgetReservation.groupBy({ by: ['status'], where: { budgetLine: lineWhere, expenseRequest: this.requestWhere(filters) }, _sum: { amount: true } }),
    ]);
    const totals = new Map(reservations.map((item) => [item.status, Number(item._sum.amount || 0)]));
    const approved = Number(approvedResult._sum.annualAmount || 0), reserved = totals.get(BudgetReservationStatus.RESERVED) || 0, executed = totals.get(BudgetReservationStatus.EXECUTED) || 0;
    return { version: { id: version.id, fiscalYear: version.fiscalYear, versionNumber: version.versionNumber, sourceFileName: version.sourceFileName }, currency: version.currency.code, approved, reserved, executed, available: this.round(approved - reserved - executed), consumptionPercentage: approved ? this.round(((reserved + executed) / approved) * 100) : 0 };
  }

  async workflow(filters: DashboardFilters, user: any) {
    requirePermission(user, 'REPORTS_VIEW');
    filters = { ...filters, companyId: authorizedCompanyId(user, filters.companyId) };
    const requestWhere = this.requestWhere(filters);
    const [pendingFlows, completed, activeSteps] = await Promise.all([
      this.prisma.approvalFlow.count({ where: { expenseRequest: requestWhere, status: { in: [ApprovalFlowStatus.PENDIENTE, ApprovalFlowStatus.EN_REVISION, ApprovalFlowStatus.OBSERVADA] } } }),
      this.prisma.approvalFlow.findMany({ where: { expenseRequest: requestWhere, completedAt: { not: null } }, select: { generatedAt: true, completedAt: true } }),
      this.prisma.approvalStep.findMany({ where: { status: { in: [ApprovalStepStatus.ASIGNADA, ApprovalStepStatus.EN_REVISION, ApprovalStepStatus.OBSERVADA] }, flow: { expenseRequest: requestWhere } }, include: { flow: { include: { expenseRequest: true } }, assignedUser: { select: { id: true, name: true } } } }),
    ]);
    const slaResults = await Promise.all(activeSteps.filter((step) => step.flow.expenseRequest).map((step) => this.sla.calculate(step.assignedAt || step.createdAt, step.flow.expenseRequest!.priority)));
    return { pendingRequests: pendingFlows, averageApprovalMinutes: this.average(completed.map((flow) => this.minutes(flow.generatedAt, flow.completedAt!))), overdueRequests: slaResults.filter((item) => item.overdueMinutes > 0).length, sla: { green: slaResults.filter((item) => item.indicator === 'GREEN').length, yellow: slaResults.filter((item) => item.indicator === 'YELLOW').length, red: slaResults.filter((item) => item.indicator === 'RED').length, expired: slaResults.filter((item) => item.overdueMinutes > 0).length }, averageByApprover: this.averageSteps(activeSteps) };
  }

  async policies(filters: DashboardFilters, user: any) {
    requirePermission(user, 'REPORTS_VIEW');
    filters = { ...filters, companyId: authorizedCompanyId(user, filters.companyId) };
    const grouped = await this.prisma.expenseRequestValidation.groupBy({ by: ['status'], where: { type: { startsWith: 'POLITICA:' }, request: this.requestWhere(filters) }, _count: { _all: true } });
    const counts = this.countMap(grouped, 'status');
    return { evaluated: Object.values(counts).reduce<number>((sum, value) => sum + Number(value), 0), warnings: counts.WARNING || 0, violations: counts.ERROR || 0, approvalRequired: counts.APPROVAL_REQUIRED || 0, ok: counts.OK || 0, notApplicable: counts.NOT_APPLICABLE || 0 };
  }

  async approvals(filters: DashboardFilters, user: any) {
    requirePermission(user, 'REPORTS_VIEW');
    filters = { ...filters, companyId: authorizedCompanyId(user, filters.companyId) };
    const steps = await this.prisma.approvalStep.findMany({ where: { flow: { expenseRequest: this.requestWhere(filters) } }, include: { assignedUser: { select: { id: true, name: true } }, decidedByUser: { select: { id: true, name: true } } } });
    const users = new Map<string, { userId: string; name: string; pending: number; approved: number; durations: number[] }>();
    const pendingStatuses = new Set<ApprovalStepStatus>([ApprovalStepStatus.ASIGNADA, ApprovalStepStatus.EN_REVISION, ApprovalStepStatus.OBSERVADA]);
    for (const step of steps) { const person = step.assignedUser || step.decidedByUser; if (!person) continue; const item = users.get(person.id) || { userId: person.id, name: person.name, pending: 0, approved: 0, durations: [] }; if (pendingStatuses.has(step.status)) item.pending++; if (step.status === ApprovalStepStatus.APROBADA) item.approved++; if (step.decidedAt) item.durations.push(this.minutes(step.assignedAt || step.createdAt, step.decidedAt)); users.set(person.id, item); }
    return [...users.values()].map(({ durations, ...item }) => ({ ...item, averageMinutes: this.average(durations) })).sort((a, b) => b.pending - a.pending || b.approved - a.approved);
  }

  async charts(filters: DashboardFilters, user: any) {
    requirePermission(user, 'REPORTS_VIEW');
    filters = { ...filters, companyId: authorizedCompanyId(user, filters.companyId) };
    const requests = await this.prisma.expenseRequest.findMany({ where: this.requestWhere(filters), select: { type: true, costCenter: true, budgetAccount: true, estimatedAmount: true, company: { select: { id: true, name: true } }, Country: { select: { id: true, name: true } }, budgetReservations: { where: { status: { in: [BudgetReservationStatus.RESERVED, BudgetReservationStatus.EXECUTED] } }, select: { amount: true, status: true } } } });
    return { companies: this.dimension(requests, (r) => r.company?.name || r.company?.id || 'Sin empresa'), countries: this.dimension(requests, (r) => r.Country?.name || 'Sin país'), expenseTypes: this.dimension(requests, (r) => r.type).slice(0, 10), costCenters: this.dimension(requests, (r) => r.costCenter).slice(0, 10), budgetAccounts: this.dimension(requests, (r) => r.budgetAccount || 'Sin cuenta').slice(0, 10) };
  }

  async trends(filters: DashboardFilters, user: any) {
    requirePermission(user, 'REPORTS_VIEW');
    filters = { ...filters, companyId: authorizedCompanyId(user, filters.companyId) };
    const rows = await this.prisma.expenseRequest.findMany({ where: this.requestWhere(filters), select: { createdAt: true, estimatedAmount: true }, orderBy: { createdAt: 'asc' } });
    return { daily: this.timeSeries(rows, 'day'), weekly: this.timeSeries(rows, 'week'), monthly: this.timeSeries(rows, 'month') };
  }

  async filters(user: any) { requirePermission(user, 'REPORTS_VIEW'); const companyId = authorizedCompanyId(user); const [companies, countries, users] = await Promise.all([this.prisma.company.findMany({ where: { active: true, id: companyId }, select: { id: true, name: true }, orderBy: { name: 'asc' } }), this.prisma.country.findMany({ where: { active: true }, select: { id: true, name: true }, orderBy: { name: 'asc' } }), this.prisma.user.findMany({ where: { active: true, companyId }, select: { id: true, name: true }, orderBy: { name: 'asc' } })]); return { companies, countries, users, statuses: Object.values(ExpenseRequestStatus), priorities: Object.values(RequestPriority), expenseTypes: Object.values(ExpenseType) }; }

  private requestWhere(filters: DashboardFilters): Prisma.ExpenseRequestWhereInput { const createdAt: Prisma.DateTimeFilter = {}; if (filters.dateFrom) createdAt.gte = new Date(`${filters.dateFrom}T00:00:00`); if (filters.dateTo) createdAt.lte = new Date(`${filters.dateTo}T23:59:59.999`); return { companyId: filters.companyId || undefined, countryId: filters.countryId || undefined, createdAt: Object.keys(createdAt).length ? createdAt : undefined, status: filters.status as ExpenseRequestStatus || undefined, priority: filters.priority as RequestPriority || undefined, type: filters.type as ExpenseType || undefined, costCenter: filters.costCenter ? { contains: filters.costCenter, mode: 'insensitive' } : undefined, requesterId: filters.requesterId || undefined }; }
  private countMap(rows: any[], key: string) { return rows.reduce((map, row) => ({ ...map, [row[key]]: row._count._all }), {} as Record<string, number>); }
  private sumKeys(map: Record<string, number>, keys: string[]) { return keys.reduce((sum, key) => sum + (map[key] || 0), 0); }
  private minutes(start: Date, end: Date) { return Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000)); }
  private average(values: number[]) { return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0; }
  private averageSteps(steps: any[]) { const grouped = new Map<string, { userId: string; name: string; values: number[] }>(); for (const step of steps) { if (!step.assignedUser) continue; const item = grouped.get(step.assignedUser.id) || { userId: step.assignedUser.id, name: step.assignedUser.name, values: [] }; item.values.push(Math.max(0, Math.floor((Date.now() - new Date(step.assignedAt || step.createdAt).getTime()) / 60000))); grouped.set(item.userId, item); } return [...grouped.values()].map((item) => ({ userId: item.userId, name: item.name, averageMinutes: this.average(item.values) })).sort((a, b) => b.averageMinutes - a.averageMinutes); }
  private dimension(rows: any[], label: (row: any) => string) { const grouped = new Map<string, { label: string; requests: number; amount: number; reserved: number; executed: number }>(); for (const row of rows) { const key = label(row); const item = grouped.get(key) || { label: key, requests: 0, amount: 0, reserved: 0, executed: 0 }; item.requests++; item.amount += Number(row.estimatedAmount); for (const reservation of row.budgetReservations) { if (reservation.status === BudgetReservationStatus.RESERVED) item.reserved += Number(reservation.amount); if (reservation.status === BudgetReservationStatus.EXECUTED) item.executed += Number(reservation.amount); } grouped.set(key, item); } return [...grouped.values()].map((item) => ({ ...item, amount: this.round(item.amount), reserved: this.round(item.reserved), executed: this.round(item.executed) })).sort((a, b) => b.amount - a.amount); }
  private timeSeries(rows: any[], unit: 'day' | 'week' | 'month') { const grouped = new Map<string, { period: string; count: number; amount: number }>(); for (const row of rows) { const date = new Date(row.createdAt); let period = date.toISOString().slice(0, 10); if (unit === 'month') period = period.slice(0, 7); if (unit === 'week') { const monday = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() - ((date.getUTCDay() + 6) % 7))); period = monday.toISOString().slice(0, 10); } const item = grouped.get(period) || { period, count: 0, amount: 0 }; item.count++; item.amount += Number(row.estimatedAmount); grouped.set(period, item); } return [...grouped.values()].map((item) => ({ ...item, amount: this.round(item.amount) })); }
  private round(value: number) { return Math.round((value + Number.EPSILON) * 100) / 100; }
}
