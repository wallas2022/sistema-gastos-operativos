export type ReportMeta = { page: number; pageSize: number; total: number; totalPages: number };
export type PaginatedReport<T> = { data: T[]; meta: ReportMeta; totals?: Record<string, number> };

export type ExportColumn = {
  header: string;
  key: string;
  width?: number;
  format?: 'money' | 'percent' | 'date' | 'duration';
};

export type ExportPayload = {
  title: string;
  fileName: string;
  columns: ExportColumn[];
  rows: Record<string, unknown>[];
  totals?: Record<string, unknown>;
};
