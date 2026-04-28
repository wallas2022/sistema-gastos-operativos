import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  SimpleGrid,
  Table,
  Text,
  VStack,
} from "@chakra-ui/react";

const kpis = [
  {
    label: "Pendientes de aprobación",
    value: "11",
    description: "Solicitudes esperando autorización",
  },
  {
    label: "Aprobadas hoy",
    value: "7",
    description: "Procesos autorizados durante el día",
  },
  {
    label: "SLA vencidos",
    value: "2",
    description: "Solicitudes fuera del tiempo esperado",
  },
  {
    label: "Rechazos registrados",
    value: "4",
    description: "Solicitudes rechazadas este mes",
  },
];

const approvalRows = [
  {
    code: "SG-2026-0008",
    requester: "Juan Pérez",
    area: "Comercial",
    stage: "Gerencia",
    priority: "Alta",
    status: "Pendiente",
  },
  {
    code: "SG-2026-0011",
    requester: "María López",
    area: "Operaciones",
    stage: "Finanzas",
    priority: "Media",
    status: "En revisión",
  },
  {
    code: "SG-2026-0015",
    requester: "Carlos Méndez",
    area: "Administración",
    stage: "Jefatura",
    priority: "Baja",
    status: "Aprobada",
  },
  {
    code: "SG-2026-0017",
    requester: "Ana Gómez",
    area: "Finanzas",
    stage: "Gerencia",
    priority: "Alta",
    status: "SLA vencido",
  },
];

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

export function WorkflowPage() {
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

            <Badge colorPalette="orange">11 pendientes</Badge>
          </Flex>

          <Table.Root size="sm">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Código</Table.ColumnHeader>
                <Table.ColumnHeader>Solicitante</Table.ColumnHeader>
                <Table.ColumnHeader>Área</Table.ColumnHeader>
                <Table.ColumnHeader>Etapa</Table.ColumnHeader>
                <Table.ColumnHeader>Prioridad</Table.ColumnHeader>
                <Table.ColumnHeader>Estado</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>

            <Table.Body>
              {approvalRows.map((row) => (
                <Table.Row key={row.code}>
                  <Table.Cell fontWeight="medium">{row.code}</Table.Cell>
                  <Table.Cell>{row.requester}</Table.Cell>
                  <Table.Cell>{row.area}</Table.Cell>
                  <Table.Cell>{row.stage}</Table.Cell>
                  <Table.Cell>
                    <PriorityBadge priority={row.priority} />
                  </Table.Cell>
                  <Table.Cell>
                    <StatusBadge status={row.status} />
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>

          <Flex justify="flex-end" mt="5">
            <Button colorPalette="blue">Revisar autorizaciones</Button>
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

        <Badge colorPalette={isCompleted ? "green" : isCurrent ? "blue" : "gray"}>
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

        <Badge colorPalette={status === "Base funcional" ? "green" : status === "Pendiente" ? "orange" : "gray"}>
          {status}
        </Badge>
      </Flex>
    </Box>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const color =
    priority === "Alta" ? "red" : priority === "Media" ? "orange" : "gray";

  return <Badge colorPalette={color}>{priority}</Badge>;
}

function StatusBadge({ status }: { status: string }) {
  const color =
    status === "Aprobada"
      ? "green"
      : status === "SLA vencido"
        ? "red"
        : status === "En revisión"
          ? "blue"
          : "orange";

  return <Badge colorPalette={color}>{status}</Badge>;
}