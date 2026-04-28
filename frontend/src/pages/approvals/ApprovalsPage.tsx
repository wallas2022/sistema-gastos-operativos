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
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Eye,
  FileText,
  GitBranch,
  ShieldCheck,
  ThumbsDown,
  ThumbsUp,
  UserCheck,
  WalletCards,
} from "lucide-react";

const approvalStats = [
  {
    label: "Pendientes de aprobación",
    value: "12",
    description: "Solicitudes esperando revisión",
    color: "blue",
    icon: Clock3,
  },
  {
    label: "Urgentes",
    value: "3",
    description: "Superan tiempo esperado",
    color: "red",
    icon: AlertTriangle,
  },
  {
    label: "Aprobadas hoy",
    value: "7",
    description: "Solicitudes autorizadas",
    color: "green",
    icon: CheckCircle2,
  },
  {
    label: "Monto en revisión",
    value: "Q 48,750.00",
    description: "Total pendiente por autorizar",
    color: "purple",
    icon: WalletCards,
  },
];

const approvalRows = [
  {
    code: "SOL-0001",
    requester: "Walter Rosales",
    type: "Gasto de viaje",
    concept: "Visita técnica a sucursal regional",
    costCenter: "Infraestructura",
    amount: "Q 3,850.00",
    status: "Pendiente",
    priority: "Normal",
    currentStep: "Jefe inmediato",
  },
  {
    code: "SOL-0002",
    requester: "María López",
    type: "Pago a proveedor",
    concept: "Servicio de mantenimiento preventivo",
    costCenter: "Operaciones",
    amount: "Q 12,400.00",
    status: "Urgente",
    priority: "Alta",
    currentStep: "Gerencia financiera",
  },
  {
    code: "SOL-0003",
    requester: "Carlos Méndez",
    type: "Gasto administrativo",
    concept: "Compra de insumos operativos",
    costCenter: "Administración",
    amount: "Q 1,980.00",
    status: "Pendiente",
    priority: "Normal",
    currentStep: "Coordinación administrativa",
  },
  {
    code: "SOL-0004",
    requester: "Ana Gómez",
    type: "Gasto extraordinario",
    concept: "Atención correctiva no programada",
    costCenter: "Soporte técnico",
    amount: "Q 8,700.00",
    status: "Revisión especial",
    priority: "Alta",
    currentStep: "Dirección",
  },
];

