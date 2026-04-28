import {
  Badge,
  Box,
  Button,
  Flex,
  Grid,
  Heading,
  HStack,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  Bell,
  CheckCircle2,
  Clock3,
  Eye,
  FileCheck,
  FileSearch,
  Filter,
  GitBranch,
  Search,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const notificationStats = [
  {
    id: "1",
    title: "Notificaciones nuevas",
    label: "Notificaciones nuevas",
    value: "5",
    description: "Pendientes de lectura",
    color: "red",
    icon: Bell,
  },
  {
    id: "2",
    title: "Autorizaciones",
    label: "Autorizaciones",
    value: "3",
    description: "Solicitudes que requieren acción",
    color: "purple",
    icon: ShieldCheck,
  },
  {
    id: "3",
    title: "OCR y documentos",
    label: "OCR y documentos",
    value: "4",
    description: "Eventos de procesamiento",
    color: "blue",
    icon: FileSearch,
  },
  {
    id: "4",
    title: "Liquidaciones",
    label: "Liquidaciones",
    value: "2",
    description: "Alertas financieras",
    color: "green",
    icon: WalletCards,
  },
];

const notifications = [
  {
    id: "1",
    title: "Solicitud pendiente de aprobación",
    description:
      "La solicitud SOL-0002 se encuentra pendiente de revisión por Gerencia Financiera.",
    module: "Trazabilidad",
    type: "Autorización",
    status: "Nueva",
    date: "Hoy, 09:35",
    color: "purple",
    icon: ShieldCheck,
  },
  {
    id: "2",
    title: "Documento OCR confirmado",
    description:
      "El documento DOC-001 fue confirmado y ya puede asociarse a una liquidación.",
    module: "Rendición y Conciliación",
    type: "OCR",
    status: "Nueva",
    date: "Hoy, 08:50",
    color: "blue",
    icon: FileCheck,
  },
  {
    id: "3",
    title: "Liquidación pendiente de comprobantes",
    description:
      "La liquidación LIQ-0003 requiere documentos adicionales para continuar con la conciliación.",
    module: "Liquidaciones",
    type: "Liquidación",
    status: "Pendiente",
    date: "Ayer, 17:20",
    color: "yellow",
    icon: WalletCards,
  },
  {
    id: "4",
    title: "Escalamiento por tiempo vencido",
    description:
      "La solicitud SOL-0004 superó el tiempo definido en el SLA y fue marcada para reasignación.",
    module: "Trazabilidad",
    type: "SLA",
    status: "Nueva",
    date: "Ayer, 15:10",
    color: "red",
    icon: GitBranch,
  },
  {
    id: "5",
    title: "Presupuesto validado correctamente",
    description:
      "La solicitud SOL-0001 pasó la verificación presupuestaria del centro de costo.",
    module: "Planificación",
    type: "Presupuesto",
    status: "Leída",
    date: "22/04/2026, 10:15",
    color: "green",
    icon: CheckCircle2,
  },
];

export function NotificationsPage() {

    const navigate = useNavigate();
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
              Centro de eventos
            </Badge>
            <Badge colorPalette="red" variant="subtle">
              Notificaciones
            </Badge>
          </HStack>

          <Heading size="lg">Notificaciones del sistema</Heading>

          <Text color="gray.500" mt="1">
            Consulta de alertas, eventos, aprobaciones, documentos OCR,
            liquidaciones y avisos generados por los módulos del sistema.
          </Text>
        </Box>

        <HStack>
          <Button variant="outline">
            <CheckCircle2 size={18} />
            Marcar todo como leído
          </Button>

          <Button colorPalette="blue">
            <Bell size={18} />
            Configurar alertas
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
        {notificationStats.map((item) => (
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
          align={{ base: "stretch", md: "center" }}
          direction={{ base: "column", md: "row" }}
          gap="4"
          mb="5"
        >
          <Box>
            <Heading size="md">Historial de notificaciones</Heading>
            <Text fontSize="sm" color="gray.500">
              Eventos recientes asociados al flujo operativo y financiero.
            </Text>
          </Box>

          <HStack>
            <Box position="relative">
              <Box
                position="absolute"
                left="3"
                top="50%"
                transform="translateY(-50%)"
                color="gray.400"
              >
                <Search size={16} />
              </Box>

              <Input pl="9" placeholder="Buscar notificación" w="260px" />
            </Box>

            <Button variant="outline">
              <Filter size={17} />
              Filtrar
            </Button>
          </HStack>
        </Flex>

        <VStack align="stretch" gap="3">
          {notifications.map((item) => (
            <NotificationRow
                key={item.id}
                {...item}
                onViewDetail={() => navigate(`/notificaciones/${item.id}`)}
                />
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
function NotificationRow({
  title,
  description,
  module,
  type,
  status,
  date,
  color,
  icon: Icon,
  onViewDetail,
}: {
  id: string;
  title: string;
  description: string;
  module: string;
  type: string;
  status: string;
  date: string;
  color: string;
  icon: React.ElementType;
  onViewDetail: () => void;
}) {
  return (
    <Box
      border="1px solid"
      borderColor={status === "Nueva" ? `${color}.200` : "gray.100"}
      bg={status === "Nueva" ? `${color}.50` : "white"}
      rounded="2xl"
      p="4"
      _hover={{
        borderColor: "blue.200",
        bg: status === "Nueva" ? `${color}.50` : "gray.50",
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
            bg="white"
            color={`${color}.600`}
            display="flex"
            alignItems="center"
            justifyContent="center"
            border="1px solid"
            borderColor={`${color}.100`}
            flexShrink={0}
          >
            <Icon size={21} />
          </Box>

          <Box>
            <HStack flexWrap="wrap" mb="1">
              <Text fontWeight="semibold">{title}</Text>

              <Badge colorPalette={color}>{type}</Badge>

              <Badge
                colorPalette={status === "Nueva" ? "red" : "gray"}
                variant={status === "Nueva" ? "solid" : "subtle"}
              >
                {status}
              </Badge>
            </HStack>

            <Text fontSize="sm" color="gray.600">
              {description}
            </Text>

            <HStack mt="2" color="gray.500">
              <Clock3 size={14} />
              <Text fontSize="xs">{date}</Text>
              <Text fontSize="xs">·</Text>
              <Text fontSize="xs">{module}</Text>
            </HStack>
          </Box>
        </HStack>

      <Button size="sm" variant="outline" onClick={onViewDetail}>
        <Eye size={16} />
        Ver detalle
        </Button>
      </Flex>
    </Box>
  );
}