import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ApprovalFlowStatus,
  ApprovalStepStatus,
  ExpenseRequestStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { hasPermission, authorizedCompanyId } from '../auth/permissions.util';
import { WorkflowEventBus } from '../workflow/workflow-event-bus.service';

@Injectable()
export class ApprovalFlowService {
  constructor(private readonly prisma: PrismaService, private readonly workflowEvents?: WorkflowEventBus) {}

  async getById(id: string, user: any) {
    const flow = await this.findFlowOrFail(id);
    this.ensureCompanyScope(flow, user);
    this.ensureCanView(flow, user);
    return flow;
  }

  async findIdByRequest(requestId: string) {
    const flow = await this.prisma.approvalFlow.findUnique({
      where: { expenseRequestId: requestId },
      select: { id: true },
    });
    return flow?.id || null;
  }

  async getByRequest(requestId: string, user: any) {
    const flow = await this.prisma.approvalFlow.findUnique({
      where: { expenseRequestId: requestId },
      include: this.flowInclude(),
    });
    if (!flow) throw new NotFoundException('La solicitud no tiene un flujo de aprobaci贸n.');
    this.ensureCanView(flow, user);
    return flow;
  }

  async getPending(user: any) {
    const companyId = authorizedCompanyId(user);
    const pending = await this.prisma.approvalStep.findMany({
      where: {
        assignedUserId: user.id,
        status: {
          in: [
            ApprovalStepStatus.ASIGNADA,
            ApprovalStepStatus.EN_REVISION,
            ApprovalStepStatus.OBSERVADA,
          ],
        },
        flow: {
          entityType: 'EXPENSE_REQUEST',
          expenseRequestId: { not: null },
          ...(companyId ? { expenseRequest: { companyId } } : {}),
          status: {
            in: [ApprovalFlowStatus.EN_REVISION, ApprovalFlowStatus.OBSERVADA],
          },
        },
      },
      include: {
        flow: { include: { expenseRequest: true } },
        assignedUser: { select: { id: true, name: true, email: true, role: true, companyId: true } },
        delegatedFromUser: { select: { id: true, name: true, email: true, role: true, companyId: true } },
      },
      orderBy: [{ assignedAt: 'asc' }, { createdAt: 'asc' }],
    });
    // Only the current request level belongs in the request approval inbox.
    return pending.filter((step) => step.flow.expenseRequest && step.order === step.flow.currentStepOrder);
  }

  async approve(id: string, comment: string | undefined, user: any) {
    const flow = await this.findFlowOrFail(id);
    this.ensureCompanyScope(flow, user);
    const current = this.getCurrentStep(flow);
    this.ensureAssigned(current, user);
    this.ensureApproverAuthority(flow, current, user);
    this.ensureDecidable(flow, current);

    const next = flow.steps.find((step) => step.order > current.order);
    await this.prisma.$transaction(async (tx) => {
      const changed = await tx.approvalStep.updateMany({
        where: {
          id: current.id,
          assignedUserId: user.id,
          status: {
            in: [
              ApprovalStepStatus.ASIGNADA,
              ApprovalStepStatus.EN_REVISION,
              ApprovalStepStatus.OBSERVADA,
            ],
          },
        },
        data: {
          status: ApprovalStepStatus.APROBADA,
          decidedAt: new Date(),
          decidedByUserId: user.id,
          comment: comment?.trim() || null,
        },
      });
      if (changed.count !== 1) {
        throw new BadRequestException('El paso ya fue procesado por otro usuario.');
      }

      if (next) {
        await tx.approvalStep.update({
          where: { id: next.id },
          data: {
            status: ApprovalStepStatus.ASIGNADA,
            assignedAt: new Date(),
          },
        });
        await tx.approvalFlow.update({
          where: { id },
          data: {
            status: ApprovalFlowStatus.EN_REVISION,
            currentStepOrder: next.order,
          },
        });
        await this.updateRequestAndTrace(tx, flow, {
          status: ExpenseRequestStatus.PENDIENTE_APROBACION,
          event: 'APROBADOR_ASIGNADO',
          description: `Nivel ${next.order} asignado a ${next.assignedUser.name}.`,
          userName: user.name,
        });
      } else {
        await tx.approvalFlow.update({
          where: { id },
          data: {
            status: ApprovalFlowStatus.APROBADA,
            currentStepOrder: null,
            completedAt: new Date(),
          },
        });
        await this.updateRequestAndTrace(tx, flow, {
          status: ExpenseRequestStatus.APROBADA,
          event: 'SOLICITUD_APROBADA',
          description: comment?.trim() || 'Flujo de aprobaci贸n completado.',
          userName: user.name,
        });
      }
    });
    return this.findFlowOrFail(id);
  }

