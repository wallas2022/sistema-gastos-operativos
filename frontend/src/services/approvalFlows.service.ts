import { api } from "../shared/services/api";

export type ApprovalStatus = "PENDIENTE" | "ASIGNADA" | "EN_REVISION" | "APROBADA" | "RECHAZADA" | "OBSERVADA" | "OMITIDA" | "EXPIRADA" | "CANCELADA";

export interface ApprovalUser {
  id: string;
  name: string;
  email: string;
}

export interface ApprovalStep {
  id: string;
  flowId: string;
  order: number;
  status: ApprovalStatus;
  sourcePolicyRuleCode?: string | null;
  approverRoleCode?: string | null;
  assignedUserId: string;
  assignedUser: ApprovalUser;
  delegatedFromUser?: ApprovalUser | null;
  decidedByUser?: ApprovalUser | null;
  required: boolean;
  assignedAt?: string | null;
  startedAt?: string | null;
  decidedAt?: string | null;
  comment?: string | null;
  createdAt: string;
}

export interface ApprovalExpenseSummary {
  id: string;
  code: string;
  type: string;
  status: string;
  priority: string;
  requesterId: string;
  requesterName: string;
  requesterRole: string;
  companyId?: string | null;
  companyName: string;
  costCenter: string;
  budgetAccount?: string | null;
  concept: string;
  justification?: string | null;
  destination?: string | null;
  days?: number | null;
  estimatedAmount: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApprovalFlow {
  decisionAuthorization?: { allowed: boolean; reason: string | null };
  id: string;
  entityType: string;
  entityId: string;
  expenseRequestId?: string | null;
  status: ApprovalStatus;
  currentStepOrder?: number | null;
  generatedAt: string;
  completedAt?: string | null;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
  expenseRequest?: ApprovalExpenseSummary | null;
  steps: ApprovalStep[];
}

export interface PendingApproval extends ApprovalStep {
  flow: Omit<ApprovalFlow, "steps" | "expenseRequest"> & {
    expenseRequestId: string;
    expenseRequest: ApprovalExpenseSummary;
  };
}

export interface ApprovalTrace {
  id: string;
  event: string;
  description?: string | null;
  userName?: string | null;
  fromStatus?: string | null;
  toStatus?: string | null;
  createdAt: string;
}

export interface ApprovalHistory {
  flow: ApprovalFlow;
  traces: ApprovalTrace[];
}

export const APPROVAL_PENDING_CHANGED = "approvals:pending-changed";

export const approvalFlowsService = {
  async pending(): Promise<PendingApproval[]> {
    const response = await api.get("/approval-flows/pending/me");
    return response.data;
  },
  async get(id: string): Promise<ApprovalFlow> {
    const response = await api.get(`/approval-flows/${id}`);
    return response.data;
  },
  async history(id: string): Promise<ApprovalHistory> {
    const response = await api.get(`/approval-flows/${id}/history`);
    return response.data;
  },
  async approve(id: string, comment?: string) {
    return (await api.post(`/approval-flows/${id}/approve`, { comment: comment || undefined })).data;
  },
  async reject(id: string, comment: string) {
    return (await api.post(`/approval-flows/${id}/reject`, { comment })).data;
  },
  async observe(id: string, comment: string) {
    return (await api.post(`/approval-flows/${id}/observe`, { comment })).data;
  },
  async delegate(id: string, targetUserId: string, comment: string) {
    return (await api.post(`/approval-flows/${id}/delegate`, { targetUserId, comment })).data;
  },
  async reassign(id: string, stepId: string, targetUserId: string, comment: string) {
    return (await api.patch(`/approval-flows/${id}/steps/${stepId}/reassign`, { targetUserId, comment })).data;
  },
  async cancel(id: string, comment: string) {
    return (await api.post(`/approval-flows/${id}/cancel`, { comment })).data;
  },
};
