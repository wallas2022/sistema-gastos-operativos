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

export interface ExpenseRequestTrace {
  id: string;
  event: string;
  description: string;
  userName?: string | null;
  fromStatus?: string | null;
  toStatus?: string | null;
  createdAt: string;
}

export interface ExpenseRequestDocument {
  id: string;
  fileName: string;
  fileType: string;
  mimeType: string;
  sizeBytes: number;
  status: string;
  userId: string;
  expenseRequestId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseRequest {
  id: string;
  code: string;
  type: string;
  status: string;
  priority: string;
  paymentModality: string;
  intendedBeneficiaryName?: string | null;
  intendedBeneficiaryTaxId?: string | null;
  requesterId: string;
  requesterName: string;
  requesterRole: string;
  companyName: string;
  companyId?: string | null;
  countryId?: string | null;
  currencyId?: string | null;
  costCenter: string;
  budgetAccount: string;
  budgetLineId?: string | null;
  budgetPeriodId?: string | null;
  budgetLine?: any;
  budgetPeriod?: any;
  budgetReservations?: any[];
  concept: string;
  description?: string | null;
  justification: string;
  destination?: string;
  days?: number;
  estimatedDate?: string | null;
  estimatedAmount: number;
  currency: string;
  currencySymbol?: string | null;
  originalAmount?: number;
  originalCurrencyCode?: string;
  exchangeRate?: number;
  budgetAmount?: number | null;
  budgetCurrencyCode?: string | null;
  createdAt: string;
  updatedAt: string;
  items?: ExpenseRequestItem[];
  validations?: ExpenseRequestValidation[];
  traces?: ExpenseRequestTrace[];
  documents?: ExpenseRequestDocument[];
}

export interface ExpenseRequestItemPayload {
  name: string;
  description?: string;
  quantity: number;
  unitAmount: number;
}

export interface ExpenseRequestPayload {
  type: string;
  priority: string;
  paymentModality: string;
  intendedBeneficiaryName?: string;
  intendedBeneficiaryTaxId?: string;
  companyId: string;
  countryId: string;
  currencyId: string;
  businessUnit?: string;
  costCenter?: string;
  budgetAccount?: string;
  budgetLineId: string;
  budgetPeriodId: string;
  concept: string;
  description?: string;
  justification: string;
  destination?: string;
  days?: number;
  estimatedDate?: string;
  items: ExpenseRequestItemPayload[];
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

export const resubmitExpenseRequest = async (id: string): Promise<ExpenseRequest> => {
  const response = await api.patch(`/expense-requests/${id}/resubmit`);
  return response.data;
};

export const createExpenseRequest = async (
  payload: ExpenseRequestPayload
): Promise<ExpenseRequest> => {
  const response = await api.post('/expense-requests', payload);
  return response.data;
};

export const updateExpenseRequest = async (
  id: string,
  payload: ExpenseRequestPayload
): Promise<ExpenseRequest> => {
  const response = await api.patch(`/expense-requests/${id}`, payload);
  return response.data;
};

export const cancelExpenseRequest = async (
  id: string
): Promise<ExpenseRequest> => {
  const response = await api.patch(`/expense-requests/${id}/cancel`);
  return response.data;
};

export const associateExpenseRequestDocuments = async (
  id: string,
  documentIds: string[]
): Promise<ExpenseRequest> => {
  const response = await api.patch(`/expense-requests/${id}/documents`, {
    documentIds,
  });
  return response.data;
};