  async reject(id: string, comment: string, user: any) {
    this.requireComment(comment, 'rechazo');
    const flow = await this.findFlowOrFail(id);
    this.ensureCompanyScope(flow, user);
    const current = this.getCurrentStep(flow);
    this.ensureAssigned(current, user);
    this.ensureApproverAuthority(flow, current, user);
    this.ensureDecidable(flow, current);

    await this.prisma.$transaction(async (tx) => {
      const changed = await tx.approvalStep.updateMany({
        where: {
          id: current.id,
          assignedUserId: user.id,
          status: { in: [ApprovalStepStatus.ASIGNADA, ApprovalStepStatus.EN_REVISION, ApprovalStepStatus.OBSERVADA] },
        },
        data: {
          status: ApprovalStepStatus.RECHAZADA,
          decidedAt: new Date(),
          decidedByUserId: user.id,
          comment: comment.trim(),
        },
      });
      if (changed.count !== 1) {
        throw new BadRequestException('El paso ya fue procesado por otro usuario.');
      }
      await tx.approvalStep.updateMany({
        where: { flowId: id, order: { gt: current.order }, status: ApprovalStepStatus.PENDIENTE },
        data: { status: ApprovalStepStatus.OMITIDA },
      });
      await tx.approvalFlow.update({
        where: { id },
        data: { status: ApprovalFlowStatus.RECHAZADA, currentStepOrder: null, completedAt: new Date() },
      });
      await this.updateRequestAndTrace(tx, flow, {
        status: ExpenseRequestStatus.RECHAZADA,
        event: 'SOLICITUD_RECHAZADA',
        description: comment.trim(),
        userName: user.name,
      });
    });
    return this.findFlowOrFail(id);
  }

  async observe(id: string, comment: string, user: any) {
    this.requireComment(comment, 'observaci贸n');
    const flow = await this.findFlowOrFail(id);
    this.ensureCompanyScope(flow, user);
    const current = this.getCurrentStep(flow);
    this.ensureAssigned(current, user);
    this.ensureApproverAuthority(flow, current, user);
    this.ensureDecidable(flow, current);

    await this.prisma.$transaction(async (tx) => {
      await tx.approvalStep.update({
        where: { id: current.id },
        data: {
          status: ApprovalStepStatus.OBSERVADA,
          startedAt: current.startedAt || new Date(),
          comment: comment.trim(),
        },
      });
      await tx.approvalFlow.update({
        where: { id },
        data: { status: ApprovalFlowStatus.OBSERVADA },
      });
      await this.updateRequestAndTrace(tx, flow, {
        status: ExpenseRequestStatus.OBSERVADA,
        event: 'SOLICITUD_OBSERVADA',
        description: comment.trim(),
        userName: user.name,
      });
    });
    return this.findFlowOrFail(id);
  }

  async delegate(id: string, targetUserId: string, comment: string, user: any) {
    this.requireComment(comment, 'delegaci贸n');
    const flow = await this.findFlowOrFail(id);
    this.ensureCompanyScope(flow, user);
    const current = this.getCurrentStep(flow);
    this.ensureAssigned(current, user);
    this.ensureApproverAuthority(flow, current, user);
    this.ensureDecidable(flow, current);
    const target = await this.findValidTarget(flow, targetUserId, user.id, current);

    await this.prisma.$transaction(async (tx) => {
      await tx.approvalStep.update({
        where: { id: current.id },
        data: {
          assignedUserId: target.id,
          delegatedFromUserId: user.id,
          assignedAt: new Date(),
          comment: comment.trim(),
        },
      });
      await this.trace(tx, flow, 'APROBACION_DELEGADA', `${user.name} deleg贸 la aprobaci贸n a ${target.name}: ${comment.trim()}`, user.name);
    });
    return this.findFlowOrFail(id);
  }

