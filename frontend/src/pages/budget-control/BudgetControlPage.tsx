import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Progress,
  SimpleGrid,
  Table,
  Text,
  VStack,
} from "@chakra-ui/react";

const kpis = [
  {
    label: "Presupuesto anual",
    value: "Q 10,000,000",
    description: "Presupuesto asignado para el período",
  },
  {
    label: "Ejecutado",
    value: "Q 6,700,000",
    description: "67% del presupuesto anual",
  },
  {
    label: "Disponible",
    value: "Q 3,300,000",
    description: "Saldo presupuestario restante",
  },
  {
    label: "Desvíos detectados",
    value: "5",
    description: "Centros de costo con riesgo presupuestario",
  },
];

const budgetRows = [
  {
    area: "Administración",
    projected: "Q 1,200,000",
    executed: "Q 875,000",
    percent: 73,
    status: "Normal",
  },
  {
    area: "Operaciones",
    projected: "Q 2,500,000",
    executed: "Q 2,120,000",
    percent: 85,
    status: "Alerta",
  },
  {
    area: "Comercial",
    projected: "Q 1,800,000",
    executed: "Q 1,710,000",
    percent: 95,
    status: "Crítico",
  },
  {
    area: "Finanzas",
    projected: "Q 950,000",
    executed: "Q 510,000",
    percent: 54,
    status: "Normal",
  },
];

const apiRows = [
  {
    service: "Sistema externo de pagos",
    lastSync: "Hoy 09:30",
    status: "Activo",
  },
  {
    service: "Presupuesto ERP",
    lastSync: "Hoy 08:15",
    status: "Activo",
  },
  {
    service: "Repositorio documental",
    lastSync: "Ayer 18:40",
    status: "Revisión",
  },
];

