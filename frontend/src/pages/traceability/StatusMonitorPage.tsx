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
  Select,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Eye,
  FileClock,
  Search,
  XCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  getStatusMonitor,
  type StatusMonitorItem,
} from "../../traceability/traceability.service";

const formatMoney = (amount: number, currency = "GTQ") => {
  return new Intl.NumberFormat("es-GT", {
    style: "currency",
    currency: currency || "GTQ",
  }).format(Number(amount || 0));
};

const formatDate = (value?: string) => {
  if (!value) return "-";

  return new Intl.DateTimeFormat("es-GT", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

export function StatusMonitorPage() {
  const navigate = useNavigate();

  const [items, setItems] = useState<StatusMonitorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("TODOS");
  const [slaFilter, setSlaFilter] = useState("TODOS");

  const loadMonitor = async () => {
    try {
      setLoading(true);
      const data = await getStatusMonitor();

      console.log("Monitor de estados:", data);

      setItems(data);
    } catch (error) {
      console.error("Error al cargar monitor de estados:", error);
      alert("No se pudo cargar el monitor de estados");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMonitor();
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const text = `
        ${item.code}
        ${item.requesterName}
        ${item.type}
        ${item.status}
        ${item.currentStep}
        ${item.costCenter}
      `.toLowerCase();

      const matchesSearch = text.includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "TODOS" || item.status === statusFilter;

      const matchesSla =
        slaFilter === "TODOS" || item.slaStatus === slaFilter;

      return matchesSearch && matchesStatus && matchesSla;
    });
  }, [items, search, statusFilter, slaFilter]);

  const stats = useMemo(() => {
    const total = items.length;

    const pending = items.filter((item) =>
      ["ENVIADA", "EN_REVISION", "PENDIENTE_APROBACION", "VALIDADA"].includes(
        item.status,
      ),
    ).length;

    const approved = items.filter((item) => item.status === "APROBADA").length;

    const observed = items.filter((item) => item.status === "OBSERVADA").length;

    const outSla = items.filter((item) => item.slaStatus === "FUERA_SLA").length;

    return [
      {
        label: "Total en flujo",
        value: String(total),
        description: "Solicitudes activas en seguimiento",
        color: "blue",
        icon: Activity,
      },
      {
        label: "Pendientes",
        value: String(pending),
        description: "Esperando revisión o autorización",
        color: "orange",
        icon: Clock3,
      },
      {
        label: "Aprobadas",
        value: String(approved),
        description: "Solicitudes autorizadas",
        color: "green",
        icon: CheckCircle2,
      },
      {
        label: "Fuera de SLA",
        value: String(outSla),
        description: "Solicitudes con atraso operativo",
        color: "red",
        icon: AlertTriangle,
      },
    ];
  }, [items]);

  const availableStatuses = useMemo(() => {
    return Array.from(new Set(items.map((item) => item.status))).sort();
  }, [items]);

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
              MOTF
            </Badge>
            <Badge colorPalette="purple" variant="subtle">
              Monitor de estados
            </Badge>
          </HStack>

          <Heading size="lg">Monitor de estados</Heading>

          <Text color="gray.500" mt="1">
            Seguimiento del estado actual, etapa, SLA y trazabilidad resumida de
            las solicitudes de gasto.
          </Text>
        </Box>

        <Button colorPalette="blue" onClick={loadMonitor} disabled={loading}>
          Actualizar monitor
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
          align={{ base: "stretch", xl: "center" }}
          direction={{ base: "column", xl: "row" }}
          gap="4"
          mb="5"
        >
          <Box>
            <Heading size="md">Solicitudes en seguimiento</Heading>
            <Text fontSize="sm" color="gray.500">
              Vista consolidada de expedientes activos dentro del flujo.
            </Text>
          </Box>

          <HStack gap="3" wrap="wrap">
            <Box position="relative">
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
                placeholder="Buscar solicitud..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                w={{ base: "100%", md: "260px" }}
              />
            </Box>

            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} style={{ width: 220, border: '1px solid #d4d4d8', borderRadius: 6, padding: 8 }}>
              <option value="TODOS">Todos los estados</option>
              {availableStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>

            <select value={slaFilter} onChange={(event) => setSlaFilter(event.target.value)} style={{ width: 220, border: '1px solid #d4d4d8', borderRadius: 6, padding: 8 }}>
              <option value="TODOS">Todos los SLA</option>
              <option value="DENTRO_TIEMPO">Dentro del tiempo</option>
              <option value="EN_RIESGO">En riesgo</option>
              <option value="FUERA_SLA">Fuera de SLA</option>
            </select>
          </HStack>
        </Flex>

        {loading ? (
          <VStack py="12">
            <Spinner />
            <Text color="gray.500">Cargando monitor de estados...</Text>
          </VStack>
        ) : (
          <VStack align="stretch" gap="3">
            {filteredItems.map((item) => (
              <StatusRow
                key={item.id}
                item={item}
                onView={() => navigate(`/solicitudes-gastos/${item.id}`)}
              />
            ))}

            {filteredItems.length === 0 && (
              <Box
                border="1px dashed"
                borderColor="gray.300"
                rounded="xl"
                p="8"
                textAlign="center"
                bg="gray.50"
              >
                <Text fontWeight="semibold" color="gray.600">
                  No hay solicitudes para mostrar.
                </Text>
                <Text fontSize="sm" color="gray.500" mt="1">
                  Ajusta los filtros o actualiza el monitor.
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

function StatusRow({
  item,
  onView,
}: {
  item: StatusMonitorItem;
  onView: () => void;
}) {
  return (
    <Box
      border="1px solid"
      borderColor="gray.200"
      rounded="xl"
      p="4"
      bg="gray.50"
    >
      <Flex
        justify="space-between"
        align={{ base: "start", xl: "center" }}
        direction={{ base: "column", xl: "row" }}
        gap="4"
      >
        <Box flex="1">
          <HStack mb="2" wrap="wrap">
            <Badge colorPalette="blue">{item.code}</Badge>
            <StatusBadge status={item.status} />
            <SlaBadge slaStatus={item.slaStatus} />
          </HStack>

          <Text fontWeight="semibold">
            {item.concept || item.type}
          </Text>

          <Text fontSize="sm" color="gray.500" mt="1">
            {item.type} · {item.companyName ?? "Sin empresa"} ·{" "}
            {item.costCenter ?? "Sin centro de costo"}
          </Text>

          <Text fontSize="sm" color="gray.500" mt="1">
            Solicitante: {item.requesterName} · Prioridad:{" "}
            {item.priority ?? "NORMAL"}
          </Text>

          <Text fontSize="sm" color="gray.500" mt="1">
            Etapa actual: {item.currentStep ?? "Flujo activo"}
          </Text>

          {item.lastEvent && (
            <Text fontSize="sm" color="gray.500" mt="1">
              Último evento: {item.lastEvent}
            </Text>
          )}
        </Box>

        <VStack align={{ base: "start", xl: "end" }} gap="3">
          <Text fontWeight="bold" fontSize="lg">
            {formatMoney(Number(item.estimatedAmount || 0), item.currency)}
          </Text>

          <Text fontSize="xs" color="gray.500">
            Actualizado: {formatDate(item.updatedAt)}
          </Text>

          <Button size="xs" variant="outline" onClick={onView}>
            <Eye size={14} />
            Ver detalle
          </Button>
        </VStack>
      </Flex>
    </Box>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toUpperCase();

  const color =
    normalized.includes("APROB")
      ? "green"
      : normalized.includes("RECH")
        ? "red"
        : normalized.includes("OBSERV")
          ? "yellow"
          : normalized.includes("REVISION") || normalized.includes("REVISIÓN")
            ? "blue"
            : normalized.includes("PENDIENTE")
              ? "orange"
              : normalized.includes("BORRADOR")
                ? "gray"
                : normalized.includes("LIQUID")
                  ? "purple"
                  : "gray";

  return <Badge colorPalette={color}>{status}</Badge>;
}

function SlaBadge({ slaStatus }: { slaStatus: string }) {
  const normalized = slaStatus.toUpperCase();

  if (normalized === "FUERA_SLA") {
    return (
      <Badge colorPalette="red">
        <XCircle size={12} />
        Fuera SLA
      </Badge>
    );
  }

  if (normalized === "EN_RIESGO") {
    return (
      <Badge colorPalette="orange">
        <FileClock size={12} />
        En riesgo
      </Badge>
    );
  }

  return (
    <Badge colorPalette="green">
      <CheckCircle2 size={12} />
      Dentro SLA
    </Badge>
  );
}