  async reassign(id: string, stepId: string, targetUserId: string, comment: string, user: any) {
    this.requireComment(comment, 'reasignaci贸n');
    this.ensureCanManage(user);
    const flow = await this.findFlowOrFail(id);
    this.ensureCompanyScope(flow, user);
    const current = this.getCurrentStep(flow);
    if (current.id !== stepId) throw new BadRequestException('Solo puede reasignarse el paso actual.');
    this.ensureDecidable(flow, current);
    const target = await this.findValidTarget(flow, targetUserId, current.assignedUserId, current);
    await this.prisma.$transaction(async (tx) => {
      await tx.approvalStep.update({
        where: { id: current.id },
        data: { assignedUserId: target.id, assignedAt: new Date(), comment: comment.trim() },
      });
      await this.trace(tx, flow, 'APROBADOR_ASIGNADO', `Paso ${current.order} reasignado a ${target.name}: ${comment.trim()}`, user.name);
    });
    return this.findFlowOrFail(id);
  }

  async resetForResubmit(id: string, user: any) {
    const flow = await this.findFlowOrFail(id);
    this.ensureCompanyScope(flow, user);
    if (flow.status !== ApprovalFlowStatus.OBSERVADA || !flow.expenseRequestId) throw new BadRequestException('Solo un flujo observado puede reenviarse.');
    if (flow.expenseRequest?.requesterId !== user.id && user.role !== 'ADMIN') throw new ForbiddenException('Solo el solicitante puede reenviar la solicitud.');
    await this.prisma.$transaction(async (tx) => {
      const priorDecisions = flow.steps.filter((step: any) => step.decidedAt || step.decidedByUserId || step.comment);
      if (flow.expenseRequestId && priorDecisions.length) {
        await tx.expenseRequestTrace.createMany({ data: priorDecisions.map((step: any) => ({ requestId: flow.expenseRequestId, event: 'APROBACION_CICLO_REINICIADO', description: `Nivel ${step.order}: decisi髇 ${step.status}${step.comment ? `; comentario: ${step.comment}` : ''}.`, userName: user.name, fromStatus: flow.expenseRequest.status, toStatus: flow.expenseRequest.status })) });
      }
      await tx.approvalStep.updateMany({
        where: { flowId: id },
        data: { status: ApprovalStepStatus.PENDIENTE, decidedAt: null, decidedByUserId: null, startedAt: null, comment: null, delegatedFromUserId: null, assignedAt: null },
      });
      const first = flow.steps.sort((a: any, b: any) => a.order - b.order)[0];
      if (!first) throw new BadRequestException('El flujo no tiene niveles configurados.');
      await tx.approvalStep.update({ where: { id: first.id }, data: { status: ApprovalStepStatus.ASIGNADA, assignedAt: new Date() } });
      await tx.approvalFlow.update({ where: { id }, data: { status: ApprovalFlowStatus.EN_REVISION, currentStepOrder: first.order, completedAt: null } });
      await this.updateRequestAndTrace(tx, flow, { status: ExpenseRequestStatus.PENDIENTE_APROBACION, event: 'SOLICITUD_REENVIADA', description: 'Solicitud reenviada despu閟 de corregir una observaci髇.', userName: user.name });
    });
    const result = await this.findFlowOrFail(id);
    await this.workflowEvent('APPROVER_ASSIGNED', result, user);
    return result;
  }

