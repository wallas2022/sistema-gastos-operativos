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
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Download,
  Eye,
  FileCheck,
  Filter,
  LockKeyhole,
  Search,
  ShieldCheck,
  UserCheck,
  XCircle,
} from "lucide-react";

const auditStats = [
  {
    label: "Eventos registrados",
    value: "1,284",
    description: "Movimientos históricos del sistema",
    color: "blue",
    icon: Activity,
  },
  {
    label: "Aprobaciones",
    value: "348",
    description: "Solicitudes autorizadas",
    color: "green",
    icon: CheckCircle2,
  },
  {
    label: "Observaciones",
    value: "76",
    description: "Expedientes devueltos",
    color: "orange",
    icon: AlertTriangle,
  },
  {
    label: "Eventos críticos",
    value: "12",
    description: "Cambios sensibles o rechazos",
    color: "red",
    icon: LockKeyhole,
  },
];

const auditEvents = [
  {
    id: "EVT-0001",
    date: "28/04/2026 09:10",
    user: "Walter Rosales",
    module: "Solicitudes de gasto",
    action: "Creó la solicitud SOL-0001",
    detail: "Registro inicial de gasto de viaje / viáticos.",
    type: "Creación",
    color: "blue",
    icon: ClipboardList,
  },
  {
    id: "EVT-0002",
    date: "28/04/2026 09:11",
    user: "Sistema",
    module: "Planificación y normativa",
    action: "Validó política de gasto",
    detail: "El gasto cumple con reglas por rol, destino y monto.",
    type: "Validación",
    color: "green",
    icon: ShieldCheck,
  },
  {
    id: "EVT-0003",
    date: "28/04/2026 09:12",
    user: "Sistema",
    module: "Control presupuestario",
    action: "Validó disponibilidad presupuestaria",
    detail: "Centro de costo CC-ADM-001 cuenta con fondos disponibles.",
    type: "Presupuesto",
    color: "green",
    icon: CheckCircle2,
  },
  {
    id: "EVT-0004",
    date: "28/04/2026 10:30",
    user: "María López",
    module: "Centro de autorizaciones",
    action: "Aprobó solicitud SOL-0001",
    detail: "Solicitud autorizada para ejecución del gasto.",
    type: "Aprobación",
    color: "green",
    icon: UserCheck,
  },
  {
    id: "EVT-0005",
    date: "28/04/2026 11:05",
    user: "Walter Rosales",
    module: "OCR Documentos",
    action: "Confirmó documento DOC-001",
    detail: "Factura validada y disponible para liquidación.",
    type: "OCR",
    color: "purple",
    icon: FileCheck,
  },
  {
    id: "EVT-0006",
    date: "28/04/2026 11:45",
    user: "Carlos Méndez",
    module: "Liquidaciones",
    action: "Observó liquidación LIQ-0002",
    detail: "Se solicitó corregir monto de comprobante asociado.",
    type: "Observación",
    color: "orange",
    icon: AlertTriangle,
  },
  {
    id: "EVT-0007",
    date: "28/04/2026 12:20",
    user: "Gerencia Administrativa",
    module: "Centro de autorizaciones",
    action: "Rechazó solicitud SOL-0004",
    detail: "El gasto excede la política configurada para el rol.",
    type: "Rechazo",
    color: "red",
    icon: XCircle,
  },
];

export function AuditEventsPage() {
  return (
    <VStack align="stretch" gap="6">
      <Flex
        justify="space-between"
        align={{ base: "start", md: "center" }}
        direction={{ base: "column", md: "row" }}
        gap="4"
      >
        <Box>
          <Heading size="lg">Bitácora de Eventos</Heading>
          <Text color="gray.500" mt="1">
            Registro histórico de acciones realizadas en solicitudes,
            autorizaciones, documentos OCR, liquidaciones y configuración del
            sistema.
          </Text>
        </Box>

        <HStack>
          <Button variant="outline">
            <Filter size={18} />
            Filtros avanzados
          </Button>

          <Button colorPalette="blue">
            <Download size={18} />
            Exportar auditoría
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
        {auditStats.map((item) => (
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
            <Heading size="md">Eventos del sistema</Heading>
            <Text fontSize="sm" color="gray.500">
              Trazabilidad completa de operaciones realizadas por usuarios y
              procesos automáticos.
            </Text>
          </Box>

          <HStack>
            <Box position="relative">
              <Input pl="9" placeholder="Buscar evento..." maxW="240px" />
              <Box
                position="absolute"
                left="3"
                top="50%"
                transform="translateY(-50%)"
                color="gray.400"
              >
                <Search size={16} />
              </Box>
            </Box>

            <NativeSelect.Root maxW="190px">
              <NativeSelect.Field defaultValue="todos">
                <option value="todos">Todos los módulos</option>
                <option value="solicitudes">Solicitudes</option>
                <option value="autorizaciones">Autorizaciones</option>
                <option value="ocr">OCR</option>
                <option value="liquidaciones">Liquidaciones</option>
                <option value="configuracion">Configuración</option>
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>

            <NativeSelect.Root maxW="170px">
              <NativeSelect.Field defaultValue="todos">
                <option value="todos">Todos los tipos</option>
                <option value="creacion">Creación</option>
                <option value="validacion">Validación</option>
                <option value="aprobacion">Aprobación</option>
                <option value="rechazo">Rechazo</option>
                <option value="observacion">Observación</option>
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
          </HStack>
        </Flex>

        <VStack align="stretch" gap="3">
          {auditEvents.map((event) => (
            <AuditEventRow key={event.id} {...event} />
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

function AuditEventRow({
  id,
  date,
  user,
  module,
  action,
  detail,
  type,
  color,
  icon: Icon,
}: {
  id: string;
  date: string;
  user: string;
  module: string;
  action: string;
  detail: string;
  type: string;
  color: string;
  icon: React.ElementType;
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
            <Icon size={19} />
          </Box>

          <Box>
            <HStack mb="1" flexWrap="wrap">
              <Text fontWeight="bold">{id}</Text>
              <Badge colorPalette={color}>{type}</Badge>
              <Badge variant="outline">{module}</Badge>
            </HStack>

            <Text fontWeight="semibold">{action}</Text>

            <Text fontSize="sm" color="gray.500">
              {detail}
            </Text>

            <Text fontSize="xs" color="gray.400" mt="2">
              Usuario: {user} · Fecha: {date}
            </Text>
          </Box>
        </HStack>

        <Button size="sm" variant="outline">
          <Eye size={16} />
          Ver detalle
        </Button>
      </Flex>
    </Box>
  );
}