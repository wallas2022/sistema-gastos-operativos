export type ReportKind = 'budget' | 'requests' | 'approvals' | 'policies' | 'executive';
export type SortOrder = 'asc' | 'desc';
export type ReportFilters = { companyId?: string; countryId?: string; businessUnit?: string; area?: string; year?: number; account?: string; status?: string; requesterId?: string; expenseType?: string; costCenter?: string; dateFrom?: string; dateTo?: string; page: number; pageSize: number; sortBy?: string; sortOrder: SortOrder };
export type ReportMeta = { page: number; pageSize: number; total: number; totalPages: number };
export type ReportResponse<T = Record<string, unknown>> = { data: T[]; meta: ReportMeta; totals?: Record<string, number> };
export type CatalogOption = { id: string; name: string };
export type ReportCatalogs = { companies: CatalogOption[]; countries: CatalogOption[]; users: CatalogOption[]; dimensions: Array<{ businessUnit: string; area: string; accountCode: string; accountDescription: string }>; years: number[]; statuses: string[]; expenseTypes: string[] };
export type ExecutiveReport = { summary: any; budget: any; workflow: any; policies: any; approvals: any[]; charts: any; trends: any };
