import { Box, Button, Heading, Spinner, Text, VStack } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getExpenseRequests } from '../../services/expenseRequests.service';
import { getPaidDisbursements, settlementsApi } from '../../services/settlements.service';

export function NewLiquidationPage() {
  const navigate = useNavigate(); const [requests,setRequests]=useState<any[]>([]); const [payments,setPayments]=useState<any[]>([]); const [requestId,setRequestId]=useState(''); const [paymentId,setPaymentId]=useState(''); const [busy,setBusy]=useState(false); const [error,setError]=useState('');
  useEffect(()=>{ getExpenseRequests().then(data=>setRequests(data.filter(item=>['APROBADA','DESEMBOLSADA'].includes(item.status)))).catch(()=>setError('No fue posible cargar las solicitudes.')); },[]);
  const chooseRequest=async(id:string)=>{setRequestId(id);setPaymentId('');const data=await getPaidDisbursements(id);setPayments(data.filter((item:any)=>item.paymentStatus==='PAGADO'));};
  const create=async()=>{if(!requestId||!paymentId)return;setBusy(true);setError('');try{const result=await settlementsApi.create(requestId,paymentId);navigate(`/rendicion-conciliacion/liquidaciones/${result.id}`);}catch(e:any){setError(e.response?.data?.message||'No se pudo crear la liquidación.');}finally{setBusy(false);}};
  return <Box p={6} maxW="800px"><Heading size="lg" mb={2}>Nueva liquidación</Heading><Text color="gray.600" mb={6}>Seleccione una solicitud con desembolso confirmado. Los comprobantes se agregan desde el detalle.</Text><VStack align="stretch" gap={5} borderWidth="1px" borderRadius="md" p={6}>
    <Box><Text fontWeight="semibold" mb={2}>Solicitud</Text><select style={{width:'100%',border:'1px solid #d4d4d8',borderRadius:6,padding:8}} value={requestId} onChange={e=>void chooseRequest(e.target.value)}><option value="">Seleccione…</option>{requests.map(r=><option key={r.id} value={r.id}>{r.code} — {r.requesterName} — {r.companyName}</option>)}</select></Box>
    <Box><Text fontWeight="semibold" mb={2}>Desembolso</Text><select style={{width:'100%',border:'1px solid #d4d4d8',borderRadius:6,padding:8}} value={paymentId} onChange={e=>setPaymentId(e.target.value)} disabled={!requestId}><option value="">Seleccione…</option>{payments.map(p=><option key={p.id} value={p.id}>{p.paymentMethod} — {p.amountPaid} — {p.referenceNumber||'sin referencia'} — {new Date(p.paymentDate||p.createdAt).toLocaleDateString()}</option>)}</select>{requestId&&payments.length===0&&<Text color="orange.600" mt={2}>La solicitud no tiene desembolsos PAGADOS.</Text>}</Box>
    {error&&<Text color="red.600">{error}</Text>}<Button colorPalette="blue" onClick={create} disabled={!paymentId||busy}>{busy?<Spinner size="sm"/>:'Crear borrador'}</Button>
  </VStack></Box>;
}
