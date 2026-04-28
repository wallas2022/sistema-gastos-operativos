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
  ClipboardList,
  FileText,
  Landmark,
  Plus,
  ShieldCheck,
  WalletCards,
} from "lucide-react";

const stats = [
  {
    label: "Solicitudes creadas",
    value: "24",
    description: "Solicitudes registradas este mes",
    color: "blue",
    icon: ClipboardList,
  },
  {
    label: "Solicitudes simuladas",
    value: "17",
    description: "Cálculos previos realizados",
    color: "purple",
    icon: WalletCards,
  },
  {
    label: "Validaciones correctas",
    value: "21",
    description: "Cumplen política y presupuesto",
    color: "green",
    icon: ShieldCheck,
  },
  {
    label: "Políticas activas",
    value: "8",
    description: "Reglas vigentes por empresa y rol",
    color: "orange",
    icon: FileText,
  },
];

const expenseTypes = [
  {
    title: "Gastos de viaje",
    description:
      "Alojamiento, alimentación, transporte local, combustible y alquiler de vehículo.",
    tag: "Viáticos / movilidad",
  },
  {
    title: "Pago a proveedores",
    description:
      "Servicios externos, mantenimiento, compras operativas y pagos administrativos.",
    tag: "Proveedor",
  },
  {
    title: "Gastos administrativos",
    description:
      "Papelería, insumos internos, servicios menores y gastos recurrentes.",
    tag: "Operativo",
  },
  {
    title: "Gastos extraordinarios",
    description:
      "Solicitudes especiales sujetas a revisión adicional y autorización superior.",
    tag: "Especial",
  },
];

const policies = [
  {
    rule: "Límite por alimentación",
    scope: "Según rol, destino y cantidad de días",
    status: "Activa",
  },
  {
    rule: "Hospedaje nacional",
    scope: "Aplica para viajes fuera del departamento asignado",
    status: "Activa",
  },
  {
    rule: "Transporte local",
    scope: "Disponible para operadores, jefaturas y gerencias",
    status: "Activa",
  },
  {
    rule: "Gasto extraordinario",
    scope: "Requiere justificación y aprobación adicional",
    status: "Revisión",
  },
];

export function PlanningPage() {
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
            <Badge colorPalette="blue" variant="subtle">
              MPN
            </Badge>
            <Badge colorPalette="green" variant="subtle">
              Inicio del proceso
            </Badge>
          </HStack>

          <Heading size="lg">Planificación y Normativa</Heading>

          <Text color="gray.500" mt="1">
            Registro inteligente de solicitudes de gasto, consulta de políticas,
            simulación de montos y validación presupuestaria previa.
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
        {stats.map((item) => (
          <StatCard key={item.label} {...item} />
        ))}
      </Grid>

      <Grid templateColumns={{ base: "1fr", xl: "1.2fr 1fr" }} gap="5">
        <Box
          bg="white"
          border="1px solid"
          borderColor="gray.200"
          rounded="2xl"
          p="5"
        >
          <Flex justify="space-between" align="center" mb="5">
            <Box>
              <Heading size="md">Tipos de gasto disponibles</Heading>
              <Text fontSize="sm" color="gray.500">
                El usuario selecciona el tipo de gasto para aplicar reglas,
                campos y validaciones correspondientes.
              </Text>
            </Box>

            <Landmark size={24} color="#2563eb" />
          </Flex>

          <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap="4">
            {expenseTypes.map((item) => (
              <ExpenseTypeCard key={item.title} {...item} />
            ))}
          </Grid>
        </Box>

        <Box
          bg="white"
          border="1px solid"
          borderColor="gray.200"
          rounded="2xl"
          p="5"
        >
          <Heading size="md">Validación inicial</Heading>

          <Text fontSize="sm" color="gray.500" mt="1" mb="5">
            Revisión previa antes de enviar la solicitud a autorización.
          </Text>

          <VStack align="stretch" gap="3">
            <ValidationItem
              title="Reglas por rol"
              description="Aplica montos permitidos según operador, jefe, gerente o directivo."
              status="Activo"
            />
            <ValidationItem
              title="Presupuesto disponible"
              description="Valida si el centro de costo tiene saldo antes de enviar."
              status="Activo"
            />
            <ValidationItem
              title="Política por tipo de gasto"
              description="Determina campos obligatorios y documentos requeridos."
              status="Activo"
            />
            <ValidationItem
              title="Jerarquía de autorización"
              description="Define el flujo de aprobación según monto y empresa."
              status="Activo"
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
        <Flex justify="space-between" align="center" mb="4">
          <Box>
            <Heading size="md">Políticas y reglas vigentes</Heading>
            <Text fontSize="sm" color="gray.500">
              Reglas preliminares que condicionan el registro y validación de
              gastos.
            </Text>
          </Box>

          <Badge colorPalette="blue">Normativa activa</Badge>
        </Flex>

        <VStack align="stretch" gap="3">
          {policies.map((item) => (
            <PolicyRow key={item.rule} {...item} />
          ))}
        </VStack>
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

function ExpenseTypeCard({
  title,
  description,
  tag,
}: {
  title: string;
  description: string;
  tag: string;
}) {
  return (
    <Box
      border="1px solid"
      borderColor="gray.100"
      rounded="2xl"
      p="4"
      h="100%"
      _hover={{
        bg: "blue.50",
        borderColor: "blue.200",
      }}
      transition="all 0.2s ease"
    >
      <Badge colorPalette="blue" variant="subtle" mb="3">
        {tag}
      </Badge>

      <Text fontWeight="semibold">{title}</Text>

      <Text fontSize="sm" color="gray.500" mt="2" lineHeight="1.6">
        {description}
      </Text>
    </Box>
  );
}

function ValidationItem({
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

      <Badge colorPalette="green">{status}</Badge>
    </Flex>
  );
}

function PolicyRow({
  rule,
  scope,
  status,
}: {
  rule: string;
  scope: string;
  status: string;
}) {
  return (
    <Flex
      justify="space-between"
      align={{ base: "start", md: "center" }}
      direction={{ base: "column", md: "row" }}
      gap="3"
      border="1px solid"
      borderColor="gray.100"
      rounded="xl"
      p="4"
    >
      <Box>
        <Text fontWeight="semibold">{rule}</Text>
        <Text fontSize="sm" color="gray.500" mt="1">
          {scope}
        </Text>
      </Box>

      <Badge colorPalette={status === "Activa" ? "green" : "yellow"}>
        {status}
      </Badge>
    </Flex>
  );
}