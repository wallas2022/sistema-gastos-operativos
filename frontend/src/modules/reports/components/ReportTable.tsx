import { Box, Button, Flex, Table, Text } from '@chakra-ui/react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import type { ReportMeta, SortOrder } from '../types/reports.types';

export type Column = { key: string; label: string; render?: (value: any, row: any) => React.ReactNode; sortable?: boolean };
type Props = { rows: any[]; columns: Column[]; meta: ReportMeta; sortBy?: string; sortOrder: SortOrder; onSort: (key: string) => void; onPage: (page: number) => void };
export function ReportTable({ rows, columns, meta, sortBy, sortOrder, onSort, onPage }: Props) {
  return <Box bg="white" borderWidth="1px" rounded="2xl" overflowX="auto">
    <Table.Root size="sm"><Table.Header><Table.Row>{columns.map((column) => <Table.ColumnHeader key={column.key} whiteSpace="nowrap"><Button variant="ghost" size="xs" disabled={!column.sortable} onClick={() => column.sortable && onSort(column.key)}>{column.label}{sortBy === column.key && (sortOrder === 'asc' ? <ArrowUp size={13}/> : <ArrowDown size={13}/>)}</Button></Table.ColumnHeader>)}</Table.Row></Table.Header>
      <Table.Body>{rows.length ? rows.map((row, index) => <Table.Row key={row.id || row.code || row.number || index}>{columns.map((column) => <Table.Cell key={column.key} whiteSpace="nowrap">{column.render ? column.render(row[column.key], row) : String(row[column.key] ?? '—')}</Table.Cell>)}</Table.Row>) : <Table.Row><Table.Cell colSpan={columns.length}><Text textAlign="center" color="gray.500" py="8">No hay datos para los filtros aplicados.</Text></Table.Cell></Table.Row>}</Table.Body></Table.Root>
    <Flex justify="space-between" align="center" p="4" borderTopWidth="1px"><Text fontSize="sm" color="gray.600">{meta.total} registros · Página {meta.page} de {meta.totalPages}</Text><Flex gap="2"><Button size="sm" variant="outline" disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)}>Anterior</Button><Button size="sm" variant="outline" disabled={meta.page >= meta.totalPages} onClick={() => onPage(meta.page + 1)}>Siguiente</Button></Flex></Flex>
  </Box>;
}
