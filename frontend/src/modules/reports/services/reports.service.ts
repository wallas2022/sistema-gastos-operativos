import { api } from '../../../shared/services/api';
import type { ExecutiveReport, ReportCatalogs, ReportFilters, ReportKind, ReportResponse } from '../types/reports.types';

const query = (filters: ReportFilters) => Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== '' && value !== undefined));
export const reportsService = {
  filters: async () => (await api.get<ReportCatalogs>('/reports/filters')).data,
  report: async (kind: Exclude<ReportKind, 'executive'>, filters: ReportFilters) => (await api.get<ReportResponse>(`/reports/${kind}`, { params: query(filters) })).data,
  executive: async (filters: ReportFilters) => (await api.get<ExecutiveReport>('/reports/executive', { params: query(filters) })).data,
  export: async (kind: ReportKind, format: 'excel' | 'pdf', filters: ReportFilters) => {
    const response = await api.get<Blob>(`/reports/${kind}/export/${format}`, { params: query(filters), responseType: 'blob' });
    const disposition = response.headers['content-disposition'] as string | undefined;
    const name = disposition?.match(/filename="?([^";]+)"?/)?.[1] || `reporte-${kind}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
    const url = URL.createObjectURL(response.data); const anchor = document.createElement('a'); anchor.href = url; anchor.download = name; document.body.appendChild(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url);
  },
};
