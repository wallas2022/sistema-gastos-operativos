import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { reportsService } from '../modules/reports/services/reports.service';
import type { ExecutiveReport, ReportCatalogs, ReportFilters, ReportKind, ReportResponse } from '../modules/reports/types/reports.types';

const defaultFilters: ReportFilters = { page: 1, pageSize: 10, sortOrder: 'asc' };
type State = { kind: ReportKind; filters: ReportFilters; result: ReportResponse | null; executive: ExecutiveReport | null; catalogs: ReportCatalogs | null; loading: boolean; exporting: boolean; error: string | null };
const initialState: State = { kind: 'budget', filters: defaultFilters, result: null, executive: null, catalogs: null, loading: false, exporting: false, error: null };
const message = (error: any) => error?.response?.data?.message || error?.message || 'No fue posible cargar el reporte.';

export const loadReport = createAsyncThunk('reports/load', async (_, apiThunk) => { const state = (apiThunk.getState() as any).reports as State; if (state.kind === 'executive') return { executive: await reportsService.executive(state.filters) }; return { result: await reportsService.report(state.kind, state.filters) }; });
export const loadReportCatalogs = createAsyncThunk('reports/catalogs', reportsService.filters);
export const exportReport = createAsyncThunk('reports/export', async (format: 'excel' | 'pdf', apiThunk) => { const state = (apiThunk.getState() as any).reports as State; await reportsService.export(state.kind, format, state.filters); });

const slice = createSlice({ name: 'reports', initialState, reducers: {
  initializeReport(state, action: PayloadAction<ReportKind>) { state.kind = action.payload; state.filters = { ...defaultFilters, sortOrder: action.payload === 'budget' ? 'asc' : 'desc' }; state.result = null; state.executive = null; state.error = null; },
  setFilters(state, action: PayloadAction<Partial<ReportFilters>>) { state.filters = { ...state.filters, ...action.payload }; },
  clearFilters(state) { state.filters = { ...defaultFilters, sortOrder: state.kind === 'budget' ? 'asc' : 'desc' }; },
}, extraReducers: (builder) => builder
  .addCase(loadReport.pending, (state) => { state.loading = true; state.error = null; })
  .addCase(loadReport.fulfilled, (state, action) => { state.loading = false; state.result = action.payload.result || null; state.executive = action.payload.executive || null; })
  .addCase(loadReport.rejected, (state, action) => { state.loading = false; state.error = message(action.error); })
  .addCase(loadReportCatalogs.fulfilled, (state, action) => { state.catalogs = action.payload; })
  .addCase(loadReportCatalogs.rejected, (state, action) => { state.error = message(action.error); })
  .addCase(exportReport.pending, (state) => { state.exporting = true; state.error = null; })
  .addCase(exportReport.fulfilled, (state) => { state.exporting = false; })
  .addCase(exportReport.rejected, (state, action) => { state.exporting = false; state.error = message(action.error); }),
});
export const { initializeReport, setFilters, clearFilters } = slice.actions;
export const reportsReducer = slice.reducer;
