import { authorizedRequestWhere } from '../auth/permissions.util';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ExpenseRequestStatus } from '@prisma/client';
import { ApprovalFlowService } from '../approval/approval-flow.service';
import { ApprovalDecisionService } from '../approval/approval-decision.service';
import { SlaService } from '../workflow/sla.service';

@Injectable()
export class TraceabilityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly approvalFlows: ApprovalFlowService,
    private readonly approvalDecisions: ApprovalDecisionService,
    private readonly sla: SlaService,
  ) {}

 async getPendingAuthorizations(user: any) {
  this.ensureCanViewAuthorizations(user);

  const authorizationStatuses: ExpenseRequestStatus[] = [
    ExpenseRequestStatus.ENVIADA,
    ExpenseRequestStatus.EN_REVISION,
    ExpenseRequestStatus.PENDIENTE_APROBACION,
    ExpenseRequestStatus.VALIDADA,
    ExpenseRequestStatus.OBSERVADA,
  ];

  const requests = await this.prisma.expenseRequest.findMany({
    where: {
      ...await authorizedRequestWhere(this.prisma, user),
      status: {
        in: authorizationStatuses,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      items: true,
      validations: true,
      traces: {
        orderBy: {
          createdAt: 'desc',
        },
        take: 5,
      },
      company: true,
      currencyRef: true,
    },
  });

  return requests.map((request) => this.mapAuthorizationItem(request));
}
  async getFlowDetail(id: string, user: any) {
    await this.assertRequestScope(id, user);
    this.ensureCanViewTraceability(user);

    const request = await this.prisma.expenseRequest.findUnique({
      where: { id },
      include: {
        items: true,
        validations: true,
        traces: {
          orderBy: {
            createdAt: 'asc',
          },
        },
        company: true,
        currencyRef: true,
      },
    });

    if (!request) {
      throw new NotFoundException('Solicitud no encontrada');
    }

    return {
      id: request.id,
      code: request.code,
      type: request.type,
      concept: request.concept,
      requesterName: request.requesterName,
      requesterRole: request.requesterRole,
      companyName: request.companyName,
      costCenter: request.costCenter,
      budgetAccount: request.budgetAccount,
      estimatedAmount: Number(request.estimatedAmount || 0),
      currency: request.currency || request.currencyRef?.code || 'GTQ',
      status: request.status,
      priority: request.priority,
      currentStep: this.resolveCurrentStep(request),
      validations: request.validations,
      traces: request.traces,
      items: request.items,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
    };
  }

  async approve(id: string, comment: string | undefined, user: any) {
    await this.assertRequestScope(id, user);
    return this.approvalDecisions.decideByRequest(id, 'approve', comment, user).then(() => this.findRequestWithDetail(id));
  }

  async reject(id: string, comment: string | undefined, user: any) {
    await this.assertRequestScope(id, user);
    return this.approvalDecisions.decideByRequest(id, 'reject', comment, user).then(() => this.findRequestWithDetail(id));
  }

  async observe(id: string, comment: string | undefined, user: any) {
    await this.assertRequestScope(id, user);
    return this.approvalDecisions.decideByRequest(id, 'observe', comment, user).then(() => this.findRequestWithDetail(id));
  }

  private async findRequestOrFail(id: string) {
    const request = await this.prisma.expenseRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException('Solicitud no encontrada');
    }

    return request;
  }

  private findRequestWithDetail(id: string) {
    return this.prisma.expenseRequest.findUnique({
      where: { id },
      include: {
        items: true,
        validations: true,
        traces: { orderBy: { createdAt: 'asc' } },
        company: true,
        currencyRef: true,
      },
    });
  }

  private mapAuthorizationItem(request: any) {
    return {
      id: request.id,
      code: request.code,
      type: request.type,
      concept: request.concept,
      requesterName: request.requesterName,
      requesterRole: request.requesterRole,
      companyName: request.companyName,
      costCenter: request.costCenter,
      budgetAccount: request.budgetAccount,
      estimatedAmount: Number(request.estimatedAmount || 0),
      currency: request.currency || request.currencyRef?.code || 'GTQ',
      status: request.status,
      priority: request.priority,
      currentStep: this.resolveCurrentStep(request),
      createdAt: request.createdAt,
    };
  }

 private resolveCurrentStep(request: any) {
  const status = String(request.status || '');

  if (status === ExpenseRequestStatus.ENVIADA) {
    return 'Solicitud enviada';
  }

  if (status === ExpenseRequestStatus.EN_REVISION) {
    return 'Revisión administrativa';
  }

  if (status === ExpenseRequestStatus.PENDIENTE_APROBACION) {
    return 'Aprobador asignado';
  }

  if (status === ExpenseRequestStatus.VALIDADA) {
    return 'Validación completada';
  }

  if (status === ExpenseRequestStatus.OBSERVADA) {
    return 'Pendiente de corrección';
  }

  return 'Flujo activo';
}

