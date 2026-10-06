import { PolicyEvaluationResult } from '../policies/engine/policy-engine.types';

export interface ApprovableEntityInput {
  entityType: string;
  entityId: string;
  expenseRequestId?: string;
  companyId?: string | null;
  requesterId?: string;
  requestCode?: string;
  currentStatus?: string;
}

export type ApprovalPolicyResult = PolicyEvaluationResult;
