import { Badge, Box, Button, CloseButton, Dialog, Flex, Grid, Heading, Portal, Progress, Text } from '@chakra-ui/react';
import { CalendarDays } from 'lucide-react';
import { formatMoney } from './money';

export type BudgetPeriod = { month: number; amount: number };
export type BudgetReportRow = {
  id: string; company: string; country: string; businessUnit: string; area: string;
  year: number; account: string; accountDescription?: string; currency: string;
  annualBudget: number; monthlyBudget: number; usedAmount: number; committedAmount: number;
  availableBalance: number; executedPercentage: number; periods: BudgetPeriod[];
};

export const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export function normalizeBudgetPeriods(periods: BudgetPeriod[] = []) {
  const values = new Map(periods.map((period) => [period.month, Number(period.amount)]));
  return monthNames.map((name, index) => ({ month: index + 1, name, amount: values.get(index + 1) ?? 0 }));
}

export function budgetMoney(currency: string, value: number) {
  return formatMoney(value, currency);
}

export function BudgetMonthlySummary({ row, onOpen }: { row: BudgetReportRow; onOpen: () => void }) {
  const count = row.periods?.length || 0;
  return <Box minW="170px" whiteSpace="normal">
    <Text fontWeight="semibold">{count} {count === 1 ? 'mes' : 'meses'}</Text>
    <Text fontSize="xs" color="gray.500" mb="2">DistribuciÃ³n aprobada</Text>
    <Button size="xs" variant="outline" colorPalette="blue" onClick={onOpen} aria-label={`Ver detalle mensual de la cuenta ${row.account}`}><CalendarDays size={14}/>Ver detalle</Button>
  </Box>;
}

export function BudgetMonthlyDetail({ row, onClose }: { row: BudgetReportRow | null; onClose: () => void }) {
  const periods = row ? normalizeBudgetPeriods(row.periods) : [];
  const now = new Date();
  const execution = Math.max(0, Number(row?.executedPercentage || 0));
  return <Dialog.Root open={!!row} onOpenChange={(details) => { if (!details.open) onClose(); }} size="cover" placement="center">
    <Portal><Dialog.Backdrop/><Dialog.Positioner><Dialog.Content maxW="1100px" maxH="92vh">
      <Dialog.Header borderBottomWidth="1px"><Box><Dialog.Title>Detalle mensual del presupuesto</Dialog.Title>{row && <Text mt="1" fontSize="sm" color="gray.600">{row.company} Â· {row.account} {row.accountDescription ? `â€” ${row.accountDescription}` : ''} Â· {row.year}</Text>}</Box><Dialog.CloseTrigger asChild><CloseButton size="sm" aria-label="Cerrar detalle mensual"/></Dialog.CloseTrigger></Dialog.Header>
      <Dialog.Body overflowY="auto" py="5">{row && <>
        <Grid templateColumns={{ base: '1fr', sm: 'repeat(2,1fr)', lg: 'repeat(4,1fr)' }} gap="3" mb="5">
          <AnnualMetric label="Presupuesto anual" value={budgetMoney(row.currency, row.annualBudget)}/><AnnualMetric label="Ejecutado" value={budgetMoney(row.currency, row.usedAmount)}/><AnnualMetric label="Comprometido" value={budgetMoney(row.currency, row.committedAmount)}/><AnnualMetric label="Disponible" value={budgetMoney(row.currency, row.availableBalance)}/>
        </Grid>
        <Box bg="gray.50" borderWidth="1px" rounded="xl" p="4" mb="6"><Flex justify="space-between" gap="3" mb="2" wrap="wrap"><Text fontWeight="semibold">EjecuciÃ³n anual</Text><Text fontWeight="bold">{execution.toFixed(2)}%</Text></Flex><Progress.Root value={Math.min(execution, 100)} colorPalette={execution > 100 ? 'red' : execution >= 80 ? 'orange' : 'blue'} aria-label={`EjecuciÃ³n anual ${execution.toFixed(2)} por ciento`}><Progress.Track><Progress.Range/></Progress.Track></Progress.Root>{execution > 100 && <Text mt="2" fontSize="sm" color="red.700" fontWeight="semibold">El total ejecutado supera el presupuesto anual.</Text>}</Box>
        <Flex justify="space-between" align={{ base: 'start', md: 'center' }} direction={{ base: 'column', md: 'row' }} gap="2" mb="3"><Heading size="md">DistribuciÃ³n mensual</Heading><Text fontSize="sm" color="gray.600">Los importes corresponden a la distribuciÃ³n aprobada de la partida.</Text></Flex>
        <Grid templateColumns={{ base: '1fr', sm: 'repeat(2,1fr)', lg: 'repeat(3,1fr)', xl: 'repeat(4,1fr)' }} gap="4">
          {periods.map((period) => { const current = row.year === now.getFullYear() && period.month === now.getMonth() + 1; return <Box key={period.month} borderWidth="1px" borderColor={current ? 'blue.400' : 'gray.200'} boxShadow={current ? '0 0 0 1px var(--chakra-colors-blue-400)' : 'sm'} rounded="xl" p="4" bg={current ? 'blue.50' : 'white'}><Flex justify="space-between" align="center" gap="2" mb="4"><Text fontSize="sm" fontWeight="bold" letterSpacing="wide" textTransform="uppercase">{period.name}</Text>{current && <Badge colorPalette="blue">Mes actual</Badge>}</Flex><Text fontSize="xs" color="gray.500">Presupuesto</Text><Text fontSize="xl" fontWeight="bold">{budgetMoney(row.currency, period.amount)}</Text><Box borderTopWidth="1px" mt="4" pt="3"><Text fontSize="xs" color="gray.500">EjecuciÃ³n mensual</Text><Text fontSize="sm" color="gray.700">No disponible en este reporte</Text></Box></Box>; })}
        </Grid>
      </>}</Dialog.Body>
      <Dialog.Footer borderTopWidth="1px"><Button variant="outline" onClick={onClose}>Cerrar</Button></Dialog.Footer>
    </Dialog.Content></Dialog.Positioner></Portal>
  </Dialog.Root>;
}

function AnnualMetric({ label, value }: { label: string; value: string }) {
  return <Box borderWidth="1px" rounded="xl" p="4" bg="white"><Text fontSize="xs" color="gray.500">{label}</Text><Text mt="1" fontWeight="bold">{value}</Text></Box>;
}