private canProcessStatus(status: ExpenseRequestStatus) {
  const allowedStatuses: ExpenseRequestStatus[] = [
    ExpenseRequestStatus.ENVIADA,
    ExpenseRequestStatus.EN_REVISION,
    ExpenseRequestStatus.PENDIENTE_APROBACION,
    ExpenseRequestStatus.VALIDADA,
    ExpenseRequestStatus.OBSERVADA,
  ];

  return allowedStatuses.includes(status);
}

  private getUserName(user: any) {
    return user?.name || user?.email || 'Usuario del sistema';
  }

  private ensureCanViewAuthorizations(user: any) {
    const permissions = this.getUserPermissions(user);

    const allowed =
      permissions.includes('EXPENSE_REQUEST_APPROVE') ||
      permissions.includes('TRACEABILITY_VIEW') ||
      permissions.includes('AUTHORIZATION_CENTER_VIEW') ||
      permissions.includes('ADMIN');

    if (!allowed) {
      throw new ForbiddenException(
        'No tiene permisos para ver el centro de autorizaciones',
      );
    }
  }

  private ensureCanViewTraceability(user: any) {
    const permissions = this.getUserPermissions(user);

    const allowed =
      permissions.includes('TRACEABILITY_VIEW') ||
      permissions.includes('EXPENSE_REQUEST_VIEW_ALL') ||
      permissions.includes('EXPENSE_REQUEST_APPROVE') ||
      permissions.includes('ADMIN');

    if (!allowed) {
      throw new ForbiddenException(
        'No tiene permisos para ver la trazabilidad del flujo',
      );
    }
  }

  private getUserPermissions(user: any): string[] {
    return user?.role === 'ADMIN' ? ['ADMIN'] : user?.permissions || [];
  }


  private ensureCanApprove(user: any) {
    const permissions = this.getUserPermissions(user);

    const allowed =
      permissions.includes('EXPENSE_REQUEST_APPROVE') ||
      permissions.includes('AUTHORIZATION_APPROVE') ||
      permissions.includes('ADMIN');

    if (!allowed) {
      throw new ForbiddenException(
        'No tiene permisos para aprobar o rechazar solicitudes',
      );
    }
  }

  async getStatusMonitor(user: any) {
  this.ensureCanViewTraceability(user);

  const activeStatuses: ExpenseRequestStatus[] = [
    ExpenseRequestStatus.BORRADOR,
    ExpenseRequestStatus.ENVIADA,
    ExpenseRequestStatus.EN_REVISION,
    ExpenseRequestStatus.PENDIENTE_APROBACION,
    ExpenseRequestStatus.VALIDADA,
    ExpenseRequestStatus.APROBADA,
    ExpenseRequestStatus.OBSERVADA,
    ExpenseRequestStatus.EN_LIQUIDACION,
  ];

  const requests = await this.prisma.expenseRequest.findMany({
    where: {
      ...await authorizedRequestWhere(this.prisma, user),
      status: {
        in: activeStatuses,
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
    include: {
      items: true,
      validations: true,
      traces: {
        orderBy: {
          createdAt: 'desc',
        },
        take: 1,
      },
      company: true,
      currencyRef: true,
    },
  });

  return Promise.all(requests.map(async (request) => ({
    id: request.id,
    code: request.code,
    type: request.type,
    concept: request.concept,
    requesterName: request.requesterName,
    requesterRole: request.requesterRole,
    companyName: request.companyName,
    costCenter: request.costCenter,
    budgetAccount: request.budgetAccount,
    estimatedAmount: Number(request.estimatedAmount || 0),
    currency: request.currency || request.currencyRef?.code || 'GTQ',
    status: request.status,
    priority: request.priority,
    currentStep: this.resolveCurrentStep(request),
    slaStatus: await this.resolveSlaStatus(request),
    lastEvent: request.traces?.[0]?.event || null,
    lastEventDescription: request.traces?.[0]?.description || null,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
  })));
}

async getStatusMonitorDetail(id: string, user: any) {
    await this.assertRequestScope(id, user);
  this.ensureCanViewTraceability(user);

  const request = await this.prisma.expenseRequest.findUnique({
    where: { id },
    include: {
      items: true,
      validations: true,
      traces: {
        orderBy: {
          createdAt: 'asc',
        },
      },
      company: {
        include: {
          country: true,
          currency: true,
        },
      },
      currencyRef: true,
    },
  });

  if (!request) {
    throw new NotFoundException('Solicitud no encontrada');
  }

  return {
    id: request.id,
    code: request.code,
    type: request.type,
    concept: request.concept,
    requesterName: request.requesterName,
    requesterRole: request.requesterRole,
    companyName: request.companyName,
    costCenter: request.costCenter,
    budgetAccount: request.budgetAccount,
    estimatedAmount: Number(request.estimatedAmount || 0),
    currency: request.currency || request.currencyRef?.code || 'GTQ',
    status: request.status,
    priority: request.priority,
    currentStep: this.resolveCurrentStep(request),
    slaStatus: await this.resolveSlaStatus(request),
    items: request.items,
    validations: request.validations,
    timeline: request.traces,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
  };
}

private async resolveSlaStatus(request: any) {
  const result = await this.sla.calculate(request.updatedAt, request.priority);
  return result.indicator === 'RED' ? 'FUERA_SLA' : result.indicator === 'YELLOW' ? 'EN_RIESGO' : 'DENTRO_TIEMPO';
}

async getSlaEscalations(user: any) {
  this.ensureCanViewTraceability(user);

  const activeStatuses: ExpenseRequestStatus[] = [
    ExpenseRequestStatus.ENVIADA,
    ExpenseRequestStatus.EN_REVISION,
    ExpenseRequestStatus.PENDIENTE_APROBACION,
    ExpenseRequestStatus.VALIDADA,
    ExpenseRequestStatus.OBSERVADA,
    ExpenseRequestStatus.APROBADA,
    ExpenseRequestStatus.EN_LIQUIDACION,
  ];

  const requests = await this.prisma.expenseRequest.findMany({
    where: {
      ...await authorizedRequestWhere(this.prisma, user),
      status: {
        in: activeStatuses,
      },
    },
    orderBy: {
      updatedAt: 'asc',
    },
    include: {
      traces: {
        orderBy: {
          createdAt: 'desc',
        },
        take: 3,
      },
      company: true,
      currencyRef: true,
    },
  });

  const evaluated = await Promise.all(requests.map(async (request) => {
      const slaStatus = await this.resolveSlaStatus(request);

      return {
        id: request.id,
        code: request.code,
        type: request.type,
        concept: request.concept,
        requesterName: request.requesterName,
        requesterRole: request.requesterRole,
        companyName: request.companyName,
        costCenter: request.costCenter,
        estimatedAmount: Number(request.estimatedAmount || 0),
        currency: request.currency || request.currencyRef?.code || 'GTQ',
        status: request.status,
        priority: request.priority,
        currentStep: this.resolveCurrentStep(request),
        slaStatus,
        hoursInCurrentState: this.calculateHoursInCurrentState(request),
        alreadyEscalated: request.traces?.some(
          (trace) => trace.event === 'SOLICITUD_ESCALADA_SLA',
        ),
        lastEvent: request.traces?.[0]?.event || null,
        lastEventDescription: request.traces?.[0]?.description || null,
        createdAt: request.createdAt,
        updatedAt: request.updatedAt,
      };
    }));
  return evaluated.filter(
      (request) =>
        request.slaStatus === 'EN_RIESGO' ||
        request.slaStatus === 'FUERA_SLA' ||
        request.alreadyEscalated,
    );
}

async escalateSla(id: string, comment: string | undefined, user: any) {
    await this.assertRequestScope(id, user);
  this.ensureCanViewTraceability(user);

  const request = await this.findRequestOrFail(id);

  const slaStatus = await this.resolveSlaStatus(request);

  if (slaStatus === 'DENTRO_TIEMPO') {
    throw new BadRequestException(
      'La solicitud todavía se encuentra dentro del tiempo permitido.',
    );
  }

  return this.prisma.expenseRequest.update({
    where: { id },
    data: {
      traces: {
        create: {
          event: 'SOLICITUD_ESCALADA_SLA',
          description:
            comment ||
            `Solicitud escalada por condición SLA: ${slaStatus}.`,
          userName: this.getUserName(user),
          fromStatus: request.status,
          toStatus: request.status,
        },
      },
    },
    include: {
      traces: {
        orderBy: {
          createdAt: 'desc',
        },
      },
      company: true,
      currencyRef: true,
    },
  });
}
private calculateHoursInCurrentState(request: any) {
  const updatedAt = new Date(request.updatedAt).getTime();
  const now = Date.now();

  return Math.round(((now - updatedAt) / (1000 * 60 * 60)) * 10) / 10;
}


async getEventLogs(user: any) {
  this.ensureCanViewTraceability(user);

  const traces = await this.prisma.expenseRequestTrace.findMany({
    where: { request: await authorizedRequestWhere(this.prisma, user) },
    orderBy: {
      createdAt: 'desc',
    },
    take: 200,
    include: {
      request: {
        select: {
          id: true,
          code: true,
          type: true,
          concept: true,
          requesterName: true,
          status: true,
          costCenter: true,
          estimatedAmount: true,
          currency: true,
        },
      },
    },
  });

  return traces.map((trace) => ({
    id: trace.id,
    requestId: trace.requestId,
    requestCode: trace.request?.code,
    requestType: trace.request?.type,
    concept: trace.request?.concept,
    requesterName: trace.request?.requesterName,
    currentRequestStatus: trace.request?.status,
    costCenter: trace.request?.costCenter,
    amount: Number(trace.request?.estimatedAmount || 0),
    currency: trace.request?.currency || 'GTQ',
    event: trace.event,
    description: trace.description,
    userName: trace.userName,
    fromStatus: trace.fromStatus,
    toStatus: trace.toStatus,
    createdAt: trace.createdAt,
  }));
}

async getEventLogsByRequest(requestId: string, user: any) {
  await this.assertRequestScope(requestId, user);
  this.ensureCanViewTraceability(user);

  const request = await this.prisma.expenseRequest.findUnique({
    where: {
      id: requestId,
    },
    include: {
      traces: {
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  });

  if (!request) {
    throw new NotFoundException('Solicitud no encontrada');
  }

  return {
    id: request.id,
    code: request.code,
    type: request.type,
    concept: request.concept,
    requesterName: request.requesterName,
    status: request.status,
    traces: request.traces.map((trace) => ({
      id: trace.id,
      event: trace.event,
      description: trace.description,
      userName: trace.userName,
      fromStatus: trace.fromStatus,
      toStatus: trace.toStatus,
      createdAt: trace.createdAt,
    })),
  };
}
  private async assertRequestScope(id: string, user: any) {
    const scope = await authorizedRequestWhere(this.prisma, user);
    const request = await this.prisma.expenseRequest.findFirst({ where: { AND: [{ id }, scope] }, select: { id: true } });
    if (!request) throw new NotFoundException('Solicitud no encontrada.');
  }
}
