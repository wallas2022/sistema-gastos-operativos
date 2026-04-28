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
  FileCheck,
  FileText,
  Filter,
  GitBranch,
  ReceiptText,
  Search,
  Send,
  ShieldCheck,
  UserCheck,
  WalletCards,
} from "lucide-react";

const flowStats = [
  {
    label: "En autorización",
    value: "12",
    description: "Solicitudes pendientes de aprobación",
    color: "yellow",
    icon: UserCheck,
  },
  {
    label: "En ejecución",
    value: "8",
    description: "Gastos aprobados pendientes de comprobantes",
    color: "blue",
    icon: Send,
  },
  {
    label: "En liquidación",
    value: "6",
    description: "Expedientes conciliando documentos OCR",
    color: "purple",
    icon: ReceiptText,
  },
  {
    label: "Con alerta SLA",
    value: "2",
    description: "Trámites con retraso o vencimiento próximo",
    color: "red",
    icon: AlertTriangle,
  },
];

const trackedRequests = [
  {
    code: "SOL-0001",
    requester: "Walter Rosales",
    type: "Gasto de viaje / viáticos",
    amount: "Q 2,950.00",
    currentStage: "Autorización",
    status: "En proceso",
    color: "yellow",
    progress: 3,
  },
  {
    code: "SOL-0002",
    requester: "María López",
    type: "Pago a proveedor",
    amount: "Q 8,740.00",
    currentStage: "Carga OCR",
    status: "Documentos pendientes",
    color: "blue",
    progress: 5,
  },
  {
    code: "SOL-0003",
    requester: "Carlos Méndez",
    type: "Compra de insumos",
    amount: "Q 1,980.00",
    currentStage: "Liquidación",
    status: "Conciliando",
    color: "purple",
    progress: 6,
  },
];

const processStages = [
  {
    title: "Solicitud",
    description: "Registro inicial del gasto.",
    icon: FileText,
  },
  {
    title: "Política",
    description: "Validación normativa.",
    icon: ShieldCheck,
  },
  {
    title: "Presupuesto",
    description: "Validación de fondos.",
    icon: WalletCards,
  },
  {
    title: "Autorización",
    description: "Aprobación del responsable.",
    icon: UserCheck,
  },
  {
    title: "Ejecución",
    description: "Gasto aprobado para realizarse.",
    icon: Send,
  },
  {
    title: "OCR",
    description: "Carga y validación de comprobantes.",
    icon: FileCheck,
  },
  {
    title: "Liquidación",
    description: "Conciliación financiera.",
    icon: ReceiptText,
  },
  {
    title: "Cierre",
    description: "Expediente certificado.",
    icon: CheckCircle2,
  },
];

const recentTimeline = [
  {
    title: "SOL-0001 enviada a autorización",
    description: "La solicitud fue asignada al aprobador correspondiente.",
    time: "Hace 10 min",
    color: "yellow",
  },
  {
    title: "SOL-0002 pendiente de comprobantes",
    description: "El usuario debe cargar facturas para OCR.",
    time: "Hace 25 min",
    color: "blue",
  },
  {
    title: "SOL-0003 inició liquidación",
    description: "Documentos OCR confirmados y listos para conciliación.",
    time: "Hace 50 min",
    color: "purple",
  },
];