export function BudgetControlPage() {
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
          <Heading size="lg">
            Control Presupuestario e Inteligencia de Negocio
          </Heading>
          <Text color="gray.500" mt="1">
            Monitoreo del presupuesto proyectado, ejecutado, disponible,
            histórico, interoperabilidad y alertas de desviación.
          </Text>
        </Box>

        <HStack>
          <Button colorPalette="blue">Actualizar presupuesto</Button>
          <Button variant="outline">Exportar reporte</Button>
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
              <Heading size="md">Monitor de ejecución</Heading>
              <Text fontSize="sm" color="gray.500" mt="1">
                Comparación del presupuesto proyectado contra el gasto ejecutado
                por área o centro de costo.
              </Text>
            </Box>

            <Badge colorPalette="blue">Actual vs proyectado</Badge>
          </Flex>

          <Table.Root size="sm">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Área</Table.ColumnHeader>
                <Table.ColumnHeader>Proyectado</Table.ColumnHeader>
                <Table.ColumnHeader>Ejecutado</Table.ColumnHeader>
                <Table.ColumnHeader>Avance</Table.ColumnHeader>
                <Table.ColumnHeader>Estado</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>

            <Table.Body>
              {budgetRows.map((row) => (
                <Table.Row key={row.area}>
                  <Table.Cell fontWeight="medium">{row.area}</Table.Cell>
                  <Table.Cell>{row.projected}</Table.Cell>
                  <Table.Cell>{row.executed}</Table.Cell>
                  <Table.Cell minW="150px">
                    <Flex align="center" gap="3">
                      <Box flex="1">
                        <Progress.Root value={row.percent} size="sm">
                          <Progress.Track>
                            <Progress.Range />
                          </Progress.Track>
                        </Progress.Root>
                      </Box>
                      <Text fontSize="sm">{row.percent}%</Text>
                    </Flex>
                  </Table.Cell>
                  <Table.Cell>
                    <StatusBadge status={row.status} />
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>

          <Flex justify="flex-end" mt="5">
            <Button colorPalette="blue">Ver detalle presupuestario</Button>
          </Flex>
        </Box>

        <VStack align="stretch" gap="4">
          <FeatureCard
            title="Análisis histórico comparativo"
            status="Diseño"
            description="Compara visualmente el comportamiento del gasto contra períodos anteriores."
          />

          <FeatureCard
            title="Gestor de interoperabilidad"
            status="Base técnica"
            description="Panel para monitorear comunicación API con sistemas externos de pagos, presupuesto y documentos."
          />

          <FeatureCard
            title="Proyección de desvíos"
            status="Diseño"
            description="Algoritmo que alerta cuando el ritmo de gasto puede superar el presupuesto mensual."
          />
        </VStack>
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, xl: 2 }} gap="4">
        <Box
          bg="white"
          p="5"
          rounded="xl"
          border="1px solid"
          borderColor="gray.200"
        >
          <Flex justify="space-between" align="center" mb="4">
            <Box>
              <Heading size="md">Proyección de desvíos</Heading>
              <Text fontSize="sm" color="gray.500">
                Vista preliminar de riesgo presupuestario por área.
              </Text>
            </Box>

            <Badge colorPalette="orange">5 alertas</Badge>
          </Flex>

          <VStack align="stretch" gap="4">
            <DeviationCard
              area="Comercial"
              message="El ritmo de gasto podría superar el presupuesto mensual."
              risk="Alto"
              percent={95}
            />

            <DeviationCard
              area="Operaciones"
              message="Ejecución elevada con tendencia a desvío en cierre de mes."
              risk="Medio"
              percent={85}
            />

            <DeviationCard
              area="Administración"
              message="Ejecución dentro del rango permitido."
              risk="Bajo"
              percent={73}
            />
          </VStack>
        </Box>

        <Box
          bg="white"
          p="5"
          rounded="xl"
          border="1px solid"
          borderColor="gray.200"
        >
          <Flex justify="space-between" align="center" mb="4">
            <Box>
              <Heading size="md">Gestor de interoperabilidad API</Heading>
              <Text fontSize="sm" color="gray.500">
                Estado de comunicación con sistemas externos.
              </Text>
            </Box>

            <Button size="sm" variant="outline">
              Ver logs
            </Button>
          </Flex>

          <Table.Root size="sm">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Servicio</Table.ColumnHeader>
                <Table.ColumnHeader>Última sincronización</Table.ColumnHeader>
                <Table.ColumnHeader>Estado</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>

            <Table.Body>
              {apiRows.map((row) => (
                <Table.Row key={row.service}>
                  <Table.Cell fontWeight="medium">{row.service}</Table.Cell>
                  <Table.Cell>{row.lastSync}</Table.Cell>
                  <Table.Cell>
                    <StatusBadge status={row.status} />
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Box>
      </SimpleGrid>
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

        <Badge colorPalette={status === "Base técnica" ? "green" : "gray"}>
          {status}
        </Badge>
      </Flex>
    </Box>
  );
}

function DeviationCard({
  area,
  message,
  risk,
  percent,
}: {
  area: string;
  message: string;
  risk: string;
  percent: number;
}) {
  const color =
    risk === "Alto" ? "red" : risk === "Medio" ? "orange" : "green";

  return (
    <Box p="4" rounded="lg" bg="gray.50" border="1px solid" borderColor="gray.200">
      <Flex justify="space-between" align="center" mb="2">
        <Text fontWeight="semibold">{area}</Text>
        <Badge colorPalette={color}>{risk}</Badge>
      </Flex>

      <Text fontSize="sm" color="gray.500" mb="3">
        {message}
      </Text>

      <Progress.Root value={percent} size="sm">
        <Progress.Track>
          <Progress.Range />
        </Progress.Track>
      </Progress.Root>

      <Text fontSize="xs" color="gray.500" mt="2">
        Ejecución actual: {percent}%
      </Text>
    </Box>
  );
}

function StatusBadge({ status }: { status: string }) {
  const color =
    status === "Activo" || status === "Normal"
      ? "green"
      : status === "Crítico"
        ? "red"
        : status === "Alerta" || status === "Revisión"
          ? "orange"
          : "gray";

  return <Badge colorPalette={color}>{status}</Badge>;
}