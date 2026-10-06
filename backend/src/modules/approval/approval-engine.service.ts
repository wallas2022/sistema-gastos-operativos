import { BadRequestException, Injectable } from '@nestjs/common';
import { ApprovalFlowStatus, ApprovalStepStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ApprovableEntityInput,
  ApprovalPolicyResult,
} from './approval.types';

@Injectable()
export class ApprovalEngineService {
  constructor(private readonly prisma: PrismaService) {}

  async generateFlow(
    entity: ApprovableEntityInput,
    policyResult: ApprovalPolicyResult,
    generatedBy: string,
  ) {
    if (!policyResult.approvalsRequired.length) return null;

    const existing = await this.prisma.approvalFlow.findUnique({
      where: {
        entityType_entityId: {
          entityType: entity.entityType,
          entityId: entity.entityId,
        },
      },
      include: this.flowInclude(),
    });
    if (existing) return existing;

    const ruleIds = policyResult.approvalsRequired.map((result) => result.ruleId);
    const rules = await this.prisma.policyRule.findMany({
      where: { id: { in: ruleIds }, active: true, deletedAt: null },
      include: {
        approvalSteps: {
          include: { approverRole: true, approverUser: { select: { id: true, name: true, email: true, role: true, companyId: true } } },
          orderBy: { order: 'asc' },
        },
      },
    });
    const ruleById = new Map(rules.map((rule) => [rule.id, rule]));
    const configuredSteps: Array<{
      sourcePolicyRuleId: string;
      sourcePolicyRuleCode: string;
      approverRoleCode: string | null;
      assignedUserId: string;
      required: boolean;
    }> = [];

    for (const result of policyResult.approvalsRequired) {
      const rule = ruleById.get(result.ruleId);
      if (!rule?.approvalSteps.length) {
        throw new BadRequestException(
          `La política ${result.code} requiere aprobación pero no tiene una ruta configurada.`,
        );
      }

      for (const definition of rule.approvalSteps) {
        const assignedUserId = await this.resolveApprover(
          definition.approverUserId,
          definition.approverRoleId,
          entity.companyId,
          entity.requesterId,
        );
        configuredSteps.push({
          sourcePolicyRuleId: rule.id,
          sourcePolicyRuleCode: rule.code,
          approverRoleCode: definition.approverRole?.code || null,
          assignedUserId,
          required: definition.required,
        });
      }
    }

    const uniqueSteps = configuredSteps.filter(
      (step, index, all) =>
        all.findIndex(
          (candidate) =>
            candidate.assignedUserId === step.assignedUserId &&
            candidate.approverRoleCode === step.approverRoleCode,
        ) === index,
    );

    return this.prisma.$transaction(async (tx) => {
      const flow = await tx.approvalFlow.create({
        data: {
          entityType: entity.entityType,
          entityId: entity.entityId,
          expenseRequestId: entity.expenseRequestId,
          status: ApprovalFlowStatus.EN_REVISION,
          currentStepOrder: 1,
          steps: {
            create: uniqueSteps.map((step, index) => ({
              ...step,
              order: index + 1,
              status:
                index === 0
                  ? ApprovalStepStatus.ASIGNADA
                  : ApprovalStepStatus.PENDIENTE,
              assignedAt: index === 0 ? new Date() : null,
            })),
          },
        },
        include: this.flowInclude(),
      });

      if (entity.expenseRequestId) {
        await tx.expenseRequestTrace.createMany({
          data: [
            {
              requestId: entity.expenseRequestId,
              event: 'FLUJO_GENERADO',
              description: `Flujo de ${uniqueSteps.length} nivel(es) generado automáticamente.`,
              userName: generatedBy,
              fromStatus: entity.currentStatus,
              toStatus: entity.currentStatus,
            },
            {
              requestId: entity.expenseRequestId,
              event: 'APROBADOR_ASIGNADO',
              description: `Primer nivel asignado a ${flow.steps[0].assignedUser.name}.`,
              userName: generatedBy,
              fromStatus: entity.currentStatus,
              toStatus: entity.currentStatus,
            },
          ],
        });
      }
      return flow;
    });
  }

  private async resolveApprover(
    approverUserId: string | null,
    approverRoleId: string | null,
    companyId?: string | null,
    requesterId?: string,
  ) {
    if (approverUserId) {
      const user = await this.prisma.user.findFirst({
        where: { id: approverUserId, active: true, ...(companyId ? { companyId } : {}) },
      });
      if (!user) throw new BadRequestException('El aprobador configurado está inactivo o no existe.');
      if (requesterId && user.id === requesterId) throw new BadRequestException('El solicitante no puede ser designado como aprobador.');
      return user.id;
    }
    if (!approverRoleId) {
      throw new BadRequestException('El paso no define rol ni usuario aprobador.');
    }

    const assignment = await this.prisma.userRole.findFirst({
      where: {
        roleId: approverRoleId,
        role: { active: true },
        user: { active: true, companyId: companyId || undefined },
      },
      orderBy: { user: { email: 'asc' } },
      select: { userId: true },
    });
    if (!assignment) {
      throw new BadRequestException(
        'No existe un usuario activo para uno de los roles aprobadores configurados.',
      );
    }
    if (requesterId && assignment.userId === requesterId) throw new BadRequestException('El solicitante no puede ser designado como aprobador.');
    return assignment.userId;
  }

  private flowInclude() {
    return {
      steps: {
        include: { assignedUser: { select: { id: true, name: true, email: true, role: true, companyId: true } }, delegatedFromUser: { select: { id: true, name: true, email: true, role: true, companyId: true } }, decidedByUser: { select: { id: true, name: true, email: true, role: true, companyId: true } } },
        orderBy: { order: 'asc' as const },
      },
      expenseRequest: true,
    };
  }
}
