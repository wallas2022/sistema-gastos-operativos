import { useEffect, useMemo, useState } from 'react';
import { Badge, Box, Button, Flex, Heading, Spinner, Text, VStack } from '@chakra-ui/react';
import { Download, RefreshCw } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import { clearFilters, exportReport, initializeReport, loadReport, loadReportCatalogs, setFilters } from '../../../store/reports.slice';
import type { ReportFilters, ReportKind } from '../types/reports.types';
import { ReportFiltersPanel } from './ReportFilters';
import { ReportTable, type Column } from './ReportTable';
import { BudgetMonthlyDetail, BudgetMonthlySummary, type BudgetReportRow } from './BudgetMonthlyDetail';
import { formatMoney } from './money';

const money = (value: any, row: any) => formatMoney(value, row.currency);
const date = (value: any) => value ? new Date(value).toLocaleDateString('es-GT') : 'â€”';
const duration = (value: any) => value === null || value === undefined ? 'Pendiente' : `${value} min`;
const percent = (value: any) => `${Number(value || 0).toFixed(2)}%`;
const definitions: Record<Exclude<ReportKind, 'executive'>, { title: string; description: string; columns: Column[] }> = {
  budget: { title: 'Reporte de Presupuesto', description: 'Presupuesto aprobado, comprometido, utilizado y disponible desde la versiÃ³n activa.', columns: [{ key: 'company', label: 'Empresa', sortable: true }, { key: 'country', label: 'PaÃ­s', sortable: true }, { key: 'businessUnit', label: 'Unidad', sortable: true }, { key: 'area', label: 'Ãrea', sortable: true }, { key: 'year', label: 'AÃ±o', sortable: true }, { key: 'account', label: 'Cuenta', sortable: true }, { key: 'annualBudget', label: 'Presupuesto anual', render: money, sortable: true }, { key: 'periods', label: 'Presupuesto mensual' }, { key: 'usedAmount', label: 'Utilizado', render: money, sortable: true }, { key: 'committedAmount', label: 'Comprometido', render: money, sortable: true }, { key: 'availableBalance', label: 'Disponible', render: money, sortable: true }, { key: 'executedPercentage', label: '% ejecutado', render: percent, sortable: true }] },
  requests: { title: 'Reporte de Solicitudes', description: 'Detalle de solicitudes y duraciÃ³n real de su flujo de aprobaciÃ³n.', columns: [{ key: 'number', label: 'NÃºmero', sortable: true }, { key: 'date', label: 'Fecha', render: date, sortable: true }, { key: 'requester', label: 'Solicitante', sortable: true }, { key: 'area', label: 'Ãrea' }, { key: 'costCenter', label: 'Centro de costo', sortable: true }, { key: 'amount', label: 'Monto', render: money, sortable: true }, { key: 'status', label: 'Estado', sortable: true }, { key: 'approvalMinutes', label: 'Tiempo aprobaciÃ³n', render: duration }] },
  approvals: { title: 'Reporte de Aprobaciones', description: 'Resultados y carga de trabajo agrupados por aprobador.', columns: [{ key: 'approver', label: 'Aprobador', sortable: true }, { key: 'total', label: 'Cantidad', sortable: true }, { key: 'approved', label: 'Aprobadas', sortable: true }, { key: 'rejected', label: 'Rechazadas', sortable: true }, { key: 'pending', label: 'Pendientes', sortable: true }, { key: 'averageApprovalMinutes', label: 'Promedio', render: duration, sortable: true }] },
  policies: { title: 'Reporte de PolÃ­ticas', description: 'PolÃ­ticas con advertencias, errores o aprobaciÃ³n requerida, ordenadas por incidencia.', columns: [{ key: 'code', label: 'CÃ³digo', sortable: true }, { key: 'policy', label: 'PolÃ­tica', sortable: true }, { key: 'violations', label: 'Incumplimientos', sortable: true }, { key: 'affectedRequests', label: 'Solicitudes afectadas', sortable: true }] },
};
export function ReportPage({ kind }: { kind: Exclude<ReportKind, 'executive'> }) {
  const dispatch = useAppDispatch(); const state = useAppSelector((root) => root.reports); const [draft, setDraft] = useState<ReportFilters>(state.filters); const [selectedBudget, setSelectedBudget] = useState<BudgetReportRow | null>(null); const definition = definitions[kind];
  useEffect(() => { dispatch(initializeReport(kind)); dispatch(loadReportCatalogs()).then(() => dispatch(loadReport())); }, [dispatch, kind]);
  useEffect(() => { setDraft(state.filters); }, [state.filters]);
  const totals = useMemo(() => Object.entries(state.result?.totals || {}), [state.result?.totals]);
  const columns = useMemo(() => definition.columns.map((column) => kind === 'budget' && column.key === 'periods' ? { ...column, render: (_value: any, row: BudgetReportRow) => <BudgetMonthlySummary row={row} onOpen={() => setSelectedBudget(row)}/> } : column), [definition.columns, kind]);
  const apply = () => { dispatch(setFilters(draft)); setTimeout(() => dispatch(loadReport()), 0); };
  const page = (value: number) => { dispatch(setFilters({ page: value })); setTimeout(() => dispatch(loadReport()), 0); };
  const sort = (key: string) => { const order = state.filters.sortBy === key && state.filters.sortOrder === 'asc' ? 'desc' : 'asc'; dispatch(setFilters({ sortBy: key, sortOrder: order, page: 1 })); setTimeout(() => dispatch(loadReport()), 0); };
  return <VStack align="stretch" gap="5"><Flex justify="space-between" align={{ base: 'start', md: 'center' }} direction={{ base: 'column', md: 'row' }} gap="3"><Box><Badge colorPalette="blue">Datos PostgreSQL</Badge><Heading mt="2" size="lg">{definition.title}</Heading><Text color="gray.500">{definition.description}</Text></Box><Flex gap="2"><Button variant="outline" disabled={state.exporting} onClick={() => dispatch(exportReport('excel'))}><Download size={16}/>Excel</Button><Button variant="outline" disabled={state.exporting} onClick={() => dispatch(exportReport('pdf'))}><Download size={16}/>PDF</Button><Button variant="ghost" onClick={() => dispatch(loadReport())}><RefreshCw size={16}/></Button></Flex></Flex>
    <ReportFiltersPanel kind={kind} value={draft} catalogs={state.catalogs} onChange={(value) => setDraft({ ...draft, ...value })} onApply={apply} onClear={() => { dispatch(clearFilters()); setTimeout(() => dispatch(loadReport()), 0); }} />
    {state.loading && <Flex justify="center" py="12"><Spinner size="xl" /></Flex>}{state.error && <Box bg="red.50" color="red.700" p="4" rounded="xl">{state.error}</Box>}
    {!state.loading && state.result && <><Flex gap="3" wrap="wrap">{totals.map(([key, value]) => <Box key={key} bg="white" borderWidth="1px" rounded="xl" px="4" py="3"><Text fontSize="xs" color="gray.500">{key}</Text><Text fontWeight="bold">{Number(value).toLocaleString('es-GT')}</Text></Box>)}</Flex><ReportTable rows={state.result.data} columns={columns} meta={state.result.meta} sortBy={state.filters.sortBy} sortOrder={state.filters.sortOrder} onSort={sort} onPage={page}/></>}
    {kind === 'budget' && <BudgetMonthlyDetail row={selectedBudget} onClose={() => setSelectedBudget(null)}/>}
  </VStack>;
}

