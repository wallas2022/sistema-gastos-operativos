import { api } from '../shared/services/api';
export type DashboardFilters = { companyId?: string; countryId?: string; dateFrom?: string; dateTo?: string; status?: string; priority?: string; type?: string; costCenter?: string; requesterId?: string };
const get = async <T>(path: string, filters?: DashboardFilters) => (await api.get<T>(path, { params: filters })).data;
export const dashboardService = {
  summary: (filters: DashboardFilters) => get<any>('/dashboard/summary', filters), budget: (filters: DashboardFilters) => get<any>('/dashboard/budget', filters), workflow: (filters: DashboardFilters) => get<any>('/dashboard/workflow', filters), policies: (filters: DashboardFilters) => get<any>('/dashboard/policies', filters), approvals: (filters: DashboardFilters) => get<any[]>('/dashboard/approvals', filters), charts: (filters: DashboardFilters) => get<any>('/dashboard/charts', filters), trends: (filters: DashboardFilters) => get<any>('/dashboard/trends', filters), filters: () => get<any>('/dashboard/filters'),
};
