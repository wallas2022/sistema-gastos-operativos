import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Flex,
  Grid,
  Heading,
  HStack,
  Input,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  Activity,
  Eye,
  FileClock,
  History,
  Search,
  UserCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  getEventLogs,
  type EventLogItem,
} from "../../traceability/traceability.service";

const formatDate = (value?: string) => {
  if (!value) return "-";

  return new Intl.DateTimeFormat("es-GT", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const formatMoney = (amount: number, currency = "GTQ") => {
  return new Intl.NumberFormat("es-GT", {
    style: "currency",
    currency: currency || "GTQ",
  }).format(Number(amount || 0));
};

export function EventLogsPage() {
  const navigate = useNavigate();

  const [logs, setLogs] = useState<EventLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await getEventLogs();
      setLogs(data);
    } catch (error) {
      console.error("Error al cargar bitácora de eventos:", error);
      alert("No se pudo cargar la bitácora de eventos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter((item) => {
      const text = `
        ${item.requestCode}
        ${item.requesterName}
        ${item.event}
        ${item.description}
        ${item.userName}
        ${item.fromStatus}
        ${item.toStatus}
      `.toLowerCase();

      return text.includes(search.toLowerCase());
    });
  }, [logs, search]);

  const stats = useMemo(() => {
    const total = logs.length;
    const approvals = logs.filter((item) =>
      item.event?.includes("APROBADA"),
    ).length;
    const observations = logs.filter((item) =>
      item.event?.includes("OBSERVADA"),
    ).length;
    const escalations = logs.filter((item) =>
      item.event?.includes("ESCALADA"),
    ).length;

    return [
      {
        label: "Eventos registrados",
        value: String(total),
        description: "Movimientos auditados",
        color: "blue",
        icon: History,
      },
      {
        label: "Aprobaciones",
        value: String(approvals),
        description: "Solicitudes aprobadas",
        color: "green",
        icon: UserCheck,
      },
      {
        label: "Observaciones",
        value: String(observations),
        description: "Solicitudes devueltas",
        color: "orange",
        icon: FileClock,
      },
      {
        label: "Escalamientos",
        value: String(escalations),
        description: "Alertas SLA registradas",
        color: "purple",
        icon: Activity,
      },
    ];
  }, [logs]);

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
              Auditoría
            </Badge>
            <Badge colorPalette="blue" variant="subtle">
              Bitácora de eventos
            </Badge>
          </HStack>

          <Heading size="lg">Bitácora de eventos</Heading>

          <Text color="gray.500" mt="1">
            Registro histórico de acciones, cambios de estado, aprobaciones,
            observaciones, rechazos y escalamientos dentro del flujo.
          </Text>
        </Box>

        <Button colorPalette="blue" onClick={loadLogs} disabled={loading}>
          Actualizar bitácora
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
        {stats.map((item) => (
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
            <Heading size="md">Eventos recientes</Heading>
            <Text fontSize="sm" color="gray.500">
              Últimos movimientos registrados en las solicitudes de gasto.
            </Text>
          </Box>

          <Box position="relative" maxW={{ base: "100%", md: "360px" }}>
            <Box
              position="absolute"
              left="10px"
              top="50%"
              transform="translateY(-50%)"
              color="gray.400"
            >
              <Search size={16} />
            </Box>

            <Input
              pl="9"
              placeholder="Buscar evento..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </Box>
        </Flex>

        {loading ? (
          <VStack py="12">
            <Spinner />
            <Text color="gray.500">Cargando bitácora de eventos...</Text>
          </VStack>
        ) : (
          <VStack align="stretch" gap="3">
            {filteredLogs.map((item) => (
              <EventLogRow
                key={item.id}
                item={item}
                onView={() => navigate(`/solicitudes-gastos/${item.requestId}`)}
              />
            ))}

            {filteredLogs.length === 0 && (
              <Box
                border="1px dashed"
                borderColor="gray.300"
                rounded="xl"
                p="8"
                textAlign="center"
                bg="gray.50"
              >
                <Text fontWeight="semibold" color="gray.600">
                  No hay eventos para mostrar.
                </Text>
                <Text fontSize="sm" color="gray.500" mt="1">
                  Cuando existan acciones en el flujo aparecerán en esta
                  bitácora.
                </Text>
              </Box>
            )}
          </VStack>
        )}
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
    <Box bg="white" border="1px solid" borderColor="gray.200" rounded="2xl" p="5">
      <Flex justify="space-between" align="start">
        <Box>
          <Text fontSize="sm" color="gray.500">
            {label}
          </Text>
          <Text fontSize="2xl" fontWeight="bold" mt="2">
            {value}
          </Text>
          <Text fontSize="sm" color="gray.500" mt="1">
            {description}
          </Text>
        </Box>

        <Box color={`${color}.600`}>
          <Icon size={24} />
        </Box>
      </Flex>
    </Box>
  );
}

function EventLogRow({
  item,
  onView,
}: {
  item: EventLogItem;
  onView: () => void;
}) {
  return (
    <Box border="1px solid" borderColor="gray.200" rounded="xl" p="4" bg="gray.50">
      <Flex
        justify="space-between"
        align={{ base: "start", xl: "center" }}
        direction={{ base: "column", xl: "row" }}
        gap="4"
      >
        <Box flex="1">
          <HStack mb="2" wrap="wrap">
            <Badge colorPalette="blue">{item.requestCode}</Badge>
            <EventBadge event={item.event} />
            {item.fromStatus && item.toStatus && (
              <Badge colorPalette="gray">
                {item.fromStatus} → {item.toStatus}
              </Badge>
            )}
          </HStack>

          <Text fontWeight="semibold">{item.event}</Text>

          <Text fontSize="sm" color="gray.500" mt="1">
            {item.description || "Evento registrado en el flujo."}
          </Text>

          <Text fontSize="sm" color="gray.500" mt="1">
            Solicitud: {item.concept || item.requestType} · Solicitante:{" "}
            {item.requesterName ?? "-"}
          </Text>

          <Text fontSize="sm" color="gray.500" mt="1">
            Usuario ejecutor: {item.userName ?? "Sistema"} · Fecha:{" "}
            {formatDate(item.createdAt)}
          </Text>
        </Box>

        <VStack align={{ base: "start", xl: "end" }} gap="3">
          <Text fontWeight="bold">
            {formatMoney(item.amount, item.currency)}
          </Text>

          <Button size="xs" variant="outline" onClick={onView}>
            <Eye size={14} />
            Ver solicitud
          </Button>
        </VStack>
      </Flex>
    </Box>
  );
}

function EventBadge({ event }: { event: string }) {
  const normalized = event.toUpperCase();

  const color =
    normalized.includes("APROB")
      ? "green"
      : normalized.includes("RECH")
        ? "red"
        : normalized.includes("OBSERV")
          ? "orange"
          : normalized.includes("ESCAL")
            ? "purple"
            : normalized.includes("CREADA")
              ? "blue"
              : normalized.includes("ENVIADA")
                ? "cyan"
                : "gray";

  return <Badge colorPalette={color}>{event}</Badge>;
}