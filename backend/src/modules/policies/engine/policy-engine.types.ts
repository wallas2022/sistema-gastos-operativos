import {
  ExpenseType,
  PolicyField,
  PolicyOperator,
  PolicyResultStatus,
  RequestPriority,
  RoleName,
} from '@prisma/client';

export interface PolicyEvaluationInput {
  requestId: string;
  amount: number;
  companyId: string | null;
  countryId: string | null;
  costCenter: string;
  budgetAccount: string | null;
  expenseType: ExpenseType;
  priority: RequestPriority;
  requesterRole: RoleName | string;
  destination: string | null;
  currency: string;
  days: number | null;
  documentType?: string | null;
}

export interface EvaluatablePolicyRule {
  id: string;
  code: string;
  name: string;
  field: PolicyField;
  operator: PolicyOperator;
  comparisonValue: string;
  action: PolicyResultStatus;
  message: string;
  priority: number;
}

export interface PolicyRuleEvaluation {
  ruleId: string;
  code: string;
  name: string;
  status: PolicyResultStatus;
  message: string;
  priority: number;
  field: PolicyField;
}

export interface PolicyEvaluationResult {
  evaluatedAt: Date;
  results: PolicyRuleEvaluation[];
  ok: PolicyRuleEvaluation[];
  warnings: PolicyRuleEvaluation[];
  errors: PolicyRuleEvaluation[];
  approvalsRequired: PolicyRuleEvaluation[];
  notApplicable: PolicyRuleEvaluation[];
}
