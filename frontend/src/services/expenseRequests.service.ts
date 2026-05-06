import { api } from "../shared/services/api";

export interface ExpenseRequestItem {
  id: string;
  requestId: string;
  name: string;
  description: string;
  quantity: number;
  unitAmount: number;
  totalAmount: number;
  policyStatus: string;
  createdAt: string;
}

export interface ExpenseRequestValidation {
  id: string;
  requestId: string;
  type: string;
  status: string;
  message: string;
  createdAt: string;
}

export interface ExpenseRequest {
  id: string;
  code: string;
  type: string;
  status: string;
  priority: string;
  requesterId: string;
  requesterName: string;
  requesterRole: string;
  companyName: string;
  companyId?: string | null;
  costCenter: string;
  budgetAccount: string;
  concept: string;
  description?: string | null;
  justification: string;
  destination?: string;
  days?: number;
  estimatedDate?: string | null;
  estimatedAmount: number;
  currency: string;
  currencySymbol?: string | null;
  createdAt: string;
  updatedAt: string;
  items?: ExpenseRequestItem[];
  validations?: ExpenseRequestValidation[];
}

export interface CompanyOption {
  id: string;
  code: string;
  name: string;
  country: {
    id: string;
    code: string;
    name: string;
  };
  currency: {
    id: string;
    code: string;
    name: string;
    symbol: string;
  };
}

export const getCompanies = async (): Promise<CompanyOption[]> => {
  const response = await api.get("/catalog/companies");
  return response.data;
};

export const getExpenseRequests = async (): Promise<ExpenseRequest[]> => {
  const response = await api.get("/expense-requests");
  return response.data;
};

export const getExpenseRequestById = async (
  id: string
): Promise<ExpenseRequest> => {
  const response = await api.get(`/expense-requests/${id}`);
  return response.data;
};

export const submitExpenseRequest = async (
  id: string
): Promise<ExpenseRequest> => {
  const response = await api.patch(`/expense-requests/${id}/submit`);
  return response.data;
};