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
    label: "Gasto mensual",
    value: "Q 845,000",
    description: "Total ejecutado en el mes actual",
  },
  {
    label: "Promedio aprobación",
    value: "18 h",
    description: "Tiempo promedio del flujo de autorización",
  },
  {
    label: "Liquidaciones cerradas",
    value: "76%",
    description: "Procesos finalizados correctamente",
  },
  {
    label: "Reportes exportados",
    value: "19",
    description: "Exportaciones generadas este mes",
  },
];

const reportRows = [
  {
    report: "Ejecución presupuestaria",
    module: "Control presupuestario",
    frequency: "Mensual",
    status: "Disponible",
  },
  {
    report: "Gasto por área",
    module: "Reportes",
    frequency: "Semanal",
    status: "Disponible",
  },
  {
    report: "Tiempos de aprobación",
    module: "Trazabilidad",
    frequency: "Mensual",
    status: "Disponible",
  },
  {
    report: "Auditoría de accesos",
    module: "Usuarios",
    frequency: "Bajo demanda",
    status: "Diseño",
  },
];

const areaRows = [
  {
    area: "Comercial",
    amount: "Q 285,000",
    percent: 34,
    status: "Alto",
  },
  {
    area: "Operaciones",
    amount: "Q 240,000",
    percent: 28,
    status: "Medio",
  },
  {
    area: "Administración",
    amount: "Q 180,000",
    percent: 21,
    status: "Medio",
  },
  {
    area: "Finanzas",
    amount: "Q 140,000",
    percent: 17,
    status: "Normal",
  },
];

const exportRows = [
  {
    file: "ejecucion_presupuestaria_abril.xlsx",
    user: "finanzas@sistema.com",
    date: "Hoy 11:20",
    status: "Generado",
  },
  {
    file: "liquidaciones_cerradas.pdf",
    user: "auditoria@sistema.com",
    date: "Ayer 15:05",
    status: "Generado",
  },
  {
    file: "bitacora_accesos.csv",
    user: "seguridad@sistema.com",
    date: "Ayer 10:30",
    status: "Generado",
  },
];

