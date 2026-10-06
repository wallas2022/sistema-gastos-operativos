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
  AlertTriangle,
  BellRing,
  Clock3,
  Eye,
  FileClock,
  ShieldAlert,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  escalateSla,
  getSlaEscalations,
  type SlaEscalationItem,
} from "../../traceability/traceability.service";

const formatMoney = (amount: number, currency = "GTQ") => {
  return new Intl.NumberFormat("es-GT", {
    style: "currency",
    currency: currency || "GTQ",
  }).format(Number(amount || 0));
};

export function SlaEscalationsPage() {
  const navigate = useNavigate();

  const [items, setItems] = useState<SlaEscalationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const loadEscalations = async () => {
    try {
      setLoading(true);
      const data = await getSlaEscalations();
      setItems(data);
    } catch (error) {
      console.error("Error al cargar escalamientos SLA:", error);
      alert("No se pudieron cargar los escalamientos SLA");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEscalations();
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const text = `${item.code} ${item.requesterName} ${item.status} ${item.slaStatus} ${item.currentStep}`.toLowerCase();
      return text.includes(search.toLowerCase());
    });
  }, [items, search]);

  const stats = useMemo(() => {
    const risk = items.filter((item) => item.slaStatus === "EN_RIESGO").length;
    const out = items.filter((item) => item.slaStatus === "FUERA_SLA").length;
    const escalated = items.filter((item) => item.alreadyEscalated).length;

    return [
      {
        label: "En seguimiento",
        value: String(items.length),
        description: "Solicitudes con alerta SLA",
        icon: FileClock,
        color: "blue",
      },
      {
        label: "En riesgo",
        value: String(risk),
        description: "Cerca del vencimiento",
        icon: Clock3,
        color: "orange",
      },
      {
        label: "Fuera de SLA",
        value: String(out),
        description: "Superaron el tiempo permitido",
        icon: AlertTriangle,
        color: "red",
      },
      {
        label: "Escaladas",
        value: String(escalated),
        description: "Ya tienen evento de escalamiento",
        icon: BellRing,
        color: "purple",
      },
    ];
  }, [items]);

  const handleEscalate = async (item: SlaEscalationItem) => {
    const comment = prompt("Comentario del escalamiento SLA:");

    try {
      setProcessingId(item.id);

      await escalateSla(
        item.id,
        comment || `Escalamiento generado por ${item.slaStatus}.`,
      );

      await loadEscalations();
    } catch (error) {
      console.error("Error al escalar solicitud:", error);
      alert("No se pudo escalar la solicitud");
    } finally {
      setProcessingId(null);
    }
  };

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
            <Badge colorPalette="red" variant="subtle">
              SLA
            </Badge>
            <Badge colorPalette="purple" variant="subtle">
              Escalamientos
            </Badge>
          </HStack>

          <Heading size="lg">Escalamiento SLA</Heading>

          <Text color="gray.500" mt="1">
            Identificación de solicitudes en riesgo o fuera del tiempo operativo
            permitido.
          </Text>
        </Box>

        <Button colorPalette="blue" onClick={loadEscalations} disabled={loading}>
          Actualizar
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
            <Heading size="md">Solicitudes con alerta SLA</Heading>
            <Text fontSize="sm" color="gray.500">
              Casos que requieren seguimiento o escalamiento operativo.
            </Text>
          </Box>

          <Input
            placeholder="Buscar por código, solicitante o estado"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            maxW={{ base: "100%", md: "360px" }}
          />
        </Flex>

        {loading ? (
          <VStack py="12">
            <Spinner />
            <Text color="gray.500">Cargando escalamientos SLA...</Text>
          </VStack>
        ) : (
          <VStack align="stretch" gap="3">
            {filteredItems.map((item) => (
              <SlaRow
                key={item.id}
                item={item}
                disabled={processingId === item.id}
                onView={() => navigate(`/solicitudes-gastos/${item.id}`)}
                onEscalate={() => handleEscalate(item)}
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
                  No hay solicitudes con alerta SLA.
                </Text>
                <Text fontSize="sm" color="gray.500" mt="1">
                  Las solicitudes en riesgo o fuera de SLA aparecerán aquí.
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

function SlaRow({
  item,
  disabled,
  onView,
  onEscalate,
}: {
  item: SlaEscalationItem;
  disabled?: boolean;
  onView: () => void;
  onEscalate: () => void;
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
            <Badge colorPalette="blue">{item.code}</Badge>
            <SlaBadge slaStatus={item.slaStatus} />
            {item.alreadyEscalated && (
              <Badge colorPalette="purple">Escalada</Badge>
            )}
          </HStack>

          <Text fontWeight="semibold">{item.concept || item.type}</Text>

          <Text fontSize="sm" color="gray.500" mt="1">
            Estado: {item.status} · Etapa: {item.currentStep ?? "Flujo activo"}
          </Text>

          <Text fontSize="sm" color="gray.500" mt="1">
            Solicitante: {item.requesterName} · Centro:{" "}
            {item.costCenter ?? "Sin centro de costo"}
          </Text>

          <Text fontSize="sm" color="gray.500" mt="1">
            Tiempo detenido: {item.hoursInCurrentState} horas
          </Text>
        </Box>

        <VStack align={{ base: "start", xl: "end" }} gap="3">
          <Text fontWeight="bold" fontSize="lg">
            {formatMoney(Number(item.estimatedAmount || 0), item.currency)}
          </Text>

          <HStack>
            <Button size="xs" variant="outline" onClick={onView}>
              <Eye size={14} />
              Ver
            </Button>

            <Button
              size="xs"
              colorPalette="purple"
              disabled={disabled || item.alreadyEscalated}
              onClick={onEscalate}
            >
              <ShieldAlert size={14} />
              Escalar
            </Button>
          </HStack>
        </VStack>
      </Flex>
    </Box>
  );
}

function SlaBadge({ slaStatus }: { slaStatus: string }) {
  if (slaStatus === "FUERA_SLA") {
    return <Badge colorPalette="red">Fuera SLA</Badge>;
  }

  if (slaStatus === "EN_RIESGO") {
    return <Badge colorPalette="orange">En riesgo</Badge>;
  }

  return <Badge colorPalette="green">Dentro SLA</Badge>;
}