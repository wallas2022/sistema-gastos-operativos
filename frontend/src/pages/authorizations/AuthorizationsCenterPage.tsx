import {
  Badge,
  Box,
  Button,
  Flex,
  Grid,
  Heading,
  HStack,
  Input,
  NativeSelect,
  Text,
  VStack,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Filter,
  Send,
  ShieldCheck,
  Timer,
  UserCheck,
  XCircle,
} from "lucide-react";

const authorizationStats = [
  {
    label: "Pendientes",
    value: "12",
    description: "Solicitudes esperando revisión",
    color: "yellow",
    icon: Clock,
  },
  {
    label: "Aprobadas hoy",
    value: "7",
    description: "Trámites autorizados",
    color: "green",
    icon: CheckCircle2,
  },
  {
    label: "Observadas",
    value: "3",
    description: "Requieren corrección",
    color: "orange",
    icon: AlertTriangle,
  },
  {
    label: "SLA vencido",
    value: "2",
    description: "Requieren atención inmediata",
    color: "red",
    icon: Timer,
  },
];

const authorizationRows = [
  {
    code: "SOL-0001",
    requester: "Walter Rosales",
    type: "Gasto de viaje / viáticos",
    concept: "Viaje operativo para supervisión regional",
    amount: "Q 2,950.00",
    priority: "Normal",
    status: "Pendiente aprobación",
    sla: "4 horas restantes",
    color: "yellow",
  },
  {
    code: "SOL-0002",
    requester: "María López",
    type: "Pago a proveedor",
    concept: "Servicio de mantenimiento mensual",
    amount: "Q 8,740.00",
    priority: "Alta",
    status: "Pendiente aprobación",
    sla: "1 hora restante",
    color: "orange",
  },
  {
    code: "SOL-0003",
    requester: "Carlos Méndez",
    type: "Compra de insumos",
    concept: "Compra de materiales administrativos",
    amount: "Q 1,980.00",
    priority: "Urgente",
    status: "SLA próximo a vencer",
    sla: "20 minutos restantes",
    color: "red",
  },
];

const recentEvents = [
  {
    title: "SOL-0008 aprobada",
    description: "Aprobada por Gerencia Administrativa",
    time: "Hace 15 min",
    color: "green",
  },
  {
    title: "SOL-0005 observada",
    description: "Se solicitó ampliar justificación",
    time: "Hace 35 min",
    color: "orange",
  },
  {
    title: "SOL-0003 escalada",
    description: "SLA próximo a vencer",
    time: "Hace 50 min",
    color: "red",
  },
];

export function AuthorizationsCenterPage() {
  return (
    <VStack align="stretch" gap="6">
      <Flex
        justify="space-between"
        align={{ base: "start", md: "center" }}
        direction={{ base: "column", md: "row" }}
        gap="4"
      >
        <Box>
          <Heading size="lg">Centro de Autorizaciones</Heading>
          <Text color="gray.500" mt="1">
            Bandeja unificada para revisión, aprobación, observación y rechazo
            de solicitudes de gasto.
          </Text>
        </Box>

        <HStack>
          <Button variant="outline">
            <Filter size={18} />
            Filtros
          </Button>

          <Button colorPalette="blue">
            <Send size={18} />
            Ver flujo completo
          </Button>
        </HStack>
      </Flex>

      <Grid
        templateColumns={{
          base: "1fr",
          md: "repeat(2, 1fr)",
          xl: "repeat(4, 1fr)",
        }}
        gap="4"
      >
        {authorizationStats.map((item) => (
          <StatCard key={item.label} {...item} />
        ))}
      </Grid>

      <Grid templateColumns={{ base: "1fr", xl: "1.6fr 1fr" }} gap="5">
        <Box
          bg="white"
          border="1px solid"
          borderColor="gray.200"
          rounded="2xl"
          p="5"
        >
          <Flex
            justify="space-between"
            align={{ base: "start", md: "center" }}
            direction={{ base: "column", md: "row" }}
            gap="4"
            mb="5"
          >
            <Box>
              <Heading size="md">Solicitudes pendientes</Heading>
              <Text fontSize="sm" color="gray.500">
                Expedientes que requieren decisión del aprobador.
              </Text>
            </Box>

            <HStack>
              <Input placeholder="Buscar solicitud..." maxW="220px" />

              <NativeSelect.Root maxW="190px">
                <NativeSelect.Field defaultValue="todos">
                  <option value="todos">Todos los estados</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="urgente">Urgente</option>
                  <option value="vencido">SLA vencido</option>
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            </HStack>
          </Flex>

          <VStack align="stretch" gap="3">
            {authorizationRows.map((item) => (
              <AuthorizationRow key={item.code} {...item} />
            ))}
          </VStack>
        </Box>

        <VStack align="stretch" gap="5">
          <Box
            bg="white"
            border="1px solid"
            borderColor="gray.200"
            rounded="2xl"
            p="5"
          >
            <Heading size="md" mb="1">
              Resumen del flujo
            </Heading>
            <Text fontSize="sm" color="gray.500" mb="5">
              Etapas principales del proceso de autorización.
            </Text>

            <VStack align="stretch" gap="3">
              <FlowItem
                title="Solicitud registrada"
                description="El usuario crea la solicitud."
                status="Completado"
                color="green"
                icon={FileText}
              />

              <FlowItem
                title="Validación automática"
                description="Política y presupuesto revisados."
                status="Completado"
                color="green"
                icon={ShieldCheck}
              />

              <FlowItem
                title="Revisión del aprobador"
                description="Decisión pendiente."
                status="En proceso"
                color="yellow"
                icon={UserCheck}
              />

              <FlowItem
                title="Ejecución del gasto"
                description="Se habilita después de aprobar."
                status="Siguiente"
                color="blue"
                icon={Send}
              />
            </VStack>
          </Box>

          <Box
            bg="white"
            border="1px solid"
            borderColor="gray.200"
            rounded="2xl"
            p="5"
          >
            <Heading size="md" mb="1">
              Eventos recientes
            </Heading>
            <Text fontSize="sm" color="gray.500" mb="5">
              Últimos movimientos registrados en la bitácora.
            </Text>

            <VStack align="stretch" gap="3">
              {recentEvents.map((event) => (
                <RecentEvent key={event.title} {...event} />
              ))}
            </VStack>
          </Box>
        </VStack>
      </Grid>
    </VStack>
  );
}

