import {
  Badge,
  Box,
  Button,
  Flex,
  Grid,
  Heading,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import {
  ArrowRight,
  ClipboardList,
  FileText,
  Plus,
  ShieldCheck,
  WalletCards,
  Clock3,
  CheckCircle2,
  AlertTriangle,
  SearchCheck,
} from "lucide-react";

const requestStats = [
  {
    label: "Solicitudes abiertas",
    value: "12",
    description: "Gastos en proceso",
    color: "blue",
    icon: ClipboardList,
  },
  {
    label: "Pendientes de aprobación",
    value: "5",
    description: "Esperando autorización",
    color: "yellow",
    icon: Clock3,
  },
  {
    label: "Aprobadas",
    value: "18",
    description: "Listas para ejecutar",
    color: "green",
    icon: CheckCircle2,
  },
  {
    label: "Observadas",
    value: "2",
    description: "Requieren corrección",
    color: "red",
    icon: AlertTriangle,
  },
];

const expenseRequests = [
  {
    code: "SOL-0001",
    requester: "Walter Rosales",
    concept: "Compra de suministros administrativos",
    type: "Gasto operativo",
    area: "Administración",
    amount: "Q 3,500.00",
    status: "Pendiente aprobación",
  },
  {
    code: "SOL-0002",
    requester: "María López",
    concept: "Pago a proveedor de mantenimiento",
    type: "Proveedor",
    area: "Operaciones",
    amount: "Q 8,900.00",
    status: "Aprobada",
  },
  {
    code: "SOL-0003",
    requester: "Carlos Méndez",
    concept: "Gastos de traslado y alimentación",
    type: "Gasto de viaje",
    area: "Ventas",
    amount: "Q 1,750.00",
    status: "Observada",
  },
];

export function ExpenseRequestsPage() {
  return (
    <VStack align="stretch" gap="6">
      <Flex
        justify="space-between"
        align={{ base: "start", md: "center" }}
        direction={{ base: "column", md: "row" }}
        gap="4"
      >
        <Box>
          <Heading size="lg">Solicitudes y Planificación de Gastos</Heading>
          <Text color="gray.500" mt="1">
            Registro, validación y seguimiento inicial de solicitudes de gastos
            antes de su autorización y ejecución.
          </Text>
        </Box>

        <RouterLink to="/solicitudes-gastos/nueva">
          <Button colorPalette="blue">
            <Plus size={18} />
            Nueva solicitud
          </Button>
        </RouterLink>
      </Flex>

      <Grid
        templateColumns={{
          base: "1fr",
          md: "repeat(2, 1fr)",
          xl: "repeat(4, 1fr)",
        }}
        gap="4"
      >
        {requestStats.map((item) => (
          <StatCard key={item.label} {...item} />
        ))}
      </Grid>

      <Grid templateColumns={{ base: "1fr", xl: "1.5fr 1fr" }} gap="5">
        <Box
          bg="white"
          border="1px solid"
          borderColor="gray.200"
          rounded="2xl"
          p="5"
        >
          <Flex justify="space-between" align="center" mb="5">
            <Box>
              <Heading size="md">Solicitudes recientes</Heading>
              <Text fontSize="sm" color="gray.500">
                Bandeja principal de gastos solicitados por los usuarios.
              </Text>
            </Box>

            <Badge colorPalette="blue">MSPG</Badge>
          </Flex>

          <VStack align="stretch" gap="3">
            {expenseRequests.map((item) => (
              <ExpenseRequestRow key={item.code} {...item} />
            ))}
          </VStack>
        </Box>

        <Box
          bg="white"
          border="1px solid"
          borderColor="gray.200"
          rounded="2xl"
          p="5"
        >
          <Heading size="md">Validaciones del módulo</Heading>
          <Text fontSize="sm" color="gray.500" mt="1" mb="5">
            Antes de enviar una solicitud a autorización, el sistema debe validar
            reglas, políticas y disponibilidad presupuestaria.
          </Text>

          <VStack align="stretch" gap="3">
            <ValidationCard
              icon={ShieldCheck}
              title="Consulta de políticas"
              description="Valida límites permitidos por empresa, área, tipo de gasto o jerarquía."
              status="Regla activa"
              color="green"
            />

            <ValidationCard
              icon={WalletCards}
              title="Verificador de presupuesto"
              description="Consulta disponibilidad contra centro de costo y presupuesto operativo."
              status="Disponible"
              color="blue"
            />

            <ValidationCard
              icon={SearchCheck}
              title="Simulador de gasto"
              description="Permite calcular el costo estimado antes de enviar la solicitud."
              status="Prevalidación"
              color="purple"
            />
          </VStack>
        </Box>
      </Grid>

      <Box
        bg="white"
        border="1px solid"
        borderColor="gray.200"
        rounded="2xl"
        p="5"
      >
        <Heading size="md" mb="2">
          Flujo de una solicitud de gasto
        </Heading>

        <Text fontSize="sm" color="gray.500" mb="5">
          Este flujo representa el nacimiento del gasto antes de llegar a OCR,
          liquidación y conciliación.
        </Text>

        <Grid
          templateColumns={{
            base: "1fr",
            md: "repeat(5, 1fr)",
          }}
          gap="4"
        >
          <ProcessStep
            title="Crear solicitud"
            description="El usuario registra el gasto requerido."
            icon={FileText}
            showArrow
          />

          <ProcessStep
            title="Validar política"
            description="Se revisan reglas internas aplicables."
            icon={ShieldCheck}
            showArrow
          />

          <ProcessStep
            title="Validar presupuesto"
            description="Se consulta disponibilidad del centro de costo."
            icon={WalletCards}
            showArrow
          />

          <ProcessStep
            title="Autorizar"
            description="El aprobador acepta o rechaza la solicitud."
            icon={CheckCircle2}
            showArrow
          />

          <ProcessStep
            title="Ejecutar gasto"
            description="El gasto aprobado queda listo para comprobantes."
            icon={ClipboardList}
            showArrow={false}
          />
        </Grid>
      </Box>
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

function ExpenseRequestRow({
  code,
  requester,
  concept,
  type,
  area,
  amount,
  status,
}: {
  code: string;
  requester: string;
  concept: string;
  type: string;
  area: string;
  amount: string;
  status: string;
}) {
  return (
    <RouterLink
      to={`/solicitudes-gastos/${code}`}
      style={{ textDecoration: "none" }}
    >
      <Flex
        justify="space-between"
        align={{ base: "start", md: "center" }}
        direction={{ base: "column", md: "row" }}
        gap="3"
        border="1px solid"
        borderColor="gray.100"
        rounded="xl"
        p="4"
        cursor="pointer"
        transition="all 0.2s ease"
        _hover={{
          bg: "gray.50",
          borderColor: "blue.200",
          transform: "translateY(-1px)",
        }}
      >
        <HStack align="start" gap="3">
          <Box
            w="42px"
            h="42px"
            rounded="xl"
            bg="blue.50"
            color="blue.600"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <ClipboardList size={19} />
          </Box>

          <Box>
            <HStack gap="2" mb="1">
              <Text fontWeight="semibold">{code}</Text>
              <Badge colorPalette={getStatusColor(status)}>{status}</Badge>
            </HStack>

            <Text fontSize="sm" color="gray.600">
              {concept}
            </Text>

            <Text fontSize="xs" color="gray.500" mt="1">
              Solicitante: {requester} · {type} · {area}
            </Text>
          </Box>
        </HStack>

        <HStack>
          <Text fontWeight="bold">{amount}</Text>
          <ArrowRight size={18} color="#718096" />
        </HStack>
      </Flex>
    </RouterLink>
  );
}

function ValidationCard({
  icon: Icon,
  title,
  description,
  status,
  color,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  status: string;
  color: string;
}) {
  return (
    <Box border="1px solid" borderColor="gray.100" rounded="xl" p="4">
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
    </Box>
  );
}

function ProcessStep({
  title,
  description,
  icon: Icon,
  showArrow,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  showArrow: boolean;
}) {
  return (
    <Box position="relative">
      <Box
        border="1px solid"
        borderColor="gray.200"
        rounded="2xl"
        p="4"
        h="100%"
      >
        <Box
          w="44px"
          h="44px"
          rounded="xl"
          bg="blue.50"
          color="blue.600"
          display="flex"
          alignItems="center"
          justifyContent="center"
          mb="4"
        >
          <Icon size={22} />
        </Box>

        <Text fontWeight="semibold">{title}</Text>
        <Text fontSize="sm" color="gray.500" mt="2">
          {description}
        </Text>
      </Box>

      {showArrow && (
        <Box
          display={{ base: "none", md: "block" }}
          position="absolute"
          right="-22px"
          top="50%"
          transform="translateY(-50%)"
          color="gray.400"
          zIndex="1"
        >
          <ArrowRight size={22} />
        </Box>
      )}
    </Box>
  );
}

function getStatusColor(status: string) {
  if (status === "Aprobada") return "green";
  if (status === "Observada") return "red";
  if (status === "Pendiente aprobación") return "yellow";
  return "blue";
}