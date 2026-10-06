import { Badge, Box, Button, Flex, Grid, Heading, Input, Spinner, Table, Text } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Settlement, settlementsApi } from '../../services/settlements.service';

const money = (value: number, code = 'GTQ') => new Intl.NumberFormat('es-GT', { style: 'currency', currency: code }).format(Number(value));

export function LiquidationsPage() {
  const [rows, setRows] = useState<Settlement[]>([]); const [stats, setStats] = useState<any>(); const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState(''); const [code, setCode] = useState(''); const [status, setStatus] = useState('');
  const load = async () => { setLoading(true); try { const [list, indicators] = await Promise.all([settlementsApi.list({ request, code, status }), settlementsApi.indicators()]); setRows(list); setStats(indicators); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, []);
  return <Box p={6}>
    <Flex justify="space-between" align="center" mb={6}><Box><Heading size="lg">Rendición y liquidaciones</Heading><Text color="gray.600">Comprobantes validados, diferencias, devoluciones y aprobación.</Text></Box><RouterLink to="/rendicion-conciliacion/liquidaciones/nueva"><Button colorPalette="blue">Nueva liquidación</Button></RouterLink></Flex>
    <Grid templateColumns={{ base: '1fr 1fr', lg: 'repeat(6,1fr)' }} gap={3} mb={6}>{[['Pendientes',stats?.pending],['Observadas',stats?.observed],['Cuadradas',stats?.balanced],['Pend. devolución',stats?.pendingRefund],['Cerradas',stats?.closed],['Monto por devolver',money(stats?.pendingRefundAmount||0)]].map(([label,value])=><Box key={label as string} borderWidth="1px" borderRadius="md" p={4}><Text fontSize="sm" color="gray.600">{label}</Text><Text fontWeight="bold" fontSize="xl">{value ?? 0}</Text></Box>)}</Grid>
    <Flex gap={3} mb={4} wrap="wrap"><Input maxW="220px" placeholder="Solicitud" value={request} onChange={e=>setRequest(e.target.value)}/><Input maxW="220px" placeholder="Liquidación" value={code} onChange={e=>setCode(e.target.value)}/><select style={{border:'1px solid #d4d4d8',borderRadius:6,padding:'0 12px'}} value={status} onChange={e=>setStatus(e.target.value)}><option value="">Todos los estados</option>{['BORRADOR','PENDIENTE_REVISION','OBSERVADA','APROBADA','CERRADA','RECHAZADA'].map(s=><option key={s}>{s}</option>)}</select><Button onClick={load}>Filtrar</Button></Flex>
    {loading ? <Spinner/> : <Table.Root variant="outline"><Table.Header><Table.Row><Table.ColumnHeader>Liquidación</Table.ColumnHeader><Table.ColumnHeader>Solicitud</Table.ColumnHeader><Table.ColumnHeader>Solicitante</Table.ColumnHeader><Table.ColumnHeader>Desembolso</Table.ColumnHeader><Table.ColumnHeader>Rendido</Table.ColumnHeader><Table.ColumnHeader>Diferencia</Table.ColumnHeader><Table.ColumnHeader>Estado</Table.ColumnHeader><Table.ColumnHeader>Acción</Table.ColumnHeader></Table.Row></Table.Header><Table.Body>{rows.map(row=><Table.Row key={row.id}><Table.Cell>{row.code}</Table.Cell><Table.Cell>{row.expenseRequest.code}</Table.Cell><Table.Cell>{row.expenseRequest.requesterName}</Table.Cell><Table.Cell>{money(row.disbursedAmount,row.currency.code)}</Table.Cell><Table.Cell>{money(row.documentsTotal,row.currency.code)}</Table.Cell><Table.Cell>{money(row.differenceAmount,row.currency.code)}</Table.Cell><Table.Cell><Badge>{row.status}</Badge><Text fontSize="xs">{row.balanceStatus}</Text></Table.Cell><Table.Cell><RouterLink to={`/rendicion-conciliacion/liquidaciones/${row.id}`}><Button size="sm">Ver</Button></RouterLink></Table.Cell></Table.Row>)}</Table.Body></Table.Root>}
  </Box>;
}
