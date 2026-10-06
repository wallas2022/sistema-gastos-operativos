import { api } from '../shared/services/api';
export async function previewBudget(file: File, currencyId: string) { const body = new FormData(); body.append('file', file); body.append('currencyId', currencyId); return (await api.post('/budget-imports/preview', body)).data; }
export async function importBudget(file: File, comment: string, currencyId: string) { const body = new FormData(); body.append('file', file); body.append('comment', comment); body.append('currencyId', currencyId); return (await api.post('/budget-imports', body)).data; }
export async function getBudgetVersions() { return (await api.get('/budget-imports/versions')).data; }
export async function getBudgetEvaluation(requestId: string) { return (await api.get(`/budget/requests/${requestId}/evaluation`)).data; }
export type BudgetLineOption = { id: string; periodId: string; month: number; businessUnit: string; area: string; accountCode: string; accountDescription: string; detailDescription: string; currency: string; annualBudget: number; available: number; monthlyBudget: number; monthlyCommitted: number; monthlyExecuted: number; monthlyAvailable: number; version: { id: string; fiscalYear: number; versionNumber: number; status: string; active: boolean } };
export async function getAvailableBudgetLines(params: { companyId: string; countryId: string; estimatedDate?: string }) { return (await api.get<{ year: number; month: number; data: BudgetLineOption[] }>('/budget/available-lines', { params })).data; }
export async function getBudgetLines(params: Record<string, unknown>) { return (await api.get('/budget/lines', { params })).data; }
export async function getBudgetLine(id: string) { return (await api.get(`/budget/lines/${id}`)).data; }
export async function getBudgetFilters() { return (await api.get('/budget/filters')).data; }
