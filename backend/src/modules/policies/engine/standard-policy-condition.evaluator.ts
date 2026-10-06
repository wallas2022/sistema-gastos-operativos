import { Injectable } from '@nestjs/common';
import { PolicyField, PolicyOperator } from '@prisma/client';
import { PolicyConditionEvaluator } from './policy-condition-evaluator.interface';
import {
  EvaluatablePolicyRule,
  PolicyEvaluationInput,
} from './policy-engine.types';

@Injectable()
export class StandardPolicyConditionEvaluator
  implements PolicyConditionEvaluator
{
  supports(_rule: EvaluatablePolicyRule) {
    return true;
  }

  matches(rule: EvaluatablePolicyRule, input: PolicyEvaluationInput) {
    const actualValue = this.getActualValue(rule.field, input);
    if (actualValue === null || actualValue === undefined) {
      return false;
    }

    if (this.isNumericOperator(rule.operator)) {
      const actual = Number(actualValue);
      const expected = Number(rule.comparisonValue);
      if (!Number.isFinite(actual) || !Number.isFinite(expected)) {
        return false;
      }
      return this.compareNumbers(actual, expected, rule.operator);
    }

    const actual = String(actualValue).trim().toUpperCase();
    const expected = rule.comparisonValue.trim().toUpperCase();

    switch (rule.operator) {
      case PolicyOperator.EQUALS:
        return actual === expected;
      case PolicyOperator.NOT_EQUALS:
        return actual !== expected;
      case PolicyOperator.CONTAINS:
        return actual.includes(expected);
      case PolicyOperator.IN:
        return expected
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean)
          .includes(actual);
      default:
        return false;
    }
  }

  private getActualValue(field: PolicyField, input: PolicyEvaluationInput) {
    const values: Record<PolicyField, string | number | null> = {
      AMOUNT: input.amount,
      COMPANY: input.companyId,
      COUNTRY: input.countryId,
      COST_CENTER: input.costCenter,
      BUDGET_ACCOUNT: input.budgetAccount,
      EXPENSE_TYPE: input.expenseType,
      PRIORITY: input.priority,
      REQUESTER_ROLE: input.requesterRole,
      DESTINATION: input.destination,
      CURRENCY: input.currency,
      DAYS: input.days,
      DOCUMENT_TYPE: input.documentType ?? null,
    };
    return values[field];
  }

  private isNumericOperator(operator: PolicyOperator) {
    const numericOperators: PolicyOperator[] = [
      PolicyOperator.GREATER_THAN,
      PolicyOperator.GREATER_THAN_OR_EQUAL,
      PolicyOperator.LESS_THAN,
      PolicyOperator.LESS_THAN_OR_EQUAL,
    ];
    return numericOperators.includes(operator);
  }

  private compareNumbers(
    actual: number,
    expected: number,
    operator: PolicyOperator,
  ) {
    switch (operator) {
      case PolicyOperator.GREATER_THAN:
        return actual > expected;
      case PolicyOperator.GREATER_THAN_OR_EQUAL:
        return actual >= expected;
      case PolicyOperator.LESS_THAN:
        return actual < expected;
      case PolicyOperator.LESS_THAN_OR_EQUAL:
        return actual <= expected;
      default:
        return false;
    }
  }
}
