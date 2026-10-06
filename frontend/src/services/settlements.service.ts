import { api } from '../shared/services/api';

export type Settlement = {
  id: string; code: string; status: string; balanceStatus: string;
  disbursedAmount: number; documentsTotal: number; validatedRefundTotal: number; differenceAmount: number;
  createdAt: string; currentObservation?: string | null;
  certificationStatus: string; certifiedAt?: string | null; certifiedBy?: { id: string; name: string } | null;
  expenseRequest: any; payment: any; currency: any; company?: any; preparedBy: any;
  documents?: any[]; refunds?: any[]; audits?: any[]; approvalFlow?: any;
};

export const settlementsApi = {
  list: async (params: Record<string, string> = {}) => (await api.get<Settlement[]>('/settlements', { params })).data,
  indicators: async () => (await api.get('/settlements/indicators')).data,
  get: async (id: string) => (await api.get<Settlement>(`/settlements/${id}`)).data,
  create: async (expenseRequestId: string, paymentId: string) => (await api.post<Settlement>('/settlements', { expenseRequestId, paymentId })).data,
  eligible: async (settlementId: string) => (await api.get(`/settlements/${settlementId}/eligible-documents`)).data,
  select: async (id: string, documentId: string) => (await api.post(`/settlements/${id}/documents`, { documentId })).data,
  remove: async (id: string, documentId: string) => (await api.delete(`/settlements/${id}/documents/${documentId}`)).data,
  action: async (id: string, action: string, comment?: string) => (await api.post(`/settlements/${id}/${action}`, comment === undefined ? {} : { comment })).data,
  refund: async (id: string, values: Record<string, string>, file: File) => { const data = new FormData(); Object.entries(values).forEach(([key, value]) => data.append(key, value)); data.append('file', file); return (await api.post(`/settlements/${id}/refunds`, data)).data; },
  validateRefund: async (id: string, refundId: string, approve: boolean, comment?: string) => (await api.patch(`/settlements/${id}/refunds/${refundId}/validate`, { approve, comment })).data,
  pendingRefunds: async () => (await api.get('/settlements/refunds/pending-treasury')).data,
  reviewRefund: async (id: string, refundId: string, action: string, comment?: string) => (await api.patch(`/settlements/${id}/refunds/${refundId}/validate`, { action, comment })).data,
  correctRefund: async (id: string, refundId: string, values: Record<string, string>, file: File) => { const data = new FormData(); Object.entries(values).forEach(([key, value]) => data.append(key, value)); data.append('file', file); return (await api.patch(`/settlements/${id}/refunds/${refundId}/correct`, data)).data; },
};

export const getPaidDisbursements = async (requestId: string) => (await api.get(`/expense-request-payments/expense-request/${requestId}`)).data;