export function ReportsAnalyticsPage() {
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
          <Heading size="lg">Reportes y Analítica</Heading>
          <Text color="gray.500" mt="1">
            Dashboards ejecutivos, indicadores clave, análisis de gasto,
            ejecución presupuestaria, tiempos de aprobación y exportaciones para
            auditoría.
          </Text>
        </Box>

        <HStack>
          <Button colorPalette="blue">Generar reporte</Button>
          <Button variant="outline">Exportar datos</Button>
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
              <Heading size="md">Dashboards ejecutivos</Heading>
              <Text fontSize="sm" color="gray.500" mt="1">
                Consolida indicadores clave para la toma de decisiones
                financieras y operativas.
              </Text>
            </Box>

            <Badge colorPalette="blue">KPIs estratégicos</Badge>
          </Flex>

          <SimpleGrid columns={{ base: 1, md: 3 }} gap="4">
            <MetricCard
              title="Ejecución presupuestaria"
              value="67%"
              description="Avance del presupuesto anual"
              status="Normal"
            />

            <MetricCard
              title="Liquidaciones cerradas"
              value="76%"
              description="Cierres completados en tiempo"
              status="Medio"
            />

            <MetricCard
              title="Solicitudes aprobadas"
              value="82%"
              description="Procesos autorizados sin rechazo"
              status="Normal"
            />
          </SimpleGrid>

          <Flex justify="flex-end" mt="5">
            <Button colorPalette="blue">Ver dashboard ejecutivo</Button>
          </Flex>
        </Box>

        <VStack align="stretch" gap="4">
          <FeatureCard
            title="Gasto por área, proyecto y período"
            status="Diseño"
            description="Permite segmentar el gasto operativo por estructura organizativa y temporalidad."
          />

          <FeatureCard
            title="Tiempos promedio de aprobación"
            status="Base analítica"
            description="Mide cuánto tarda cada etapa del flujo desde la solicitud hasta la aprobación."
          />

          <FeatureCard
            title="Exportación para auditoría"
            status="Base técnica"
            description="Genera archivos en PDF, Excel o CSV para auditoría interna y externa."
          />
        </VStack>
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, xl: 2 }} gap="4" mb="6">
        <Box
          bg="white"
          p="5"
          rounded="xl"
          border="1px solid"
          borderColor="gray.200"
        >
          <Flex justify="space-between" align="center" mb="4">
            <Box>
              <Heading size="md">Gasto por área</Heading>
              <Text fontSize="sm" color="gray.500">
                Distribución mensual del gasto operativo por área funcional.
              </Text>
            </Box>

            <Button size="sm" variant="outline">
              Filtrar
            </Button>
          </Flex>

          <VStack align="stretch" gap="4">
            {areaRows.map((row) => (
              <AreaExpenseCard
                key={row.area}
                area={row.area}
                amount={row.amount}
                percent={row.percent}
                status={row.status}
              />
            ))}
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
              <Heading size="md">Reportes disponibles</Heading>
              <Text fontSize="sm" color="gray.500">
                Catálogo inicial de reportes operativos, financieros y de
                auditoría.
              </Text>
            </Box>

            <Button size="sm" variant="outline">
              Administrar
            </Button>
          </Flex>

          <Table.Root size="sm">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Reporte</Table.ColumnHeader>
                <Table.ColumnHeader>Módulo</Table.ColumnHeader>
                <Table.ColumnHeader>Frecuencia</Table.ColumnHeader>
                <Table.ColumnHeader>Estado</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>

            <Table.Body>
              {reportRows.map((row) => (
                <Table.Row key={row.report}>
                  <Table.Cell fontWeight="medium">{row.report}</Table.Cell>
                  <Table.Cell>{row.module}</Table.Cell>
                  <Table.Cell>{row.frequency}</Table.Cell>
                  <Table.Cell>
                    <StatusBadge status={row.status} />
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Box>
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
            <Heading size="md">Exportaciones recientes</Heading>
            <Text fontSize="sm" color="gray.500">
              Historial de archivos generados para análisis, gerencia o
              auditoría.
            </Text>
          </Box>

          <Button size="sm" variant="outline">
            Ver historial
          </Button>
        </Flex>

        <Table.Root size="sm">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>Archivo</Table.ColumnHeader>
              <Table.ColumnHeader>Usuario</Table.ColumnHeader>
              <Table.ColumnHeader>Fecha</Table.ColumnHeader>
              <Table.ColumnHeader>Estado</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {exportRows.map((row) => (
              <Table.Row key={row.file}>
                <Table.Cell fontWeight="medium">{row.file}</Table.Cell>
                <Table.Cell>{row.user}</Table.Cell>
                <Table.Cell>{row.date}</Table.Cell>
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

function MetricCard({
  title,
  value,
  description,
  status,
}: {
  title: string;
  value: string;
  description: string;
  status: string;
}) {
  const progressValue = Number(value.replace("%", ""));

  return (
    <Box
      p="4"
      rounded="lg"
      bg="gray.50"
      border="1px solid"
      borderColor="gray.200"
    >
      <Flex justify="space-between" align="center" mb="2">
        <Text fontWeight="semibold">{title}</Text>
        <StatusBadge status={status} />
      </Flex>

      <Text fontSize="2xl" fontWeight="bold">
        {value}
      </Text>

      <Text fontSize="sm" color="gray.500" mb="3">
        {description}
      </Text>

      <Progress.Root value={progressValue} size="sm">
        <Progress.Track>
          <Progress.Range />
        </Progress.Track>
      </Progress.Root>
    </Box>
  );
}

function AreaExpenseCard({
  area,
  amount,
  percent,
  status,
}: {
  area: string;
  amount: string;
  percent: number;
  status: string;
}) {
  return (
    <Box p="4" rounded="lg" bg="gray.50" border="1px solid" borderColor="gray.200">
      <Flex justify="space-between" align="center" mb="2">
        <Box>
          <Text fontWeight="semibold">{area}</Text>
          <Text fontSize="sm" color="gray.500">
            {amount}
          </Text>
        </Box>

        <StatusBadge status={status} />
      </Flex>

      <Progress.Root value={percent} size="sm">
        <Progress.Track>
          <Progress.Range />
        </Progress.Track>
      </Progress.Root>

      <Text fontSize="xs" color="gray.500" mt="2">
        Participación mensual: {percent}%
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
  const color =
    status === "Base analítica" || status === "Base técnica" ? "green" : "gray";

  return (
    <Box bg="white" p="5" rounded="xl" border="1px solid" borderColor="gray.200">
      <Flex justify="space-between" align="flex-start" gap="3">
        <Box>
          <Text fontWeight="semibold">{title}</Text>
          <Text fontSize="sm" color="gray.500" mt="2">
            {description}
          </Text>
        </Box>

        <Badge colorPalette={color}>{status}</Badge>
      </Flex>
    </Box>
  );
}

function StatusBadge({ status }: { status: string }) {
  const color =
    status === "Normal" ||
    status === "Disponible" ||
    status === "Generado"
      ? "green"
      : status === "Alto"
        ? "red"
        : status === "Medio"
          ? "orange"
          : status === "Diseño"
            ? "gray"
            : "blue";

  return <Badge colorPalette={color}>{status}</Badge>;
}