export function FlowMonitorPage() {
  return (
    <VStack align="stretch" gap="6">
      <Flex
        justify="space-between"
        align={{ base: "start", md: "center" }}
        direction={{ base: "column", md: "row" }}
        gap="4"
      >
        <Box>
          <Heading size="lg">Monitor de Estados</Heading>
          <Text color="gray.500" mt="1">
            Seguimiento visual del ciclo completo de las solicitudes de gasto,
            desde su creación hasta el cierre certificado.
          </Text>
        </Box>

        <HStack>
          <Button variant="outline">
            <Filter size={18} />
            Filtros
          </Button>

          <Button colorPalette="blue">
            <GitBranch size={18} />
            Ver trazabilidad
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
        {flowStats.map((item) => (
          <StatCard key={item.label} {...item} />
        ))}
      </Grid>

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
            <Heading size="md">Mapa general del proceso</Heading>
            <Text fontSize="sm" color="gray.500">
              Flujo estándar que debe seguir una solicitud de gasto.
            </Text>
          </Box>

          <Badge colorPalette="blue">MOTF</Badge>
        </Flex>

        <Grid
          templateColumns={{
            base: "1fr",
            md: "repeat(4, 1fr)",
            xl: "repeat(8, 1fr)",
          }}
          gap="3"
        >
          {processStages.map((stage, index) => (
            <ProcessStage
              key={stage.title}
              index={index + 1}
              title={stage.title}
              description={stage.description}
              icon={stage.icon}
            />
          ))}
        </Grid>
      </Box>

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
              <Heading size="md">Solicitudes en seguimiento</Heading>
              <Text fontSize="sm" color="gray.500">
                Expedientes activos y etapa actual dentro del flujo.
              </Text>
            </Box>

            <HStack>
              <Input placeholder="Buscar solicitud..." maxW="220px" />

              <NativeSelect.Root maxW="190px">
                <NativeSelect.Field defaultValue="todos">
                  <option value="todos">Todos</option>
                  <option value="autorizacion">Autorización</option>
                  <option value="ejecucion">Ejecución</option>
                  <option value="ocr">OCR</option>
                  <option value="liquidacion">Liquidación</option>
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            </HStack>
          </Flex>

          <VStack align="stretch" gap="3">
            {trackedRequests.map((item) => (
              <TrackedRequestRow key={item.code} {...item} />
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
              Actividad reciente
            </Heading>
            <Text fontSize="sm" color="gray.500" mb="5">
              Últimos movimientos registrados en la bitácora del flujo.
            </Text>

            <VStack align="stretch" gap="3">
              {recentTimeline.map((item) => (
                <RecentActivity key={item.title} {...item} />
              ))}
            </VStack>
          </Box>

          <Box bg="blue.600" color="white" rounded="2xl" p="5">
            <HStack align="start" gap="3">
              <Clock size={24} />
              <Box>
                <Heading size="sm">Control de tiempos SLA</Heading>
                <Text fontSize="sm" mt="2" color="blue.50">
                  Esta pantalla permitirá detectar solicitudes detenidas,
                  escalarlas automáticamente y evitar retrasos en autorizaciones
                  y liquidaciones.
                </Text>
              </Box>
            </HStack>
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

function ProcessStage({
  index,
  title,
  description,
  icon: Icon,
}: {
  index: number;
  title: string;
  description: string;
  icon: React.ElementType;
}) {
  return (
    <Box
      border="1px solid"
      borderColor="gray.100"
      rounded="2xl"
      p="4"
      bg="gray.50"
      position="relative"
    >
      <Flex justify="space-between" align="start" mb="3">
        <Box
          w="38px"
          h="38px"
          rounded="xl"
          bg="white"
          color="blue.600"
          display="flex"
          alignItems="center"
          justifyContent="center"
          border="1px solid"
          borderColor="gray.100"
        >
          <Icon size={18} />
        </Box>

        <Badge colorPalette="blue">#{index}</Badge>
      </Flex>

      <Text fontWeight="semibold">{title}</Text>
      <Text fontSize="xs" color="gray.500" mt="1">
        {description}
      </Text>
    </Box>
  );
}

function TrackedRequestRow({
  code,
  requester,
  type,
  amount,
  currentStage,
  status,
  color,
  progress,
}: {
  code: string;
  requester: string;
  type: string;
  amount: string;
  currentStage: string;
  status: string;
  color: string;
  progress: number;
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
            <GitBranch size={19} />
          </Box>

          <Box>
            <HStack mb="1">
              <Text fontWeight="bold">{code}</Text>
              <Badge colorPalette={color}>{currentStage}</Badge>
            </HStack>

            <Text fontWeight="semibold">{type}</Text>

            <Text fontSize="sm" color="gray.500">
              Solicitante: {requester}
            </Text>

            <Flex align="center" gap="2" mt="3">
              {Array.from({ length: 8 }).map((_, index) => (
                <Box
                  key={index}
                  h="8px"
                  flex="1"
                  rounded="full"
                  bg={index < progress ? `${color}.400` : "gray.200"}
                />
              ))}
            </Flex>

            <Text fontSize="xs" color="gray.500" mt="2">
              Estado actual: {status}
            </Text>
          </Box>
        </HStack>

        <VStack align={{ base: "stretch", md: "end" }} gap="3">
          <Text fontWeight="bold">{amount}</Text>

          <RouterLink to={`/solicitudes-gastos/${code}`}>
            <Button size="sm" variant="outline">
              <Eye size={16} />
              Ver detalle
            </Button>
          </RouterLink>
        </VStack>
      </Flex>
    </Box>
  );
}

function RecentActivity({
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