import { Inject, Injectable } from '@nestjs/common';
import { PolicyResultStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  POLICY_CONDITION_EVALUATORS,
  PolicyConditionEvaluator,
} from './policy-condition-evaluator.interface';
import {
  PolicyEvaluationInput,
  PolicyEvaluationResult,
  PolicyRuleEvaluation,
} from './policy-engine.types';

@Injectable()
export class PolicyEngineService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(POLICY_CONDITION_EVALUATORS)
    private readonly evaluators: PolicyConditionEvaluator[],
  ) {}

  async evaluate(input: PolicyEvaluationInput): Promise<PolicyEvaluationResult> {
    const now = new Date();
    const rules = await this.prisma.policyRule.findMany({
      where: {
        active: true,
        deletedAt: null,
        AND: [
          { OR: [{ validFrom: null }, { validFrom: { lte: now } }] },
          { OR: [{ validTo: null }, { validTo: { gte: now } }] },
          { OR: [{ companyId: null }, { companyId: input.companyId }] },
          { OR: [{ expenseType: null }, { expenseType: input.expenseType }] },
        ],
      },
      orderBy: [{ priority: 'asc' }, { code: 'asc' }],
    });

    const results: PolicyRuleEvaluation[] = rules.map((rule) => {
      const evaluator = this.evaluators.find((candidate) =>
        candidate.supports(rule),
      );
      const matches = evaluator?.matches(rule, input) ?? false;
      return {
        ruleId: rule.id,
        code: rule.code,
        name: rule.name,
        status: matches ? rule.action : PolicyResultStatus.NOT_APPLICABLE,
        message: matches
          ? rule.message
          : `La regla ${rule.code} no aplica a la solicitud.`,
        priority: rule.priority,
        field: rule.field,
      };
    });

    return {
      evaluatedAt: now,
      results,
      ok: this.byStatus(results, PolicyResultStatus.OK),
      warnings: this.byStatus(results, PolicyResultStatus.WARNING),
      errors: this.byStatus(results, PolicyResultStatus.ERROR),
      approvalsRequired: this.byStatus(
        results,
        PolicyResultStatus.APPROVAL_REQUIRED,
      ),
      notApplicable: this.byStatus(
        results,
        PolicyResultStatus.NOT_APPLICABLE,
      ),
    };
  }

  private byStatus(
    results: PolicyRuleEvaluation[],
    status: PolicyResultStatus,
  ) {
    return results.filter((result) => result.status === status);
  }
}
