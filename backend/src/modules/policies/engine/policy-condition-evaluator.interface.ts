import {
  EvaluatablePolicyRule,
  PolicyEvaluationInput,
} from './policy-engine.types';

export interface PolicyConditionEvaluator {
  supports(rule: EvaluatablePolicyRule): boolean;
  matches(
    rule: EvaluatablePolicyRule,
    input: PolicyEvaluationInput,
  ): boolean;
}

export const POLICY_CONDITION_EVALUATORS = 'POLICY_CONDITION_EVALUATORS';
