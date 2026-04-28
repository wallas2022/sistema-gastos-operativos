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
    label: "Empresas configuradas",
    value: "5",
    description: "Entidades activas dentro del sistema",
  },
  {
    label: "Centros de costo",
    value: "42",
    description: "Centros vinculados al presupuesto",
  },
  {
    label: "Roles activos",
    value: "8",
    description: "Perfiles con permisos definidos",
  },
  {
    label: "Cambios auditados",
    value: "126",
    description: "Eventos registrados este mes",
  },
];

const entityRows = [
  {
    company: "Servicios Compartidos",
    country: "Guatemala",
    units: "12",
    status: "Activa",
  },
  {
    company: "Empresa Comercial",
    country: "Guatemala",
    units: "8",
    status: "Activa",
  },
  {
    company: "Operaciones Regionales",
    country: "El Salvador",
    units: "6",
    status: "Activa",
  },
  {
    company: "Unidad Financiera",
    country: "Honduras",
    units: "4",
    status: "Revisión",
  },
];

const roleRows = [
  {
    role: "Administrador",
    scope: "Global",
    permission: "Gestión completa",
    status: "Activo",
  },
  {
    role: "Solicitante",
    scope: "Área asignada",
    permission: "Crear solicitudes",
    status: "Activo",
  },
  {
    role: "Aprobador",
    scope: "Centro de costo",
    permission: "Aprobar o rechazar",
    status: "Activo",
  },
  {
    role: "Revisor OCR",
    scope: "Rendición",
    permission: "Validar comprobantes",
    status: "Activo",
  },
];

const auditRows = [
  {
    action: "Cambio de límite de gasto",
    user: "admin@sistema.com",
    date: "Hoy 10:45",
    status: "Registrado",
  },
  {
    action: "Creación de centro de costo",
    user: "finanzas@sistema.com",
    date: "Hoy 09:20",
    status: "Registrado",
  },
  {
    action: "Asignación de rol",
    user: "seguridad@sistema.com",
    date: "Ayer 16:10",
    status: "Registrado",
  },
];

export function GovernancePage() {
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
          <Heading size="lg">Gobernanza y Configuración de Estructura</Heading>
          <Text color="gray.500" mt="1">
            Administración de empresas, unidades de negocio, centros de costo,
            roles, atribuciones, reglas y auditoría de parámetros críticos.
          </Text>
        </Box>

        <HStack>
          <Button colorPalette="blue">Nueva entidad</Button>
          <Button variant="outline">Configurar reglas</Button>
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
              <Heading size="md">Gestión multi-entidad</Heading>
              <Text fontSize="sm" color="gray.500" mt="1">
                Configuración de empresas, países, unidades de negocio y reglas
                particulares por entidad.
              </Text>
            </Box>

            <Badge colorPalette="blue">Estructura base</Badge>
          </Flex>

          <Table.Root size="sm">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Empresa</Table.ColumnHeader>
                <Table.ColumnHeader>País</Table.ColumnHeader>
                <Table.ColumnHeader>Unidades</Table.ColumnHeader>
                <Table.ColumnHeader>Estado</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>

            <Table.Body>
              {entityRows.map((row) => (
                <Table.Row key={row.company}>
                  <Table.Cell fontWeight="medium">{row.company}</Table.Cell>
                  <Table.Cell>{row.country}</Table.Cell>
                  <Table.Cell>{row.units}</Table.Cell>
                  <Table.Cell>
                    <StatusBadge status={row.status} />
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>

          <Flex justify="flex-end" mt="5">
            <Button colorPalette="blue">Administrar entidades</Button>
          </Flex>
        </Box>

        <VStack align="stretch" gap="4">
          <FeatureCard
            title="Matriz de roles y atribuciones"
            status="Base funcional"
            description="Define quién puede solicitar, aprobar, revisar, conciliar, auditar o administrar cada proceso."
          />

          <FeatureCard
            title="Administrador de centros de costo"
            status="Base técnica"
            description="Vincula presupuestos, departamentos, áreas, cuentas contables y responsables."
          />

          <FeatureCard
            title="Auditoría del sistema"
            status="Diseño"
            description="Registra accesos, cambios de configuración y modificaciones a parámetros críticos."
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
              <Heading size="md">Matriz de roles y atribuciones</Heading>
              <Text fontSize="sm" color="gray.500">
                Vista preliminar de permisos por perfil funcional.
              </Text>
            </Box>

            <Button size="sm" variant="outline">
              Editar matriz
            </Button>
          </Flex>

          <Table.Root size="sm">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Rol</Table.ColumnHeader>
                <Table.ColumnHeader>Ámbito</Table.ColumnHeader>
                <Table.ColumnHeader>Permiso principal</Table.ColumnHeader>
                <Table.ColumnHeader>Estado</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>

            <Table.Body>
              {roleRows.map((row) => (
                <Table.Row key={row.role}>
                  <Table.Cell fontWeight="medium">{row.role}</Table.Cell>
                  <Table.Cell>{row.scope}</Table.Cell>
                  <Table.Cell>{row.permission}</Table.Cell>
                  <Table.Cell>
                    <StatusBadge status={row.status} />
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
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
              <Heading size="md">Auditoría del sistema</Heading>
              <Text fontSize="sm" color="gray.500">
                Últimas modificaciones realizadas sobre parámetros sensibles.
              </Text>
            </Box>

            <Button size="sm" variant="outline">
              Ver auditoría
            </Button>
          </Flex>

          <Table.Root size="sm">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Acción</Table.ColumnHeader>
                <Table.ColumnHeader>Usuario</Table.ColumnHeader>
                <Table.ColumnHeader>Fecha</Table.ColumnHeader>
                <Table.ColumnHeader>Estado</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>

            <Table.Body>
              {auditRows.map((row) => (
                <Table.Row key={`${row.action}-${row.date}`}>
                  <Table.Cell fontWeight="medium">{row.action}</Table.Cell>
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
  const color =
    status === "Base funcional" || status === "Base técnica" ? "green" : "gray";

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
    status === "Activa" ||
    status === "Activo" ||
    status === "Registrado"
      ? "green"
      : status === "Revisión"
        ? "orange"
        : "gray";

  return <Badge colorPalette={color}>{status}</Badge>;
}