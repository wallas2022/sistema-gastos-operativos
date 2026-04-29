import { api } from "../../../shared/services/api";


export type ExpenseRequestItemPayload = {
  name: string;
  description?: string;
  quantity: number;
  unitAmount: number;
};

export type CreateExpenseRequestPayload = {
  type: string;
  priority?: string;
  concept: string;
  description?: string;
  justification?: string;
  requesterName: string;
  requesterRole: string;
  companyName: string;
  businessUnit?: string;
  costCenter?: string;
  budgetAccount?: string;
  destination?: string;
  days?: number;
  estimatedDate?: string;
  startDate?: string;
  currency?: string;
  items: ExpenseRequestItemPayload[];
};

export async function createExpenseRequest(
  payload: CreateExpenseRequestPayload
) {
  const response = await api.post("/expense-requests", payload);
  return response.data;
}

export async function getExpenseRequests() {
  const response = await api.get("/expense-requests");
  return response.data;
}

export async function getExpenseRequestById(id: string) {
  const response = await api.get(`/expense-requests/${id}`);
  return response.data;
}

export async function submitExpenseRequest(id: string) {
  const response = await api.post(`/expense-requests/${id}/submit`);
  return response.data;
}