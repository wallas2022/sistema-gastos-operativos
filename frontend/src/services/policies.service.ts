import { api } from "../shared/services/api";
import type { Company } from "./catalogs.service";

export type PolicyField =
  | "AMOUNT"
  | "COMPANY"
  | "COUNTRY"
  | "COST_CENTER"
  | "BUDGET_ACCOUNT"
  | "EXPENSE_TYPE"
  | "PRIORITY"
  | "REQUESTER_ROLE"
  | "DESTINATION"
  | "CURRENCY"
  | "DAYS"
  | "DOCUMENT_TYPE";

export type PolicyOperator =
  | "EQUALS"
  | "NOT_EQUALS"
  | "GREATER_THAN"
  | "GREATER_THAN_OR_EQUAL"
  | "LESS_THAN"
  | "LESS_THAN_OR_EQUAL"
  | "CONTAINS"
  | "IN";

export type PolicyResultStatus =
  | "OK"
  | "WARNING"
  | "ERROR"
  | "APPROVAL_REQUIRED"
  | "NOT_APPLICABLE";

export interface PolicyRule {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  field: PolicyField;
  operator: PolicyOperator;
  comparisonValue: string;
  action: PolicyResultStatus;
  message: string;
  priority: number;
  companyId?: string | null;
  company?: Company | null;
  expenseType?: string | null;
  active: boolean;
  validFrom?: string | null;
  validTo?: string | null;
  createdAt: string;
  updatedAt: string;
  approvalSteps?: PolicyApprovalStep[];
}

export interface PolicyApprovalStep {
  id?: string;
  order: number;
  approverRoleId?: string | null;
  approverUserId?: string | null;
  required?: boolean;
  approverRole?: { id: string; code: string; name: string } | null;
  approverUser?: { id: string; name: string; email: string } | null;
}

export type PolicyRulePayload = Pick<
  PolicyRule,
  | "code"
  | "name"
  | "description"
  | "field"
  | "operator"
  | "comparisonValue"
  | "action"
  | "message"
  | "priority"
  | "companyId"
  | "expenseType"
  | "validFrom"
  | "validTo"
> & { approvalSteps?: PolicyApprovalStep[] };

export interface PolicyFilters {
  search?: string;
  companyId?: string;
  countryId?: string;
  expenseType?: string;
  active?: boolean;
  validity?: "CURRENT" | "UPCOMING" | "EXPIRED";
  priority?: number;
  field?: PolicyField;
  operator?: PolicyOperator;
  action?: PolicyResultStatus;
  sortBy?: "priority" | "code" | "name" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface PolicyPage {
  data: PolicyRule[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

export interface PolicySimulationPayload {
  companyId: string;
  countryId: string;
  costCenter?: string;
  budgetAccount?: string;
  expenseType: string;
  priority?: string;
  amount: number;
  currency: string;
  destination?: string;
  requesterRole: string;
  days?: number;
}

export interface PolicySimulationResult {
  evaluatedAt: string;
  results: PolicySimulationRule[];
  ok: PolicySimulationRule[];
  warnings: PolicySimulationRule[];
  errors: PolicySimulationRule[];
  approvalsRequired: PolicySimulationRule[];
  notApplicable: PolicySimulationRule[];
}

export interface PolicySimulationRule {
  ruleId: string;
  code: string;
  name: string;
  status: PolicyResultStatus;
  message: string;
  priority: number;
}

export const policiesService = {
  list: async (filters: PolicyFilters = {}): Promise<PolicyRule[]> => {
    const response = await api.get("/policies", { params: filters });
    return response.data;
  },
  listPage: async (filters: PolicyFilters): Promise<PolicyPage> => {
    const response = await api.get("/policies", { params: filters });
    return response.data;
  },
  getById: async (id: string): Promise<PolicyRule> => {
    const response = await api.get(`/policies/${id}`);
    return response.data;
  },
  create: async (payload: PolicyRulePayload): Promise<PolicyRule> => {
    const response = await api.post("/policies", payload);
    return response.data;
  },
  update: async (
    id: string,
    payload: PolicyRulePayload
  ): Promise<PolicyRule> => {
    const response = await api.patch(`/policies/${id}`, payload);
    return response.data;
  },
  activate: async (id: string): Promise<PolicyRule> => {
    const response = await api.patch(`/policies/${id}/activate`);
    return response.data;
  },
  deactivate: async (id: string): Promise<PolicyRule> => {
    const response = await api.patch(`/policies/${id}/deactivate`);
    return response.data;
  },
  remove: async (id: string): Promise<PolicyRule> => {
    const response = await api.delete(`/policies/${id}`);
    return response.data;
  },
  simulate: async (
    payload: PolicySimulationPayload
  ): Promise<PolicySimulationResult> => {
    const response = await api.post("/policies/simulate", payload);
    return response.data;
  },
};
