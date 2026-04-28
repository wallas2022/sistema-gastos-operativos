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
    label: "Solicitudes creadas",
    value: "24",
    description: "Solicitudes registradas este mes",
  },
  {
    label: "Solicitudes simuladas",
    value: "17",
    description: "Cálculos previos realizados",
  },
  {
    label: "Fondos validados",
    value: "91%",
    description: "Solicitudes con presupuesto disponible",
  },
  {
    label: "Políticas activas",
    value: "12",
    description: "Reglas vigentes por empresa y área",
  },
];

const policyRows = [
  {
    rule: "Límite por alimentación",
    scope: "Operaciones",
    value: "Q 150.00",
    status: "Activa",
  },
  {
    rule: "Hospedaje nacional",
    scope: "Comercial",
    value: "Q 650.00",
    status: "Activa",
  },
  {
    rule: "Transporte local",
    scope: "Administración",
    value: "Q 300.00",
    status: "Revisión",
  },
  {
    rule: "Gasto extraordinario",
    scope: "Finanzas",
    value: "Requiere aprobación",
    status: "Activa",
  },
];

export function PlanningPage() {
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
          <Heading size="lg">Planificación y Normativa</Heading>
          <Text color="gray.500" mt="1">
            Registro inteligente de solicitudes, consulta de políticas,
            simulación de gastos y validación presupuestaria previa.
          </Text>
        </Box>

        <HStack>
          <Button colorPalette="blue">Nueva solicitud</Button>
          <Button variant="outline">Simular gasto</Button>
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
              <Heading size="md">Registro de gastos</Heading>
              <Text fontSize="sm" color="gray.500" mt="1">
                Formulario inteligente para registrar solicitudes de gasto
                conforme a reglas, límites, empresa, área y presupuesto.
              </Text>
            </Box>

            <Badge colorPalette="blue">Entrada del proceso</Badge>
          </Flex>

          <SimpleGrid columns={{ base: 1, md: 3 }} gap="4">
            <ProcessCard
              step="1"
              title="Capturar solicitud"
              description="El usuario ingresa tipo de gasto, área, centro de costo, monto estimado y motivo."
            />

            <ProcessCard
              step="2"
              title="Validar normativa"
              description="El sistema revisa reglas vigentes, límites permitidos y condiciones por empresa."
            />

            <ProcessCard
              step="3"
              title="Verificar fondos"
              description="Se valida disponibilidad presupuestaria antes de enviar a autorización."
            />
          </SimpleGrid>

          <Flex justify="flex-end" mt="5">
            <Button colorPalette="blue">Crear solicitud de gasto</Button>
          </Flex>
        </Box>

        <VStack align="stretch" gap="4">
          <FeatureCard
            title="Consulta de políticas"
            status="Diseño"
            description="Visualizador dinámico de normativas vigentes, límites por tipo de gasto, ciudad, puesto o área."
          />

          <FeatureCard
            title="Simulador de gastos"
            status="Diseño"
            description="Calcula automáticamente el costo estimado antes de registrar formalmente la solicitud."
          />

          <FeatureCard
            title="Verificador de fondos"
            status="Base funcional"
            description="Valida si el centro de costo tiene presupuesto disponible para cubrir la solicitud."
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
            <Heading size="md">Políticas y reglas vigentes</Heading>
            <Text fontSize="sm" color="gray.500">
              Reglas preliminares que condicionan el registro y validación de
              gastos.
            </Text>
          </Box>

          <Button size="sm" variant="outline">
            Administrar políticas
          </Button>
        </Flex>

        <Table.Root size="sm">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>Regla</Table.ColumnHeader>
              <Table.ColumnHeader>Ámbito</Table.ColumnHeader>
              <Table.ColumnHeader>Valor / Límite</Table.ColumnHeader>
              <Table.ColumnHeader>Estado</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {policyRows.map((row) => (
              <Table.Row key={row.rule}>
                <Table.Cell fontWeight="medium">{row.rule}</Table.Cell>
                <Table.Cell>{row.scope}</Table.Cell>
                <Table.Cell>{row.value}</Table.Cell>
                <Table.Cell>
                  <StatusBadge status={row.status} />
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Box>
    </Box>
  );
}

function ProcessCard({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description: string;
}) {
  return (
    <Box
      p="4"
      rounded="lg"
      bg="gray.50"
      border="1px solid"
      borderColor="gray.200"
    >
      <Flex align="center" gap="3" mb="2">
        <Box
          w="28px"
          h="28px"
          rounded="full"
          bg="blue.600"
          color="white"
          display="flex"
          alignItems="center"
          justifyContent="center"
          fontSize="sm"
          fontWeight="bold"
        >
          {step}
        </Box>

        <Text fontWeight="semibold">{title}</Text>
      </Flex>

      <Text fontSize="sm" color="gray.500">
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

        <Badge colorPalette={status === "Base funcional" ? "green" : "gray"}>
          {status}
        </Badge>
      </Flex>
    </Box>
  );
}

function StatusBadge({ status }: { status: string }) {
  const color = status === "Activa" ? "green" : "orange";

  return <Badge colorPalette={color}>{status}</Badge>;
}