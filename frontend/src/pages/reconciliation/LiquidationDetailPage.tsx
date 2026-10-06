import { Badge, Box, Button, Flex, Grid, Heading, Input, Spinner, Table, Text, Textarea, VStack } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { bankingApi } from '../../services/banking.service';
import { Settlement, settlementsApi } from '../../services/settlements.service';

const money = (value: any, code = 'GTQ') => new Intl.NumberFormat('es-GT', { style: 'currency', currency: code }).format(Number(value || 0));

export function LiquidationDetailPage() {
  const { id = '' } = useParams();
  const [data, setData] = useState<Settlement>();
  const [eligible, setEligible] = useState<any[]>([]);
  const [banks, setBanks] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [comment, setComment] = useState('');
  const [file, setFile] = useState<File>();
  const [refund, setRefund] = useState({ paymentMethod: 'TRANSFERENCIA', amount: '', currencyId: '', operationDate: '', referenceNumber: '', bankId: '', observations: '' });

  const load = async () => {
    const current = await settlementsApi.get(id);
    setData(current);
    setRefund((value) => ({ ...value, currencyId: value.currencyId || current.currency.id }));
    const [documents, bankRows] = await Promise.all([settlementsApi.eligible(current.id), bankingApi.banks()]);
    setEligible(documents); setBanks(bankRows);
  };
  useEffect(() => { void load(); }, [id]);
  useEffect(() => {
    if (!data) return;
    const pendingRefund = Math.max(0, Number(data.differenceAmount || 0));
    setRefund((value) => ({ ...value, amount: pendingRefund.toFixed(2) }));
  }, [data?.differenceAmount]);
  const run = async (operation: () => Promise<any>) => { setBusy(true); setMessage(''); try { await operation(); await load(); } catch (error: any) { setMessage(error.response?.data?.message || 'No fue posible completar la operación.'); } finally { setBusy(false); } };

  if (!data) return <Spinner />;
  const editable = ['BORRADOR', 'OBSERVADA'].includes(data.status);
  const code = data.currency.code;
  const pendingRefundAmount = Math.max(0, Number(data.differenceAmount || 0));
  const hasPendingRefund = data.refunds?.some((row) => ['PENDIENTE', 'EN_VALIDACION', 'DEVOLUCION_REGISTRADA', 'DEVOLUCION_EN_REVISION', 'CORRECCION_SOLICITADA'].includes(row.status));
  const refundReady = pendingRefundAmount > 0 && !hasPendingRefund && file && refund.bankId && refund.operationDate && refund.amount && refund.referenceNumber && refund.observations;

  return <Box p={6}>
    <Flex justify="space-between" mb={5}><Box><Heading size="lg">{data.code}</Heading><Text>Solicitud {data.expenseRequest.code} · {data.expenseRequest.requesterName} · {data.company?.name || data.expenseRequest.companyName}</Text></Box><Box textAlign="right"><Badge>{data.status}</Badge><Text fontSize="sm">{data.balanceStatus}</Text><Text fontSize="sm">Certificación: {data.certificationStatus}</Text></Box></Flex>
    <Grid templateColumns={{ base: '1fr 1fr', lg: 'repeat(4,1fr)' }} gap={3} mb={6}>{[['Desembolso', data.disbursedAmount], ['Comprobantes', data.documentsTotal], ['Devolución validada', data.validatedRefundTotal], ['Diferencia', data.differenceAmount]].map(([label, value]) => <Box borderWidth="1px" borderRadius="md" p={4} key={label as string}><Text fontSize="sm" color="gray.600">{label}</Text><Text fontWeight="bold" fontSize="xl">{money(value, code)}</Text></Box>)}</Grid>
    {data.currentObservation && <Box bg="orange.50" borderWidth="1px" borderColor="orange.300" p={3} mb={5}><b>Observación:</b> {data.currentObservation}</Box>}
    {message && <Text color="red.600" mb={4}>{message}</Text>}

    <Heading size="md" mb={3}>Comprobantes seleccionados</Heading>
    <Table.Root variant="outline" mb={6}><Table.Header><Table.Row><Table.ColumnHeader>Tipo / documento</Table.ColumnHeader><Table.ColumnHeader>Receptor / empresa fiscal</Table.ColumnHeader><Table.ColumnHeader>Original</Table.ColumnHeader><Table.ColumnHeader>Tasa snapshot</Table.ColumnHeader><Table.ColumnHeader>Total liquidación</Table.ColumnHeader><Table.ColumnHeader /></Table.Row></Table.Header><Table.Body>{data.documents?.map((item) => <Table.Row key={item.id}><Table.Cell>{item.document.ocrResult?.finalVoucherType}<br />{item.document.fileName}</Table.Cell><Table.Cell>{item.document.ocrResult?.receiverName || '—'}<br />{item.document.ocrResult?.receiverTaxId || '—'}<br /><Text fontSize="xs">{item.document.ocrResult?.fiscalCompany?.name || 'Empresa no identificada'}</Text></Table.Cell><Table.Cell>{money(item.originalAmount, item.originalCurrency.code)}</Table.Cell><Table.Cell>{item.exchangeRate}</Table.Cell><Table.Cell>{money(item.settlementCurrencyAmount, code)}</Table.Cell><Table.Cell>{editable && <Button size="xs" onClick={() => run(() => settlementsApi.remove(id, item.documentId))}>Retirar</Button>}</Table.Cell></Table.Row>)}</Table.Body></Table.Root>

    {editable && <><Heading size="md" mb={3}>Comprobantes elegibles del Centro Documental</Heading>{eligible.length === 0 ? <Text mb={6}>No hay comprobantes confirmados y fiscalmente compatibles con la empresa de esta liquidación.</Text> : <Table.Root variant="outline" mb={6}><Table.Header><Table.Row><Table.ColumnHeader>Tipo</Table.ColumnHeader><Table.ColumnHeader>Archivo</Table.ColumnHeader><Table.ColumnHeader>Empresa fiscal</Table.ColumnHeader><Table.ColumnHeader>Total</Table.ColumnHeader><Table.ColumnHeader>Validación</Table.ColumnHeader><Table.ColumnHeader /></Table.Row></Table.Header><Table.Body>{eligible.map((document) => <Table.Row key={document.id}><Table.Cell>{document.ocrResult?.finalVoucherType}</Table.Cell><Table.Cell>{document.fileName}</Table.Cell><Table.Cell>{document.ocrResult?.fiscalCompany?.name || '—'}<br />{document.ocrResult?.fiscalCompanyTaxId || '—'}</Table.Cell><Table.Cell>{money(document.ocrResult?.totalAmount, document.ocrResult?.currencyCode)}</Table.Cell><Table.Cell>{document.ocrResult?.complianceResult}</Table.Cell><Table.Cell><Button size="xs" onClick={() => run(() => settlementsApi.select(id, document.id))}>Agregar</Button></Table.Cell></Table.Row>)}</Table.Body></Table.Root>}</>}

    {editable && pendingRefundAmount > 0 && !hasPendingRefund && <Box borderWidth="1px" p={5} borderRadius="md" mb={6}><Heading size="md" mb={1}>Registrar devolución</Heading><Text color="gray.600">Saldo pendiente de devolución: <b>{money(pendingRefundAmount, code)}</b>. Se actualiza automáticamente al agregar o retirar comprobantes.</Text><Text color="gray.600" mb={4}>La evidencia documental PDF, JPG o PNG es obligatoria y será revisada por Tesorería.</Text><Grid templateColumns={{ base: '1fr', md: 'repeat(3,1fr)' }} gap={3}>
      <select value={refund.paymentMethod} onChange={(event) => setRefund({ ...refund, paymentMethod: event.target.value })}><option>TRANSFERENCIA</option><option>DEPOSITO</option></select>
      <select value={refund.bankId} onChange={(event) => setRefund({ ...refund, bankId: event.target.value })}><option value="">Banco</option>{banks.map((bank) => <option key={bank.id} value={bank.id}>{bank.name}</option>)}</select>
      <Input type="date" value={refund.operationDate} onChange={(event) => setRefund({ ...refund, operationDate: event.target.value })} />
      <Input type="number" aria-label="Monto pendiente de devolución" value={refund.amount} readOnly />
      <Input placeholder="Número de referencia" value={refund.referenceNumber} onChange={(event) => setRefund({ ...refund, referenceNumber: event.target.value })} />
      <Input placeholder="Observaciones" value={refund.observations} onChange={(event) => setRefund({ ...refund, observations: event.target.value })} />
      <Input type="file" accept="application/pdf,image/png,image/jpeg" onChange={(event) => setFile(event.target.files?.[0])} />
      <Button colorPalette="blue" disabled={!refundReady || busy} onClick={() => file && run(() => settlementsApi.refund(id, refund, file))}>Registrar devolución</Button>
    </Grid></Box>}

    <Heading size="md" mb={3}>Devoluciones</Heading>{data.refunds?.map((row) => <Flex key={row.id} borderWidth="1px" p={3} mb={2} justify="space-between"><Text>{row.paymentMethod} · {money(row.amount, row.currency.code)} · Ref. {row.referenceNumber} · <Badge>{row.status}</Badge></Text>{row.status === 'CORRECCION_SOLICITADA' && <Button size="xs" disabled={!refundReady} onClick={() => file && run(() => settlementsApi.correctRefund(id, row.id, refund, file))}>Corregir y reenviar</Button>}</Flex>)}
    <Box mt={6} borderWidth="1px" p={5} borderRadius="md"><Heading size="md" mb={3}>Revisión, cierre y certificación</Heading><Textarea placeholder="Comentario u observación" value={comment} onChange={(event) => setComment(event.target.value)} mb={3}/><Flex gap={2} wrap="wrap">{editable && data.balanceStatus === 'CUADRADA' && <Button colorPalette="blue" onClick={() => run(() => settlementsApi.action(id, data.status === 'OBSERVADA' ? 'resubmit' : 'submit', comment || undefined))}>Enviar a revisión</Button>}{data.status === 'PENDIENTE_REVISION' && <><Button colorPalette="green" onClick={() => run(() => settlementsApi.action(id, 'approve', comment || undefined))}>Aprobar</Button><Button onClick={() => run(() => settlementsApi.action(id, 'observe', comment))} disabled={!comment}>Observar</Button><Button colorPalette="red" onClick={() => run(() => settlementsApi.action(id, 'reject', comment))} disabled={!comment}>Rechazar</Button></>}{data.status === 'APROBADA' && <Button colorPalette="green" onClick={() => run(() => settlementsApi.action(id, 'close'))}>Cerrar liquidación</Button>}{data.status === 'CERRADA' && data.certificationStatus !== 'CERTIFICADA' && <Button colorPalette="purple" onClick={() => run(() => settlementsApi.action(id, 'certify'))}>Certificar</Button>}</Flex></Box>
    <Heading size="md" mt={7} mb={3}>Auditoría inmutable</Heading><VStack align="stretch">{data.audits?.map((audit) => <Box key={audit.id} borderLeftWidth="3px" borderColor="blue.400" pl={3}><Text fontWeight="semibold">{audit.action} · {audit.userName} ({audit.userRole || '—'})</Text><Text>{audit.description}</Text><Text fontSize="xs" color="gray.500">{new Date(audit.createdAt).toLocaleString()} · {audit.fromStatus || '—'} → {audit.toStatus || '—'}</Text></Box>)}</VStack>
  </Box>;
}
