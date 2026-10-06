import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  SimpleGrid,
  Spinner,
  Table,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  approveAuthorization,
  getPendingAuthorizations,
  rejectAuthorization,
  type AuthorizationItem,
} from "../../traceability/traceability.service";

const timelineItems = [
  {
    title: "Solicitud registrada",
    description: "El usuario ingresó la solicitud de gasto.",
    status: "Completado",
  },
  {
    title: "Validación presupuestaria",
    description: "El sistema verificó fondos disponibles.",
    status: "Completado",
  },
  {
    title: "Aprobación de jefatura",
    description: "Pendiente de revisión por responsable del área.",
    status: "Actual",
  },
  {
    title: "Aprobación financiera",
    description: "Etapa posterior al visto bueno de jefatura.",
    status: "Pendiente",
  },
];

const formatMoney = (amount: number, currency = "GTQ") => {
  return new Intl.NumberFormat("es-GT", {
    style: "currency",
    currency: currency || "GTQ",
  }).format(Number(amount || 0));
};

export function WorkflowPage() {
  const [authorizations, setAuthorizations] = useState<AuthorizationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadAuthorizations = async () => {
    try {
      setLoading(true);
      const data = await getPendingAuthorizations();
      setAuthorizations(data);
    } catch (error) {
      console.error("Error al cargar autorizaciones:", error);
      alert("No se pudieron cargar las autorizaciones");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuthorizations();
  }, []);

  const kpis = useMemo(() => {
    const totalPending = authorizations.length;

    const urgent = authorizations.filter((item) => {
      const priority = item.priority?.toUpperCase();
      return priority === "URGENTE" || priority === "ALTA";
    }).length;

    const totalAmount = authorizations.reduce(
      (sum, item) => sum + Number(item.estimatedAmount || 0),
      0,
    );

    const inReview = authorizations.filter((item) => {
      const status = item.status?.toUpperCase();
      return status.includes("REVISION") || status.includes("REVISIÓN");
    }).length;

    return [
      {
        label: "Pendientes de aprobación",
        value: String(totalPending),
        description: "Solicitudes esperando autorización",
      },
      {
        label: "Urgentes",
        value: String(urgent),
        description: "Solicitudes con prioridad alta",
      },
      {
        label: "En revisión",
        value: String(inReview),
        description: "Procesos actualmente en análisis",
      },
      {
        label: "Monto en revisión",
        value: formatMoney(totalAmount, "GTQ"),
        description: "Total pendiente por autorizar",
      },
    ];
  }, [authorizations]);

  const handleApprove = async (request: AuthorizationItem) => {
    const comment = prompt("Comentario de aprobación:");

    try {
      setProcessingId(request.id);

      await approveAuthorization(
        request.id,
        comment || "Solicitud aprobada desde centro de autorizaciones.",
      );

      await loadAuthorizations();
    } catch (error) {
      console.error("Error al aprobar solicitud:", error);
      alert("No se pudo aprobar la solicitud");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (request: AuthorizationItem) => {
    const comment = prompt("Motivo del rechazo:");

    if (!comment) {
      alert("Debe ingresar un motivo de rechazo");
      return;
    }

    try {
      setProcessingId(request.id);

      await rejectAuthorization(request.id, comment);

      await loadAuthorizations();
    } catch (error) {
      console.error("Error al rechazar solicitud:", error);
      alert("No se pudo rechazar la solicitud");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <Box>
      <Flex
        justify="space-between"
        align={{ base: "flex-start", md: "center" }}
        gap="4"
        mb="6"
        direction={{ base: "column", md: "row" }}
      >
        <Box>
          <Heading size="lg">Trazabilidad de Flujos</Heading>
          <Text color="gray.500" mt="1">
            Seguimiento de autorizaciones, estados, escalamiento automático,
            tiempos SLA y bitácora de eventos del trámite.
          </Text>
        </Box>

        <HStack>
          <Button colorPalette="blue">Centro de autorizaciones</Button>
          <Button variant="outline">Ver bitácora</Button>
        </HStack>
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} gap="4" mb="6">
        {kpis.map((item) => (
          <Box
            key={item.label}
            bg="white"
            p="5"
            rounded="xl"
            border="1px solid"
            borderColor="gray.200"
          >
            <Text fontSize="sm" color="gray.500">
              {item.label}
            </Text>

            <Text fontSize="2xl" fontWeight="bold" mt="2">
              {item.value}
            </Text>

            <Text fontSize="sm" color="gray.500" mt="1">
              {item.description}
            </Text>
          </Box>
        ))}
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, xl: 3 }} gap="4" mb="6">
        <Box
          gridColumn={{ base: "span 1", xl: "span 2" }}
          bg="white"
          p="5"
          rounded="xl"
          border="1px solid"
          borderColor="gray.200"
        >
          <Flex justify="space-between" align="center" mb="4">
            <Box>
              <Heading size="md">Centro de autorizaciones</Heading>
              <Text fontSize="sm" color="gray.500" mt="1">
                Bandeja unificada para aprobadores con filtros por prioridad,
                estado, área y tipo de gasto.
              </Text>
            </Box>

            <Badge colorPalette="orange">
              {authorizations.length} pendientes
            </Badge>
          </Flex>

          {loading ? (
            <VStack py="10">
              <Spinner />
              <Text color="gray.500">Cargando autorizaciones...</Text>
            </VStack>
          ) : (
            <Table.Root size="sm">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>Código</Table.ColumnHeader>
                  <Table.ColumnHeader>Solicitante</Table.ColumnHeader>
                  <Table.ColumnHeader>Área / centro</Table.ColumnHeader>
                  <Table.ColumnHeader>Etapa</Table.ColumnHeader>
                  <Table.ColumnHeader>Monto</Table.ColumnHeader>
                  <Table.ColumnHeader>Prioridad</Table.ColumnHeader>
                  <Table.ColumnHeader>Estado</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="end">
                    Acciones
                  </Table.ColumnHeader>
                </Table.Row>
              </Table.Header>

              <Table.Body>
                {authorizations.map((request) => (
                  <Table.Row key={request.id}>
                    <Table.Cell fontWeight="medium">
                      {request.code}
                    </Table.Cell>

                    <Table.Cell>
                      <Box>
                        <Text>{request.requesterName}</Text>
                        <Text fontSize="xs" color="gray.500">
                          {request.requesterRole ?? "Solicitante"}
                        </Text>
                      </Box>
                    </Table.Cell>

                    <Table.Cell>
                      <Box>
                        <Text>
                          {request.companyName ?? "Sin empresa"}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          {request.costCenter ?? "Sin centro de costo"}
                        </Text>
                      </Box>
                    </Table.Cell>

                    <Table.Cell>
                      {request.currentStep ?? "Autorización"}
                    </Table.Cell>

                    <Table.Cell>
                      {formatMoney(
                        Number(request.estimatedAmount || 0),
                        request.currency || "GTQ",
                      )}
                    </Table.Cell>

                    <Table.Cell>
                      <PriorityBadge priority={request.priority ?? "Normal"} />
                    </Table.Cell>

                    <Table.Cell>
                      <StatusBadge status={request.status} />
                    </Table.Cell>

                    <Table.Cell>
                      <HStack justify="flex-end">
                        <Button
                          size="xs"
                          colorPalette="green"
                          disabled={processingId === request.id}
                          onClick={() => handleApprove(request)}
                        >
                          Aprobar
                        </Button>

                        <Button
                          size="xs"
                          colorPalette="red"
                          variant="outline"
                          disabled={processingId === request.id}
                          onClick={() => handleReject(request)}
                        >
                          Rechazar
                        </Button>
                      </HStack>
                    </Table.Cell>
                  </Table.Row>
                ))}

                {authorizations.length === 0 && (
                  <Table.Row>
                    <Table.Cell colSpan={8}>
                      <Text textAlign="center" color="gray.500" py="6">
                        No hay solicitudes pendientes de autorización.
                      </Text>
                    </Table.Cell>
                  </Table.Row>
                )}
              </Table.Body>
            </Table.Root>
          )}

          <Flex justify="flex-end" mt="5">
            <Button
              colorPalette="blue"
              variant="outline"
              onClick={loadAuthorizations}
              disabled={loading}
            >
              Actualizar bandeja
            </Button>
          </Flex>
        </Box>

        <VStack align="stretch" gap="4">
          <FeatureCard
            title="Monitor de estados"
            status="Diseño"
            description="Muestra una línea de tiempo indicando en qué rol o etapa se encuentra cada trámite."
          />

          <FeatureCard
            title="Gestión de escalamientos"
            status="Pendiente"
            description="Reasignación automática o alertas cuando una solicitud no se aprueba dentro del SLA."
          />

          <FeatureCard
            title="Bitácora de eventos"
            status="Base funcional"
            description="Registro histórico de quién aprobó, rechazó, modificó o comentó una solicitud."
          />
        </VStack>
      </SimpleGrid>

      <Box
        bg="white"
        p="5"
        rounded="xl"
        border="1px solid"
        borderColor="gray.200"
      >
        <Flex justify="space-between" align="center" mb="4">
          <Box>
            <Heading size="md">Monitor de estados del trámite</Heading>
            <Text fontSize="sm" color="gray.500">
              Representación visual del avance de una solicitud dentro del
              flujo de aprobación.
            </Text>
          </Box>

          <Button size="sm" variant="outline">
            Ver detalle
          </Button>
        </Flex>

        <SimpleGrid columns={{ base: 1, md: 4 }} gap="4">
          {timelineItems.map((item, index) => (
            <TimelineCard
              key={item.title}
              number={index + 1}
              title={item.title}
              description={item.description}
              status={item.status}
            />
          ))}
        </SimpleGrid>
      </Box>
    </Box>
  );
}

