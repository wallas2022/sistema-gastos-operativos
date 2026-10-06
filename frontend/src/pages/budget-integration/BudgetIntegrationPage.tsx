import { useEffect, useState } from 'react';
import { Badge, Box, Button, Flex, Grid, Heading, Input, Spinner, Table, Text, Textarea, VStack } from '@chakra-ui/react';
import { FileSpreadsheet, RefreshCw, Upload } from 'lucide-react';
import { getBudgetVersions, importBudget, previewBudget } from '../../services/budget.service';
import { catalogsService, type Currency } from '../../services/catalogs.service';

export function BudgetIntegrationPage() {
  const [file, setFile] = useState<File>();
  const [comment, setComment] = useState('');
  const [currencyId, setCurrencyId] = useState('');
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [preview, setPreview] = useState<any>();
  const [versions, setVersions] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const load = () => getBudgetVersions().then(setVersions).catch(() => setVersions([]));
  useEffect(() => { void load(); catalogsService.getCurrencies().then(setCurrencies).catch(() => setCurrencies([])); }, []);
  const validate = async () => { if (!file || !currencyId) { setMessage('Seleccione el archivo y la moneda principal.'); return; } setBusy(true); setMessage(''); try { setPreview(await previewBudget(file, currencyId)); } catch (error: any) { setMessage(error.response?.data?.message || 'No se pudo validar el archivo.'); } finally { setBusy(false); } };
  const confirm = async () => { if (!file || !currencyId || !preview?.canImport) return; setBusy(true); try { await importBudget(file, comment, currencyId); setMessage('Versión presupuestaria importada correctamente.'); setPreview(undefined); setFile(undefined); setComment(''); void load(); } catch (error: any) { setMessage(error.response?.data?.message || 'La importación fue revertida.'); } finally { setBusy(false); } };
  const previewCurrency = preview?.preview?.[0]?.currency || currencies.find((item) => item.id === currencyId)?.code;

  return <VStack align="stretch" gap="5" p={{ base: '4', md: '8' }}>
    <Box><Heading size="lg">Integración Presupuestaria</Heading><Text color="gray.600">La moneda seleccionada será la moneda principal de toda la versión.</Text></Box>
    <Box bg="white" borderWidth="1px" rounded="2xl" p="5"><Flex gap="3" align="end" wrap="wrap">
      <Box flex="1" minW="260px"><Text fontWeight="semibold" mb="2">Archivo oficial XLSX</Text><Input type="file" accept=".xlsx" onChange={(event) => { setFile(event.target.files?.[0]); setPreview(undefined); }}/></Box>
      <Box minW="230px"><Text fontWeight="semibold" mb="2">Moneda principal</Text><select style={selectStyle} value={currencyId} onChange={(event) => { setCurrencyId(event.target.value); setPreview(undefined); }}><option value="">Seleccione moneda</option>{currencies.map((currency) => <option key={currency.id} value={currency.id}>{currency.code} - {currency.name}</option>)}</select></Box>
      <Button onClick={validate} disabled={!file || !currencyId || busy}><FileSpreadsheet size={17}/>{busy ? 'Validando...' : 'Validar y previsualizar'}</Button>
    </Flex></Box>
    {message && <Box bg="blue.50" color="blue.800" p="4" rounded="xl">{message}</Box>}{busy && <Flex justify="center"><Spinner/></Flex>}
    {preview && <Box bg="white" borderWidth="1px" rounded="2xl" p="5"><Heading size="md" mb="4">Resultado de validación</Heading><Grid templateColumns={{ base: '1fr 1fr', lg: 'repeat(4,1fr)' }} gap="3"><Metric label="Filas origen" value={preview.summary.sourceRows}/><Metric label="Filas consolidadas" value={preview.summary.importRows}/><Metric label="Errores" value={preview.summary.errors}/><Metric label="Advertencias" value={preview.summary.warnings}/></Grid><Text mt="4"><b>Hoja:</b> {preview.source.sheet} · <b>Ejercicio:</b> {preview.source.fiscalYear} · <b>Moneda:</b> {previewCurrency} · <b>Total:</b> {previewCurrency} {Number(preview.summary.approvedTotal).toLocaleString()}</Text><Heading size="sm" mt="5" mb="2">Conciliación</Heading><Text>Nuevas: {preview.comparison.added} · Eliminadas: {preview.comparison.removed} · Cambios mensuales: {preview.comparison.monthlyChanges} · Cambios anuales: {preview.comparison.annualChanges}</Text><VStack align="stretch" mt="4" maxH="240px" overflowY="auto">{preview.issues.map((issue: any, index: number) => <Flex key={index} gap="2"><Badge colorPalette={issue.severity === 'ERROR' ? 'red' : 'orange'}>{issue.severity}</Badge><Text fontSize="sm">{issue.message}</Text></Flex>)}</VStack><Textarea mt="4" placeholder="Comentario de la versión" value={comment} onChange={(event) => setComment(event.target.value)}/><Button mt="3" colorPalette="blue" disabled={!preview.canImport || busy} onClick={confirm}><Upload size={17}/>Importar versión</Button></Box>}
    <Box bg="white" borderWidth="1px" rounded="2xl" p="5"><Flex justify="space-between" mb="4"><Heading size="md">Versiones</Heading><Button size="sm" variant="outline" onClick={load}><RefreshCw size={15}/>Actualizar</Button></Flex><Table.Root size="sm"><Table.Header><Table.Row><Table.ColumnHeader>Versión</Table.ColumnHeader><Table.ColumnHeader>Archivo</Table.ColumnHeader><Table.ColumnHeader>Estado</Table.ColumnHeader><Table.ColumnHeader>Total</Table.ColumnHeader><Table.ColumnHeader>Importado por</Table.ColumnHeader></Table.Row></Table.Header><Table.Body>{versions.map((version) => <Table.Row key={version.id}><Table.Cell>{version.fiscalYear}.{version.versionNumber}</Table.Cell><Table.Cell>{version.sourceFileName}</Table.Cell><Table.Cell><Badge colorPalette={version.active ? 'green' : 'gray'}>{version.status}</Badge></Table.Cell><Table.Cell>{version.currency?.code} {Number(version.approvedTotal).toLocaleString()}</Table.Cell><Table.Cell>{version.importedBy?.name}</Table.Cell></Table.Row>)}</Table.Body></Table.Root>{!versions.length && <Text color="gray.500" py="5">Aún no existen versiones importadas.</Text>}</Box>
  </VStack>;
}
function Metric({ label, value }: { label: string; value: any }) { return <Box bg="gray.50" p="3" rounded="xl"><Text fontSize="xs" color="gray.500">{label}</Text><Text fontSize="xl" fontWeight="bold">{value}</Text></Box>; }
const selectStyle = { width: '100%', height: '40px', border: '1px solid #CBD5E0', borderRadius: '8px', padding: '0 10px' };
