import { requirePermission, authorizedCompanyId, ocrDocumentWhere } from '../auth/permissions.util';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ApprovalFlowStatus, ApprovalStepStatus, BudgetReservationStatus } from '@prisma/client';
import { DashboardService } from '../dashboard/dashboard.service';
import { ReportQueryDto } from './dto/report-query.dto';
import { ReportsRepository } from './reports.repository';
import { ExportPayload, PaginatedReport } from './reports.types';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly repository: ReportsRepository, private readonly dashboard: DashboardService, private readonly prisma: PrismaService) {}

  async ocr(filters: ReportQueryDto, user: any, paginate = true): Promise<PaginatedReport<any>> {
    requirePermission(user, 'REPORTS_VIEW');
    filters = { ...filters, companyId: authorizedCompanyId(user, filters.companyId, 'OCR_VIEW_ALL') };
    this.validateDateRange(filters);
    const where: any = {
      AND: [ocrDocumentWhere(user)],
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.userId ? { userId: filters.userId } : {}),
      ...(filters.companyId ? { user: { companyId: filters.companyId } } : {}),
      ...(filters.dateFrom || filters.dateTo ? { createdAt: { ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}), ...(filters.dateTo ? { lte: new Date(`${filters.dateTo}T23:59:59.999Z`) } : {}) } } : {}),
      ocrResult: { is: { ...(filters.country ? { countryDetected: filters.country } : {}), ...(filters.documentType ? { documentTypeDetected: filters.documentType } : {}) } },
    };
    const [documents, total] = await Promise.all([
      this.prisma.document.findMany({ where, include: { user: { select: { name: true, company: { select: { name: true } } } }, ocrResult: { include: { extractedFields: { include: { corrections: true } } } } }, orderBy: { createdAt: 'desc' }, ...(paginate ? { skip: (filters.page - 1) * filters.pageSize, take: filters.pageSize } : {}) }),
      this.prisma.document.count({ where }),
    ]);
    const data = documents.map(document => ({ id: document.id, document: document.fileName, company: document.user.company?.name || 'Sin empresa', date: document.createdAt, total: Number(document.ocrResult?.totalAmount || 0), status: document.status, averageConfidence: Number(document.ocrResult?.averageConfidence || 0), user: document.user.name, ocrTimeMs: document.ocrResult?.processingDurationMs || 0, reviewTimeMs: document.ocrResult?.confirmedAt && document.ocrResult?.reviewStartedAt ? document.ocrResult.confirmedAt.getTime() - document.ocrResult.reviewStartedAt.getTime() : null, corrections: document.ocrResult?.extractedFields.reduce((sum, field) => sum + field.corrections.length, 0) || 0, country: document.ocrResult?.countryDetected, documentType: document.ocrResult?.documentTypeDetected }));
    return { data, meta: { page: paginate ? filters.page : 1, pageSize: paginate ? filters.pageSize : total || 1, total, totalPages: paginate ? Math.max(1, Math.ceil(total / filters.pageSize)) : 1 } };
  }

  async budget(filters: ReportQueryDto, user: any, paginate = true): Promise<PaginatedReport<any>> {
    requirePermission(user, 'REPORTS_VIEW');
    filters = { ...filters, companyId: authorizedCompanyId(user, filters.companyId) };
    const lines = (await this.repository.budgetLines(filters)).map((line) => {
      const annualBudget = Number(line.annualAmount);
      const monthlyBudget = line.periods.reduce((sum, period) => sum + Number(period.approvedAmount), 0);
      const usedAmount = line.reservations.filter((item) => item.status === BudgetReservationStatus.EXECUTED).reduce((sum, item) => sum + Number(item.amount), 0);
      const committedAmount = line.reservations.filter((item) => item.status === BudgetReservationStatus.RESERVED).reduce((sum, item) => sum + Number(item.amount), 0);
      const periods = line.periods.map((period) => ({ month: period.month, amount: Number(period.approvedAmount) }));
      const months = Object.fromEntries(Array.from({ length: 12 }, (_, index) => [`month${index + 1}`, periods.find((period) => period.month === index + 1)?.amount || 0]));
      return { id: line.id, company: line.company?.name || 'Sin empresa asociada', country: line.country?.name || 'Sin paÃ­s asociado', businessUnit: line.businessUnit, area: line.area, year: line.version.fiscalYear, account: line.accountCode, accountDescription: line.accountDescription, currency: line.version.currency.code || line.currency, annualBudget, monthlyBudget, ...months, usedAmount, committedAmount, availableBalance: this.round(annualBudget - usedAmount - committedAmount), executedPercentage: annualBudget ? this.round((usedAmount / annualBudget) * 100) : 0, periods };
    });
    const sorted = this.sort(lines, filters.sortBy || 'account', filters.sortOrder);
    const totals = { annualBudget: this.sum(lines, 'annualBudget'), monthlyBudget: this.sum(lines, 'monthlyBudget'), usedAmount: this.sum(lines, 'usedAmount'), committedAmount: this.sum(lines, 'committedAmount'), availableBalance: this.sum(lines, 'availableBalance'), executedPercentage: this.sum(lines, 'annualBudget') ? this.round((this.sum(lines, 'usedAmount') / this.sum(lines, 'annualBudget')) * 100) : 0 };
    return this.paginate(sorted, filters, paginate, totals);
  }

  async requests(filters: ReportQueryDto, user: any, paginate = true): Promise<PaginatedReport<any>> {
    requirePermission(user, 'REPORTS_VIEW');
    filters = { ...filters, companyId: authorizedCompanyId(user, filters.companyId) };
    this.validateDateRange(filters);
    const [rows, total] = await Promise.all([this.repository.requests(filters, paginate), this.repository.countRequests(filters)]);
    const data = rows.map((request) => ({ id: request.id, number: request.code, date: request.createdAt, requester: request.requesterName, area: request.budgetLine?.area || request.budgetReservations[0]?.budgetLine.area || 'Sin Ã¡rea asociada', costCenter: request.costCenter || 'Sin centro de costo', amount: Number(request.estimatedAmount), currency: request.currencyRef?.code || 'GTQ', status: request.status, approvalMinutes: request.approvalFlow?.completedAt ? this.minutes(request.approvalFlow.generatedAt, request.approvalFlow.completedAt) : null }));
    const totals = { amount: data.reduce((sum, item) => sum + item.amount, 0) };
    return { data, meta: { page: paginate ? filters.page : 1, pageSize: paginate ? filters.pageSize : total || 1, total, totalPages: paginate ? Math.max(1, Math.ceil(total / filters.pageSize)) : 1 }, totals };
  }

  async approvals(filters: ReportQueryDto, user: any, paginate = true): Promise<PaginatedReport<any>> {
    requirePermission(user, 'REPORTS_VIEW');
    filters = { ...filters, companyId: authorizedCompanyId(user, filters.companyId) };
    this.validateDateRange(filters);
    const flows = await this.repository.approvalFlows(filters);
    const approved = flows.filter((flow) => flow.status === ApprovalFlowStatus.APROBADA).length;
    const rejected = flows.filter((flow) => flow.status === ApprovalFlowStatus.RECHAZADA).length;
    const pendingStatuses = new Set<ApprovalFlowStatus>([ApprovalFlowStatus.PENDIENTE, ApprovalFlowStatus.EN_REVISION, ApprovalFlowStatus.OBSERVADA]);
    const pending = flows.filter((flow) => pendingStatuses.has(flow.status)).length;
    const completedDurations = flows.filter((flow) => flow.completedAt).map((flow) => this.minutes(flow.generatedAt, flow.completedAt!));
    const people = new Map<string, any>();
    const pendingStepStatuses = new Set<ApprovalStepStatus>([ApprovalStepStatus.PENDIENTE, ApprovalStepStatus.ASIGNADA, ApprovalStepStatus.EN_REVISION, ApprovalStepStatus.OBSERVADA]);
    flows.flatMap((flow) => flow.steps).forEach((step) => { const person = step.assignedUser || step.decidedByUser; if (!person) return; const row = people.get(person.id) || { id: person.id, approver: person.name, total: 0, approved: 0, rejected: 0, pending: 0, durations: [] as number[] }; row.total++; if (step.status === ApprovalStepStatus.APROBADA) row.approved++; else if (step.status === ApprovalStepStatus.RECHAZADA) row.rejected++; else if (pendingStepStatuses.has(step.status)) row.pending++; if (step.decidedAt) row.durations.push(this.minutes(step.assignedAt || step.createdAt, step.decidedAt)); people.set(person.id, row); });
    const rows = [...people.values()].map(({ durations, ...row }) => ({ ...row, averageApprovalMinutes: this.average(durations) }));
    const sorted = this.sort(rows, filters.sortBy || 'total', filters.sortOrder || 'desc');
    return this.paginate(sorted, filters, paginate, { approved, rejected, pending, averageApprovalMinutes: this.average(completedDurations) });
  }

  async policies(filters: ReportQueryDto, user: any, paginate = true): Promise<PaginatedReport<any>> {
    requirePermission(user, 'REPORTS_VIEW');
    filters = { ...filters, companyId: authorizedCompanyId(user, filters.companyId) };
    this.validateDateRange(filters);
    const validations = await this.repository.policyValidations(filters);
    const codes = [...new Set(validations.map((item) => item.type.slice('POLITICA:'.length)))];
    const rules = new Map((await this.repository.policyRules(codes)).map((rule) => [rule.code, rule.name]));
    const grouped = new Map<string, { code: string; policy: string; violations: number; requests: Set<string> }>();
    validations.forEach((validation) => { const code = validation.type.slice('POLITICA:'.length); const row = grouped.get(code) || { code, policy: rules.get(code) || code, violations: 0, requests: new Set<string>() }; row.violations++; row.requests.add(validation.requestId); grouped.set(code, row); });
    const rows = [...grouped.values()].map((row) => ({ code: row.code, policy: row.policy, violations: row.violations, affectedRequests: row.requests.size }));
    const sorted = this.sort(rows, filters.sortBy || 'violations', filters.sortOrder || 'desc');
    return this.paginate(sorted, filters, paginate, { violations: rows.reduce((sum, row) => sum + row.violations, 0), affectedRequests: new Set(validations.map((item) => item.requestId)).size });
  }

  async executive(filters: ReportQueryDto, user: any) {
    requirePermission(user, 'REPORTS_VIEW');
    filters = { ...filters, companyId: authorizedCompanyId(user, filters.companyId) };
    this.validateDateRange(filters);
    const dashboardFilters = { companyId: filters.companyId, countryId: filters.countryId, dateFrom: filters.dateFrom, dateTo: filters.dateTo, status: filters.status, type: filters.expenseType, costCenter: filters.costCenter, requesterId: filters.requesterId };
    const [summary, budget, workflow, policies, approvals, charts, trends] = await Promise.all([this.dashboard.summary(dashboardFilters, user), this.dashboard.budget(dashboardFilters, user), this.dashboard.workflow(dashboardFilters, user), this.dashboard.policies(dashboardFilters, user), this.dashboard.approvals(dashboardFilters, user), this.dashboard.charts(dashboardFilters, user), this.dashboard.trends(dashboardFilters, user)]);
    return { summary, budget, workflow, policies, approvals, charts, trends };
  }

  filters(user: any) { requirePermission(user, 'REPORTS_VIEW'); return this.repository.filters(authorizedCompanyId(user)); }

  async exportPayload(kind: string, filters: ReportQueryDto, user: any): Promise<ExportPayload> {
    if (kind === 'ocr') { const result = await this.ocr(filters, user, false); return { title: 'Reporte OCR', fileName: 'reporte-ocr', columns: [{ header: 'Documento', key: 'document', width: 24 }, { header: 'Empresa', key: 'company', width: 20 }, { header: 'Fecha', key: 'date', width: 16, format: 'date' }, { header: 'Total', key: 'total', width: 12, format: 'money' }, { header: 'Estado', key: 'status', width: 18 }, { header: 'Confianza promedio', key: 'averageConfidence', width: 16 }, { header: 'Usuario', key: 'user', width: 20 }, { header: 'Tiempo OCR ms', key: 'ocrTimeMs', width: 14 }, { header: 'Tiempo revision ms', key: 'reviewTimeMs', width: 16 }, { header: 'Correcciones', key: 'corrections', width: 12 }], rows: result.data }; }
    if (kind === 'budget') { const result = await this.budget(filters, user, false); const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']; const monthColumns = monthNames.map((header, index) => ({ header, key: `month${index + 1}`, width: 12, format: 'money' as const })); const monthTotals = Object.fromEntries(Array.from({ length: 12 }, (_, index) => [`month${index + 1}`, this.sum(result.data, `month${index + 1}`)])); return { title: 'Reporte de Presupuesto', fileName: 'reporte-presupuesto', columns: [{ header: 'Empresa', key: 'company', width: 18 }, { header: 'PaÃ­s', key: 'country', width: 14 }, { header: 'Unidad', key: 'businessUnit', width: 14 }, { header: 'Ãrea', key: 'area', width: 14 }, { header: 'AÃ±o', key: 'year', width: 8 }, { header: 'Cuenta', key: 'account', width: 12 }, { header: 'Presupuesto anual', key: 'annualBudget', width: 16, format: 'money' }, ...monthColumns, { header: 'Utilizado', key: 'usedAmount', width: 14, format: 'money' }, { header: 'Comprometido', key: 'committedAmount', width: 14, format: 'money' }, { header: 'Disponible', key: 'availableBalance', width: 14, format: 'money' }, { header: '% ejecutado', key: 'executedPercentage', width: 11 }], rows: result.data, totals: { company: 'TOTALES', ...monthTotals, ...result.totals } }; }
    if (kind === 'requests') { const result = await this.requests(filters, user, false); return { title: 'Reporte de Solicitudes', fileName: 'reporte-solicitudes', columns: [{ header: 'NÃºmero', key: 'number', width: 15 }, { header: 'Fecha', key: 'date', width: 16, format: 'date' }, { header: 'Solicitante', key: 'requester', width: 18 }, { header: 'Ãrea', key: 'area', width: 16 }, { header: 'Centro de costo', key: 'costCenter', width: 15 }, { header: 'Monto', key: 'amount', width: 14, format: 'money' }, { header: 'Moneda', key: 'currency', width: 9 }, { header: 'Estado', key: 'status', width: 16 }, { header: 'Tiempo aprobaciÃ³n', key: 'approvalMinutes', width: 15, format: 'duration' }], rows: result.data, totals: { number: 'TOTALES', ...result.totals } }; }
    if (kind === 'approvals') { const result = await this.approvals(filters, user, false); return { title: 'Reporte de Aprobaciones', fileName: 'reporte-aprobaciones', columns: [{ header: 'Aprobador', key: 'approver', width: 24 }, { header: 'Cantidad', key: 'total', width: 11 }, { header: 'Aprobadas', key: 'approved', width: 11 }, { header: 'Rechazadas', key: 'rejected', width: 11 }, { header: 'Pendientes', key: 'pending', width: 11 }, { header: 'Promedio aprobaciÃ³n', key: 'averageApprovalMinutes', width: 17, format: 'duration' }], rows: result.data, totals: { approver: 'RESUMEN', ...result.totals } }; }
    if (kind === 'policies') { const result = await this.policies(filters, user, false); return { title: 'Reporte de PolÃ­ticas', fileName: 'reporte-politicas', columns: [{ header: 'CÃ³digo', key: 'code', width: 18 }, { header: 'PolÃ­tica', key: 'policy', width: 34 }, { header: 'Incumplimientos', key: 'violations', width: 16 }, { header: 'Solicitudes afectadas', key: 'affectedRequests', width: 18 }], rows: result.data, totals: { policy: 'TOTALES', ...result.totals } }; }
    if (kind === 'executive') { const value = await this.executive(filters, user); const rows = [{ indicator: 'Presupuesto utilizado', value: value.budget.executed }, { indicator: 'Presupuesto disponible', value: value.budget.available }, { indicator: 'Solicitudes', value: value.summary.total }, { indicator: 'Aprobaciones completadas', value: value.summary.approved }, { indicator: 'SLA vencidas', value: value.workflow.overdueRequests }, { indicator: 'Incumplimientos', value: value.policies.violations }]; return { title: 'Reporte Ejecutivo', fileName: 'reporte-ejecutivo', columns: [{ header: 'Indicador', key: 'indicator', width: 32 }, { header: 'Valor', key: 'value', width: 20 }], rows }; }
    throw new BadRequestException('Tipo de reporte no vÃ¡lido.');
  }

  private paginate<T>(rows: T[], filters: ReportQueryDto, paginate: boolean, totals?: Record<string, number>): PaginatedReport<T> { const total = rows.length; const data = paginate ? rows.slice((filters.page - 1) * filters.pageSize, filters.page * filters.pageSize) : rows; return { data, meta: { page: paginate ? filters.page : 1, pageSize: paginate ? filters.pageSize : total || 1, total, totalPages: paginate ? Math.max(1, Math.ceil(total / filters.pageSize)) : 1 }, totals }; }
  private sort<T extends Record<string, any>>(rows: T[], key: string, direction: 'asc' | 'desc' = 'asc') { return [...rows].sort((a, b) => { const left = a[key], right = b[key]; const result = typeof left === 'number' && typeof right === 'number' ? left - right : String(left ?? '').localeCompare(String(right ?? ''), 'es'); return direction === 'desc' ? -result : result; }); }
  private validateDateRange(filters: ReportQueryDto) { if (filters.dateFrom && filters.dateTo && filters.dateFrom > filters.dateTo) throw new BadRequestException('La fecha inicial no puede ser posterior a la fecha final.'); }
  private minutes(start: Date, end: Date) { return Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000)); }
  private average(values: number[]) { return values.length ? this.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0; }
  private sum(rows: Record<string, any>[], key: string) { return this.round(rows.reduce((sum, row) => sum + Number(row[key] || 0), 0)); }
  private round(value: number) { return Math.round((value + Number.EPSILON) * 100) / 100; }
}