export function ApprovalsPage() {
  return (
    <VStack align="stretch" gap="6">
      <Flex
        justify="space-between"
        align={{ base: "start", md: "center" }}
        direction={{ base: "column", md: "row" }}
        gap="4"
      >
        <Box>
          <HStack mb="2">
            <Badge colorPalette="purple" variant="subtle">
              MOTF
            </Badge>
            <Badge colorPalette="blue" variant="subtle">
              Centro de autorizaciones
            </Badge>
          </HStack>

          <Heading size="lg">Centro de Autorizaciones</Heading>

          <Text color="gray.500" mt="1">
            Bandeja unificada para revisar, aprobar, rechazar y dar seguimiento
            a solicitudes de gasto dentro del flujo de autorización.
          </Text>
        </Box>

        <Button colorPalette="blue">
          <GitBranch size={18} />
          Ver monitor de estados
        </Button>
      </Flex>

      <Grid
        templateColumns={{
          base: "1fr",
          md: "repeat(2, 1fr)",
          xl: "repeat(4, 1fr)",
        }}
        gap="4"
      >
        {approvalStats.map((item) => (
          <StatCard key={item.label} {...item} />
        ))}
      </Grid>

      <Grid templateColumns={{ base: "1fr", xl: "1.5fr 0.8fr" }} gap="5">
        <Box
          bg="white"
          border="1px solid"
          borderColor="gray.200"
          rounded="2xl"
          p="5"
        >
          <Flex justify="space-between" align="center" mb="5">
            <Box>
              <Heading size="md">Solicitudes pendientes</Heading>
              <Text fontSize="sm" color="gray.500">
                Solicitudes que requieren decisión del aprobador actual.
              </Text>
            </Box>

            <Badge colorPalette="purple">Flujo activo</Badge>
          </Flex>

          <VStack align="stretch" gap="3">
            {approvalRows.map((item) => (
              <ApprovalRow key={item.code} {...item} />
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
            <HStack mb="4">
              <Box color="purple.600">
                <ShieldCheck size={22} />
              </Box>

              <Heading size="md">Criterios de revisión</Heading>
            </HStack>

            <VStack align="stretch" gap="3">
              <ReviewRule
                title="Política aplicada"
                description="Valida límites según tipo de gasto, rol y empresa."
                status="Correcto"
              />
              <ReviewRule
                title="Presupuesto disponible"
                description="Confirma saldo en centro de costo."
                status="Correcto"
              />
              <ReviewRule
                title="Monto solicitado"
                description="Determina si requiere aprobación superior."
                status="Validado"
              />
              <ReviewRule
                title="Justificación"
                description="Debe estar documentada antes de aprobar."
                status="Revisar"
              />
            </VStack>
          </Box>

          <Box
            bg="purple.600"
            color="white"
            rounded="2xl"
            p="5"
            position="relative"
            overflow="hidden"
          >
            <Box
              position="absolute"
              right="-30px"
              top="-30px"
              w="120px"
              h="120px"
              rounded="full"
              bg="whiteAlpha.200"
            />

            <HStack mb="3">
              <UserCheck size={24} />
              <Heading size="md">Aprobación controlada</Heading>
            </HStack>

            <Text fontSize="sm" color="whiteAlpha.900" lineHeight="1.7">
              Esta pantalla sustituye el uso de correos informales, centraliza
              las decisiones y registra cada aprobación o rechazo en la bitácora
              del sistema.
            </Text>
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

          <Heading size="lg" mt="2">
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

function ApprovalRow({
  code,
  requester,
  type,
  concept,
  costCenter,
  amount,
  status,
  priority,
  currentStep,
}: {
  code: string;
  requester: string;
  type: string;
  concept: string;
  costCenter: string;
  amount: string;
  status: string;
  priority: string;
  currentStep: string;
}) {
  return (
    <Box
      border="1px solid"
      borderColor="gray.100"
      rounded="2xl"
      p="4"
      _hover={{
        bg: "gray.50",
        borderColor: "purple.200",
      }}
      transition="all 0.2s ease"
    >
      <Flex
        justify="space-between"
        align={{ base: "start", md: "center" }}
        direction={{ base: "column", md: "row" }}
        gap="4"
      >
        <HStack align="start" gap="3">
          <Box
            w="44px"
            h="44px"
            rounded="xl"
            bg="purple.50"
            color="purple.600"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <FileText size={21} />
          </Box>

          <Box>
            <HStack mb="1" flexWrap="wrap">
              <Text fontWeight="semibold">{code}</Text>

              <Badge colorPalette="blue" variant="subtle">
                {type}
              </Badge>

              <Badge
                colorPalette={
                  priority === "Alta" || status === "Urgente"
                    ? "red"
                    : status === "Revisión especial"
                    ? "yellow"
                    : "gray"
                }
              >
                {status}
              </Badge>
            </HStack>

            <Text fontSize="sm" color="gray.700" fontWeight="medium">
              {concept}
            </Text>

            <Text fontSize="xs" color="gray.500" mt="1">
              Solicitante: {requester} · Centro de costo: {costCenter}
            </Text>

            <Text fontSize="xs" color="gray.500" mt="1">
              Etapa actual: {currentStep}
            </Text>
          </Box>
        </HStack>

        <VStack align={{ base: "stretch", md: "end" }} gap="3">
          <Text fontWeight="bold">{amount}</Text>

          <HStack>
            <Button size="sm" variant="outline">
              <Eye size={16} />
              Ver
            </Button>

            <Button size="sm" colorPalette="green">
              <ThumbsUp size={16} />
              Aprobar
            </Button>

            <Button size="sm" colorPalette="red" variant="outline">
              <ThumbsDown size={16} />
              Rechazar
            </Button>
          </HStack>
        </VStack>
      </Flex>
    </Box>
  );
}

function ReviewRule({
  title,
  description,
  status,
}: {
  title: string;
  description: string;
  status: string;
}) {
  return (
    <Flex
      justify="space-between"
      align="start"
      gap="3"
      border="1px solid"
      borderColor="gray.100"
      rounded="xl"
      p="4"
    >
      <Box>
        <Text fontWeight="semibold">{title}</Text>
        <Text fontSize="sm" color="gray.500" mt="1">
          {description}
        </Text>
      </Box>

      <Badge
        colorPalette={
          status === "Revisar"
            ? "yellow"
            : status === "Correcto"
            ? "green"
            : "blue"
        }
      >
        {status}
      </Badge>
    </Flex>
  );
}