  async cancel(id: string, comment: string, user: any) {
    this.requireComment(comment, 'cancelaci贸n');
    const flow = await this.findFlowOrFail(id);
    this.ensureCompanyScope(flow, user);
    const isRequester = flow.expenseRequest?.requesterId === user.id;
    if (!isRequester && user.role !== 'ADMIN') throw new ForbiddenException('Solo el solicitante o un administrador puede cancelar el flujo.');
    const cancellableStatuses: ApprovalFlowStatus[] = [
      ApprovalFlowStatus.EN_REVISION,
      ApprovalFlowStatus.OBSERVADA,
      ApprovalFlowStatus.PENDIENTE,
    ];
    if (!cancellableStatuses.includes(flow.status)) {
      throw new BadRequestException(`El flujo no puede cancelarse desde ${flow.status}.`);
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.approvalStep.updateMany({
        where: { flowId: id, status: { in: [ApprovalStepStatus.PENDIENTE, ApprovalStepStatus.ASIGNADA, ApprovalStepStatus.EN_REVISION, ApprovalStepStatus.OBSERVADA] } },
        data: { status: ApprovalStepStatus.CANCELADA },
      });
      await tx.approvalFlow.update({
        where: { id },
        data: { status: ApprovalFlowStatus.CANCELADA, currentStepOrder: null, cancelledAt: new Date(), cancelledByUserId: user.id, cancellationReason: comment.trim() },
      });
      await this.updateRequestAndTrace(tx, flow, { status: ExpenseRequestStatus.CANCELADA, event: 'SOLICITUD_CANCELADA', description: comment.trim(), userName: user.name });
    });
    return this.findFlowOrFail(id);
  }

  async history(id: string, user: any) {
    const flow = await this.getById(id, user);
    const traces = flow.expenseRequestId
      ? await this.prisma.expenseRequestTrace.findMany({
          where: {
            requestId: flow.expenseRequestId,
            event: { in: ['FLUJO_GENERADO', 'APROBADOR_ASIGNADO', 'SOLICITUD_APROBADA', 'SOLICITUD_RECHAZADA', 'SOLICITUD_OBSERVADA', 'APROBACION_DELEGADA', 'SOLICITUD_CANCELADA'] },
          },
          orderBy: { createdAt: 'asc' },
        })
      : [];
    return { flow, traces };
  }

  async approveByRequest(requestId: string, comment: string | undefined, user: any) { const flow = await this.getByRequest(requestId, user); await this.approve(flow.id, comment, user); return this.getRequest(requestId); }
  async rejectByRequest(requestId: string, comment: string, user: any) { const flow = await this.getByRequest(requestId, user); await this.reject(flow.id, comment, user); return this.getRequest(requestId); }
  async observeByRequest(requestId: string, comment: string, user: any) { const flow = await this.getByRequest(requestId, user); await this.observe(flow.id, comment, user); return this.getRequest(requestId); }

  private async getRequest(id: string) {
    return this.prisma.expenseRequest.findUnique({ where: { id }, include: { items: true, validations: true, traces: { orderBy: { createdAt: 'asc' } }, company: true, currencyRef: true } });
  }

  private getCurrentStep(flow: any) {
    const step = flow.steps.find((candidate: any) => candidate.order === flow.currentStepOrder);
    if (!step) throw new BadRequestException('El flujo no tiene un paso actual procesable.');
    return step;
  }

  private ensureAssigned(step: any, user: any) {
    if (step.assignedUserId !== user.id) throw new ForbiddenException('Solo el aprobador asignado puede tomar esta decisi贸n.');
  }

  private ensureApproverAuthority(flow: any, step: any, user: any) {
    if (user.role !== 'ADMIN' && !hasPermission(user, 'EXPENSE_REQUEST_APPROVE') && !hasPermission(user, 'AUTHORIZATION_APPROVE')) {
      throw new ForbiddenException('No tiene autoridad para aprobar este flujo.');
    }
    if (flow.expenseRequest?.requesterId === user.id) {
      throw new ForbiddenException('El solicitante no puede aprobar su propia solicitud.');
    }
    if (step.approverRoleCode && user.role !== step.approverRoleCode && user.role !== 'ADMIN') {
      throw new ForbiddenException('No tiene autoridad para este nivel de aprobaci贸n.');
    }
  }

  private ensureDecidable(flow: any, step: any) {
    if (![ApprovalFlowStatus.EN_REVISION, ApprovalFlowStatus.OBSERVADA].includes(flow.status)) throw new BadRequestException(`El flujo ya finaliz贸 con estado ${flow.status}.`);
    if (![ApprovalStepStatus.ASIGNADA, ApprovalStepStatus.EN_REVISION, ApprovalStepStatus.OBSERVADA].includes(step.status)) throw new BadRequestException(`El paso no puede procesarse desde ${step.status}.`);
    const incompletePrevious = flow.steps.some((candidate: any) => candidate.order < step.order && candidate.required && candidate.status !== ApprovalStepStatus.APROBADA);
    if (incompletePrevious) throw new BadRequestException('No puede avanzar sin completar el paso anterior.');
  }

  private ensureCanView(flow: any, user: any) {
    this.ensureCompanyScope(flow, user);
    const allowed = user.role === 'ADMIN' || flow.expenseRequest?.requesterId === user.id || flow.settlement?.preparedByUserId === user.id || flow.steps.some((step: any) => step.assignedUserId === user.id) || hasPermission(user, 'EXPENSE_REQUEST_VIEW_ALL');
    if (!allowed) throw new ForbiddenException('No tiene acceso a este flujo de aprobaci贸n.');
  }

  private ensureCanManage(user: any) {
    if (user.role !== 'ADMIN' && !hasPermission(user, 'EXPENSE_REQUEST_APPROVE')) throw new ForbiddenException('No tiene permiso para reasignar aprobaciones.');
  }

  private requireComment(comment: string, action: string) {
    if (!comment?.trim()) throw new BadRequestException(`Debe ingresar un comentario para la ${action}.`);
  }

  private async findValidTarget(flow: any, targetUserId: string, excludedUserId?: string | null, currentStep?: any) {
    if (targetUserId === excludedUserId) throw new BadRequestException('El usuario destino debe ser diferente al aprobador actual.');
    const target = await this.prisma.user.findFirst({ where: { id: targetUserId, active: true } });
    if (!target) throw new BadRequestException('El usuario destino no existe o est谩 inactivo.');
    if (flow.expenseRequest?.companyId && target.companyId !== flow.expenseRequest.companyId) throw new BadRequestException('El usuario destino debe pertenecer a la misma empresa.');
    if (flow.expenseRequest?.requesterId === target.id) throw new BadRequestException('El solicitante no puede ser designado como aprobador.');
    if (currentStep?.approverRoleCode && target.role !== currentStep.approverRoleCode && target.role !== 'ADMIN') throw new ForbiddenException('El usuario destino no tiene autoridad para este nivel de aprobaci贸n.');
    return target;
  }

  private async updateRequestAndTrace(tx: any, flow: any, data: { status: ExpenseRequestStatus; event: string; description: string; userName: string }) {
    if (!flow.expenseRequestId) return;
    const fromStatus = flow.expenseRequest.status;
    await tx.expenseRequest.update({ where: { id: flow.expenseRequestId }, data: { status: data.status } });
    await tx.expenseRequestTrace.create({ data: { requestId: flow.expenseRequestId, event: data.event, description: data.description, userName: data.userName, fromStatus, toStatus: data.status } });
  }

  private async trace(tx: any, flow: any, event: string, description: string, userName: string) {
    if (!flow.expenseRequestId) return;
    await tx.expenseRequestTrace.create({ data: { requestId: flow.expenseRequestId, event, description, userName, fromStatus: flow.expenseRequest.status, toStatus: flow.expenseRequest.status } });
  }

  private async findFlowOrFail(id: string) {
    const flow = await this.prisma.approvalFlow.findUnique({ where: { id }, include: this.flowInclude() });
    if (!flow) throw new NotFoundException('Flujo de aprobaci贸n no encontrado.');
    return flow;
  }

  private flowInclude() {
    return { steps: { include: { assignedUser: { select: { id: true, name: true, email: true, role: true, companyId: true } }, delegatedFromUser: { select: { id: true, name: true, email: true, role: true, companyId: true } }, decidedByUser: { select: { id: true, name: true, email: true, role: true, companyId: true } } }, orderBy: { order: 'asc' as const } }, expenseRequest: true, settlement: { select: { companyId: true, preparedByUserId: true } } };
  }
  private async workflowEvent(type: any, flow: any, user: any) {
    if (this.workflowEvents && flow.expenseRequestId) await this.workflowEvents.publish({ type, requestId: flow.expenseRequestId, flowId: flow.id, actorId: user.id, actorName: user.name });
  }

  private ensureCompanyScope(flow: any, user: any) {
    const companyId = authorizedCompanyId(user);
    if (companyId && (flow.expenseRequest?.companyId || flow.settlement?.companyId) !== companyId) throw new ForbiddenException('No tiene acceso a esta empresa.');
  }
}
