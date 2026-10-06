import { Badge, Box, Button, Grid, Heading, Input, Spinner, Table, Text } from '@chakra-ui/react';
import { useEffect, useMemo, useState } from 'react';
import { bankingApi } from '../../services/banking.service';
import { disbursementsApi } from '../../services/disbursements.service';
import { SearchableSelect } from '../../common/SearchableSelect';

const requesterModalities = new Set(['REEMBOLSO', 'ANTICIPO_VIATICOS']);
const modalityLabel: Record<string, string> = { REEMBOLSO: 'Reembolso', ANTICIPO_VIATICOS: 'Anticipo de viáticos', PAGO_PROVEEDOR: 'Pago a proveedor', PAGO_SERVICIO: 'Pago de servicio', PAGO_DIRECTO: 'Pago directo' };

export function TreasuryDisbursementsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [requestId, setRequestId] = useState('');
  const [accounts, setAccounts] = useState<any[]>([]);
  const [file, setFile] = useState<File>();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({ paymentMethod: 'TRANSFERENCIA', bankAccountId: '', paymentDate: '', amountPaid: '', referenceNumber: '', notes: '', beneficiaryName: '', beneficiaryTaxId: '', bankName: '', accountNumber: '' });
  const selected = useMemo(() => requests.find((item) => item.id === requestId), [requests, requestId]);
  const requesterPayment = selected ? requesterModalities.has(selected.paymentModality || 'REEMBOLSO') : true;

  const load = async () => setRequests(await disbursementsApi.pending());
  useEffect(() => { void load(); }, []);
  const choose = async (id: string) => {
    const request = requests.find((item) => item.id === id);
    setRequestId(id);
    setForm((current) => ({ ...current, bankAccountId: '', beneficiaryName: request?.intendedBeneficiaryName || request?.requesterName || '', beneficiaryTaxId: request?.intendedBeneficiaryTaxId || '', amountPaid: String(request?.budgetAmount || request?.estimatedAmount || '') }));
    setAccounts(request && requesterModalities.has(request.paymentModality || 'REEMBOLSO') ? await bankingApi.userAccounts(request.requesterId, request.currencyId) : []);
  };
  const submit = async () => {
    if (!selected || !file) return;
    setBusy(true); setMessage('');
    try {
      await disbursementsApi.register({ ...form, expenseRequestId: selected.id, currencyId: selected.currencyId }, file);
      setMessage(requesterPayment ? 'Desembolso registrado correctamente.' : 'Pago directo registrado correctamente.');
      setRequestId(''); setAccounts([]); setFile(undefined); await load();
    } catch (error: any) { setMessage(error.response?.data?.message || 'No se pudo registrar la ejecución financiera.'); }
    finally { setBusy(false); }
  };
  const valid = !!selected && !!form.paymentDate && !!form.amountPaid && !!form.referenceNumber && !!file && (requesterPayment ? !!form.bankAccountId : !!form.beneficiaryName.trim());

  return <Box p={6} maxW="1200px"><Heading size="lg">Ejecución financiera de solicitudes</Heading><Text color="gray.600" mb={5}>Bandeja de solicitudes aprobadas para desembolso al solicitante o pago directo.</Text>
    <Box bg="white" borderWidth="1px" rounded="2xl" overflowX="auto" mb="6"><Table.Root size="sm"><Table.Header><Table.Row><Table.ColumnHeader>Solicitud</Table.ColumnHeader><Table.ColumnHeader>Solicitante</Table.ColumnHeader><Table.ColumnHeader>Empresa</Table.ColumnHeader><Table.ColumnHeader>Modalidad</Table.ColumnHeader><Table.ColumnHeader>Beneficiario</Table.ColumnHeader><Table.ColumnHeader>Monto</Table.ColumnHeader><Table.ColumnHeader>Estado</Table.ColumnHeader><Table.ColumnHeader>Acción</Table.ColumnHeader></Table.Row></Table.Header><Table.Body>{requests.map((request) => { const requester = requesterModalities.has(request.paymentModality || 'REEMBOLSO'); return <Table.Row key={request.id}><Table.Cell>{request.code}</Table.Cell><Table.Cell>{request.requesterName}</Table.Cell><Table.Cell>{request.company?.name || request.companyName}</Table.Cell><Table.Cell><Badge colorPalette={requester ? 'blue' : 'purple'}>{modalityLabel[request.paymentModality] || request.paymentModality || 'Reembolso'}</Badge></Table.Cell><Table.Cell>{requester ? request.requesterName : request.intendedBeneficiaryName}</Table.Cell><Table.Cell>{request.currencyRef?.code || request.currency} {Number(request.budgetAmount || request.estimatedAmount).toLocaleString('es-GT')}</Table.Cell><Table.Cell>APROBADA</Table.Cell><Table.Cell><Button size="xs" variant="outline" onClick={() => void choose(request.id)}>Registrar</Button></Table.Cell></Table.Row>; })}</Table.Body></Table.Root></Box>
    <Grid gap={4} bg="white" borderWidth="1px" rounded="2xl" p="5">
      <SearchableSelect value={requestId} onChange={(value) => void choose(value)} placeholder="Buscar solicitud aprobada" options={requests.map((request) => ({ value: request.id, label: `${request.code} — ${modalityLabel[request.paymentModality] || 'Reembolso'} — ${request.intendedBeneficiaryName || request.requesterName} — ${request.currencyRef?.code || request.currency} ${request.budgetAmount || request.estimatedAmount}` }))} />
      {selected && <Box bg={requesterPayment ? 'blue.50' : 'purple.50'} borderWidth="1px" rounded="xl" p="3"><Text fontWeight="semibold">{requesterPayment ? 'Desembolso al solicitante' : 'Pago directo a tercero'}</Text><Text fontSize="sm">¿Qué se paga? {selected.concept} · ¿A quién? {form.beneficiaryName} · Modalidad: {modalityLabel[selected.paymentModality]}</Text></Box>}
      {requesterPayment ? <><select aria-label="Cuenta bancaria del solicitante" value={form.bankAccountId} onChange={(event) => setForm({ ...form, bankAccountId: event.target.value })} disabled={!requestId}><option value="">Cuenta destino compatible</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.bank.name} — {account.accountNumber} — {account.currency.code}{account.isDefault ? ' — predeterminada' : ''}</option>)}</select>{requestId && accounts.length === 0 && <Text color="orange.600">El solicitante no tiene cuentas activas en la moneda de la solicitud.</Text>}</> : <><Input aria-label="Beneficiario" placeholder="Beneficiario o razón social" value={form.beneficiaryName} onChange={(event) => setForm({ ...form, beneficiaryName: event.target.value })}/><Input aria-label="Identificación fiscal" placeholder="NIT o identificación fiscal" value={form.beneficiaryTaxId} onChange={(event) => setForm({ ...form, beneficiaryTaxId: event.target.value })}/><Input aria-label="Banco del beneficiario" placeholder="Banco del beneficiario, cuando corresponda" value={form.bankName} onChange={(event) => setForm({ ...form, bankName: event.target.value })}/><Input aria-label="Cuenta del beneficiario" placeholder="Cuenta bancaria, cuando corresponda" value={form.accountNumber} onChange={(event) => setForm({ ...form, accountNumber: event.target.value })}/></>}
      <select aria-label="Medio de pago" value={form.paymentMethod} onChange={(event) => setForm({ ...form, paymentMethod: event.target.value })}><option>TRANSFERENCIA</option><option>DEPOSITO</option><option>CHEQUE</option><option>EFECTIVO</option><option>OTRO</option></select>
      <Input aria-label="Fecha de pago" type="date" value={form.paymentDate} onChange={(event) => setForm({ ...form, paymentDate: event.target.value })}/><Input aria-label="Monto pagado" type="number" placeholder="Monto" value={form.amountPaid} onChange={(event) => setForm({ ...form, amountPaid: event.target.value })}/><Input aria-label="Referencia de pago" placeholder="Referencia bancaria o de pago" value={form.referenceNumber} onChange={(event) => setForm({ ...form, referenceNumber: event.target.value })}/><Input aria-label="Observaciones" placeholder="Observaciones" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })}/><Input aria-label="Comprobante de pago" type="file" accept="application/pdf,image/jpeg,image/png" onChange={(event) => setFile(event.target.files?.[0])}/>
      {message && <Text color={message.includes('correctamente') ? 'green.600' : 'red.600'}>{message}</Text>}<Button colorPalette="blue" disabled={busy || !valid} onClick={submit}>{busy ? <Spinner size="sm"/> : requesterPayment ? 'Registrar desembolso' : 'Registrar pago directo'}</Button>
    </Grid>
  </Box>;
}