function StatCard({
  label,
  value,
  description,
  color,
  icon: Icon,
}: {
  label: string;
  value: string;
  description: string;
  color: string;
  icon: React.ElementType;
}) {
  return (
    <Box
      bg="white"
      border="1px solid"
      borderColor="gray.200"
      rounded="2xl"
      p="5"
    >
      <Flex justify="space-between" align="start">
        <Box>
          <Text fontSize="sm" color="gray.500">
            {label}
          </Text>
          <Heading size="xl" mt="2">
            {value}
          </Heading>
          <Text fontSize="sm" color="gray.500" mt="2">
            {description}
          </Text>
        </Box>

        <Box
          w="42px"
          h="42px"
          rounded="xl"
          bg={`${color}.50`}
          color={`${color}.600`}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Icon size={21} />
        </Box>
      </Flex>
    </Box>
  );
}

function AuthorizationRow({
  code,
  requester,
  type,
  concept,
  amount,
  priority,
  status,
  sla,
  color,
}: {
  code: string;
  requester: string;
  type: string;
  concept: string;
  amount: string;
  priority: string;
  status: string;
  sla: string;
  color: string;
}) {
  return (
    <Box border="1px solid" borderColor="gray.100" rounded="xl" p="4">
      <Flex
        justify="space-between"
        align={{ base: "start", md: "center" }}
        direction={{ base: "column", md: "row" }}
        gap="4"
      >
        <HStack align="start" gap="3">
          <Box
            w="42px"
            h="42px"
            rounded="xl"
            bg={`${color}.50`}
            color={`${color}.600`}
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <UserCheck size={19} />
          </Box>

          <Box>
            <HStack mb="1">
              <Text fontWeight="bold">{code}</Text>
              <Badge colorPalette={color}>{priority}</Badge>
            </HStack>

            <Text fontWeight="semibold">{concept}</Text>

            <Text fontSize="sm" color="gray.500">
              {type} · Solicitante: {requester}
            </Text>

            <HStack mt="2">
              <Badge colorPalette={color}>{status}</Badge>
              <Text fontSize="xs" color="gray.500">
                SLA: {sla}
              </Text>
            </HStack>
          </Box>
        </HStack>

        <VStack align={{ base: "stretch", md: "end" }} gap="3">
          <Text fontWeight="bold">{amount}</Text>

          <HStack>
            <RouterLink to={`/solicitudes-gastos/${code}`}>
              <Button size="sm" variant="outline">
                <Eye size={16} />
                Ver
              </Button>
            </RouterLink>

            <Button size="sm" colorPalette="green">
              <CheckCircle2 size={16} />
              Aprobar
            </Button>

            <Button size="sm" variant="outline" colorPalette="red">
              <XCircle size={16} />
              Rechazar
            </Button>
          </HStack>
        </VStack>
      </Flex>
    </Box>
  );
}

function FlowItem({
  title,
  description,
  status,
  color,
  icon: Icon,
}: {
  title: string;
  description: string;
  status: string;
  color: string;
  icon: React.ElementType;
}) {
  return (
    <Flex justify="space-between" align="start" gap="3">
      <HStack align="start" gap="3">
        <Box
          w="38px"
          h="38px"
          rounded="xl"
          bg={`${color}.50`}
          color={`${color}.600`}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Icon size={18} />
        </Box>

        <Box>
          <Text fontWeight="semibold">{title}</Text>
          <Text fontSize="sm" color="gray.500">
            {description}
          </Text>
        </Box>
      </HStack>

      <Badge colorPalette={color}>{status}</Badge>
    </Flex>
  );
}

function RecentEvent({
  title,
  description,
  time,
  color,
}: {
  title: string;
  description: string;
  time: string;
  color: string;
}) {
  return (
    <Box border="1px solid" borderColor="gray.100" rounded="xl" p="4">
      <Flex justify="space-between" align="start" gap="3">
        <Box>
          <Text fontWeight="semibold">{title}</Text>
          <Text fontSize="sm" color="gray.500">
            {description}
          </Text>
        </Box>

        <Badge colorPalette={color}>{time}</Badge>
      </Flex>
    </Box>
  );
}