function TimelineCard({
  number,
  title,
  description,
  status,
}: {
  number: number;
  title: string;
  description: string;
  status: string;
}) {
  const isCompleted = status === "Completado";
  const isCurrent = status === "Actual";

  return (
    <Box
      p="4"
      rounded="lg"
      border="1px solid"
      borderColor={isCurrent ? "blue.300" : "gray.200"}
      bg={isCurrent ? "blue.50" : "gray.50"}
    >
      <Flex align="center" gap="3" mb="3">
        <Box
          w="30px"
          h="30px"
          rounded="full"
          bg={isCompleted ? "green.600" : isCurrent ? "blue.600" : "gray.400"}
          color="white"
          display="flex"
          alignItems="center"
          justifyContent="center"
          fontSize="sm"
          fontWeight="bold"
        >
          {number}
        </Box>

        <Badge
          colorPalette={isCompleted ? "green" : isCurrent ? "blue" : "gray"}
        >
          {status}
        </Badge>
      </Flex>

      <Text fontWeight="semibold">{title}</Text>
      <Text fontSize="sm" color="gray.500" mt="2">
        {description}
      </Text>
    </Box>
  );
}

function FeatureCard({
  title,
  description,
  status,
}: {
  title: string;
  description: string;
  status: string;
}) {
  return (
    <Box bg="white" p="5" rounded="xl" border="1px solid" borderColor="gray.200">
      <Flex justify="space-between" align="flex-start" gap="3">
        <Box>
          <Text fontWeight="semibold">{title}</Text>
          <Text fontSize="sm" color="gray.500" mt="2">
            {description}
          </Text>
        </Box>

        <Badge
          colorPalette={
            status === "Base funcional"
              ? "green"
              : status === "Pendiente"
                ? "orange"
                : "gray"
          }
        >
          {status}
        </Badge>
      </Flex>
    </Box>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const normalized = priority.toUpperCase();

  const color =
    normalized === "URGENTE" || normalized === "ALTA"
      ? "red"
      : normalized === "MEDIA" || normalized === "NORMAL"
        ? "orange"
        : "gray";

  return <Badge colorPalette={color}>{priority}</Badge>;
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toUpperCase();

  const color =
    normalized.includes("APROB")
      ? "green"
      : normalized.includes("RECH")
        ? "red"
        : normalized.includes("REVISION") || normalized.includes("REVISIÓN")
          ? "blue"
          : normalized.includes("PENDIENTE")
            ? "orange"
            : "gray";

  return <Badge colorPalette={color}>{status}</Badge>;
}