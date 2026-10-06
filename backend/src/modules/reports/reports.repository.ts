import { Injectable } from '@nestjs/common';
import { ApprovalFlowStatus, BudgetReservationStatus, ExpenseRequestStatus, ExpenseType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ReportQueryDto } from './dto/report-query.dto';

@Injectable()
export class ReportsRepository {
  constructor(private readonly prisma: PrismaService) {}

  budgetLines(filters: ReportQueryDto) {
    return this.prisma.budgetLine.findMany({
      where: {
        version: { active: true, fiscalYear: filters.year },
        companyId: filters.companyId || undefined,
        countryId: filters.countryId || undefined,
        businessUnit: filters.businessUnit ? { contains: filters.businessUnit, mode: 'insensitive' } : undefined,
        area: filters.area ? { contains: filters.area, mode: 'insensitive' } : undefined,
        accountCode: filters.account ? { contains: filters.account, mode: 'insensitive' } : undefined,
      },
      include: {
        version: { select: { fiscalYear: true, currency: { select: { code: true } } } }, company: { select: { id: true, name: true } },
        country: { select: { id: true, name: true } }, periods: { orderBy: { month: 'asc' } },
        reservations: { select: { amount: true, status: true } },
      },
    });
  }

  requestWhere(filters: ReportQueryDto): Prisma.ExpenseRequestWhereInput {
    const createdAt: Prisma.DateTimeFilter = {};
    if (filters.dateFrom) createdAt.gte = new Date(`${filters.dateFrom}T00:00:00.000`);
    if (filters.dateTo) createdAt.lte = new Date(`${filters.dateTo}T23:59:59.999`);
    return {
      companyId: filters.companyId || undefined,
      status: filters.status as ExpenseRequestStatus || undefined,
      requesterId: filters.requesterId || undefined,
      type: filters.expenseType as ExpenseType || undefined,
      costCenter: filters.costCenter ? { contains: filters.costCenter, mode: 'insensitive' } : undefined,
      createdAt: Object.keys(createdAt).length ? createdAt : undefined,
    };
  }

  requests(filters: ReportQueryDto, paginate = true) {
    const allowed = new Set(['code', 'createdAt', 'requesterName', 'costCenter', 'estimatedAmount', 'status']);
    const sortBy = allowed.has(filters.sortBy || '') ? filters.sortBy! : 'createdAt';
    return this.prisma.expenseRequest.findMany({
      where: this.requestWhere(filters),
      skip: paginate ? (filters.page - 1) * filters.pageSize : undefined,
      take: paginate ? filters.pageSize : undefined,
      orderBy: { [sortBy]: filters.sortOrder || 'desc' },
      include: {
        company: { select: { id: true, name: true } },
        currencyRef: { select: { code: true } },
        approvalFlow: { select: { generatedAt: true, completedAt: true } },
        budgetReservations: { select: { budgetLine: { select: { area: true } } } },
        budgetLine: { select: { area: true } },
      },
    });
  }

  countRequests(filters: ReportQueryDto) { return this.prisma.expenseRequest.count({ where: this.requestWhere(filters) }); }

  approvalFlows(filters: ReportQueryDto) {
    return this.prisma.approvalFlow.findMany({
      where: { expenseRequest: this.requestWhere(filters) },
      include: { steps: { include: { assignedUser: { select: { id: true, name: true } }, decidedByUser: { select: { id: true, name: true } } } } },
    });
  }

  policyValidations(filters: ReportQueryDto) {
    return this.prisma.expenseRequestValidation.findMany({
      where: { type: { startsWith: 'POLITICA:' }, status: { in: ['WARNING', 'ERROR'] }, request: this.requestWhere(filters) },
      select: { type: true, status: true, requestId: true },
    });
  }

  policyRules(codes: string[]) {
    return this.prisma.policyRule.findMany({ where: { code: { in: codes } }, select: { code: true, name: true } });
  }

  async filters(companyId?: string) {
    const [companies, countries, users, dimensions, years] = await Promise.all([
      this.prisma.company.findMany({ where: { active: true, id: companyId }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
      this.prisma.country.findMany({ where: { active: true }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
      this.prisma.user.findMany({ where: { active: true, companyId }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
      this.prisma.budgetLine.findMany({ where: { companyId, version: { active: true } }, distinct: ['businessUnit', 'area', 'accountCode'], select: { businessUnit: true, area: true, accountCode: true, accountDescription: true } }),
      this.prisma.budgetVersion.findMany({ where: companyId ? { lines: { some: { companyId } } } : undefined, distinct: ['fiscalYear'], select: { fiscalYear: true }, orderBy: { fiscalYear: 'desc' } }),
    ]);
    return { companies, countries, users, dimensions, years: years.map((item) => item.fiscalYear), statuses: Object.values(ExpenseRequestStatus), expenseTypes: Object.values(ExpenseType), approvalStatuses: Object.values(ApprovalFlowStatus), reservationStatuses: Object.values(BudgetReservationStatus) };
  }
}

