import { Badge, Box, Button, Grid, Heading, Input, Stack, Text } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { catalogsService, type Company } from '../../services/catalogs.service';

export function FiscalCompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const load = () => catalogsService.getCompanies().then(setCompanies);
  useEffect(() => { void load(); }, []);
  const change = (id: string, field: keyof Company, value: string) => setCompanies((rows) => rows.map((row) => row.id === id ? { ...row, [field]: value } : row));
  const save = async (company: Company) => {
    setSaving(company.id); setMessage('');
    try {
      await catalogsService.updateCompany(company.id, { legalName: company.legalName || company.name, tradeName: company.tradeName || company.name, taxId: company.taxId || undefined });
      setIsError(false); setMessage(`Datos fiscales de ${company.code} actualizados.`); await load();
    } catch (error: any) {
      setIsError(true); setMessage(error.response?.data?.message || 'No se pudieron actualizar los datos fiscales.');
    } finally { setSaving(null); }
  };

  return <Box p={{ base: '4', md: '8' }}><Heading>Maestro fiscal de empresas</Heading><Text color="gray.600" mb="6">El identificador fiscal configurado es el criterio principal para validar facturas.</Text>
    {message && <Box mb="4" p="3" borderWidth="1px" borderRadius="md" bg={isError ? 'red.50' : 'green.50'}><Text color={isError ? 'red.700' : 'green.700'}>{message}</Text></Box>}
    <Stack gap="4">{companies.map((company) => <Box key={company.id} borderWidth="1px" borderRadius="xl" p="5" bg="white"><Box display="flex" justifyContent="space-between"><Heading size="sm">{company.code} · {company.name}</Heading><Badge colorPalette={company.active ? 'green' : 'gray'}>{company.active ? 'ACTIVA' : 'INACTIVA'}</Badge></Box><Grid templateColumns={{ base: '1fr', md: 'repeat(3,1fr)' }} gap="3" mt="4"><Box><Text fontSize="sm">Razón social</Text><Input value={company.legalName || ''} onChange={(event) => change(company.id, 'legalName', event.target.value)} /></Box><Box><Text fontSize="sm">Nombre comercial</Text><Input value={company.tradeName || ''} onChange={(event) => change(company.id, 'tradeName', event.target.value)} /></Box><Box><Text fontSize="sm">NIT / RUC</Text><Input value={company.taxId || ''} onChange={(event) => change(company.id, 'taxId', event.target.value)} /></Box></Grid><Text fontSize="sm" color="gray.500" mt="3">País: {company.country?.name || company.countryId}</Text><Button mt="3" size="sm" onClick={() => void save(company)} loading={saving === company.id}>Guardar datos fiscales</Button></Box>)}</Stack>
  </Box>;
}
