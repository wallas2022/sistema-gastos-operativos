import { authorizedCompanyId } from '../auth/permissions.util';
import { Injectable, NotFoundException } from '@nestjs/common';
import { ApprovalFlowStatus, ApprovalStepStatus, RequestPriority } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export type SlaIndicator = 'GREEN' | 'YELLOW' | 'RED';

@Injectable()
export class SlaService {
  constructor(private readonly prisma: PrismaService) {}

  listRules() { return this.prisma.slaRule.findMany({ where: { active: true }, orderBy: { targetMinutes: 'asc' } }); }

  async calculate(startedAt: Date | string, priority: RequestPriority | string) {
    const rule = await this.prisma.slaRule.findFirst({ where: { priority: priority as RequestPriority, active: true } });
    if (!rule) throw new NotFoundException(`No existe configuración SLA para prioridad ${priority}.`);
    const elapsedMinutes = Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 60000));
    const remainingMinutes = Math.max(0, rule.targetMinutes - elapsedMinutes);
    const overdueMinutes = Math.max(0, elapsedMinutes - rule.targetMinutes);
    const indicator: SlaIndicator = overdueMinutes > 0 ? 'RED' : remainingMinutes <= rule.warningMinutes ? 'YELLOW' : 'GREEN';
    return { priority, targetMinutes: rule.targetMinutes, warningMinutes: rule.warningMinutes, elapsedMinutes, remainingMinutes, overdueMinutes, indicator };
  }

  async forFlow(flowId: string, user: any) {
    const flow = await this.prisma.approvalFlow.findUnique({ where: { id: flowId }, include: { expenseRequest: true, steps: { orderBy: { order: 'asc' } } } });
    if (!flow) throw new NotFoundException('Flujo de aprobación no encontrado.');
    const companyId = authorizedCompanyId(user);
    if (companyId && flow.expenseRequest?.companyId !== companyId) throw new NotFoundException('Flujo de aprobacion no encontrado.');
    const step = flow.steps.find((item) => item.order === flow.currentStepOrder);
    if (!step || !flow.expenseRequest) throw new NotFoundException('El flujo no tiene un paso activo con SLA.');
    if (step.assignedUserId !== user.id && flow.expenseRequest.requesterId !== user.id && user.role !== 'ADMIN') throw new NotFoundException('Flujo de aprobación no encontrado.');
    return { flowId, stepId: step.id, stepOrder: step.order, ...(await this.calculate(step.assignedAt || step.createdAt, flow.expenseRequest.priority)) };
  }

  async pendingForUser(user: any) {
    const steps = await this.prisma.approvalStep.findMany({ where: { assignedUserId: user.id, status: { in: [ApprovalStepStatus.ASIGNADA, ApprovalStepStatus.EN_REVISION, ApprovalStepStatus.OBSERVADA] }, flow: { expenseRequest: { companyId: authorizedCompanyId(user) }, status: { in: [ApprovalFlowStatus.EN_REVISION, ApprovalFlowStatus.OBSERVADA] } } }, include: { flow: { include: { expenseRequest: true } }, assignedUser: { select: { id: true, name: true, email: true, role: true, companyId: true } }, delegatedFromUser: { select: { id: true, name: true, email: true, role: true, companyId: true } } }, orderBy: [{ assignedAt: 'asc' }, { createdAt: 'asc' }] });
    return Promise.all(steps.map(async (step) => ({ ...step, sla: await this.calculate(step.assignedAt || step.createdAt, step.flow.expenseRequest!.priority) })));
  }
}
