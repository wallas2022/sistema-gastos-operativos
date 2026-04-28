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
    label: "Usuarios activos",
    value: "86",
    description: "Usuarios con acceso habilitado",
  },
  {
    label: "Roles configurados",
    value: "8",
    description: "Perfiles funcionales del sistema",
  },
  {
    label: "Delegaciones vigentes",
    value: "4",
    description: "Permisos temporales activos",
  },
  {
    label: "Accesos auditados",
    value: "214",
    description: "Eventos registrados este mes",
  },
];

const userRows = [
  {
    name: "Juan Pérez",
    email: "juan.perez@empresa.com",
    role: "Solicitante",
    area: "Comercial",
    status: "Activo",
  },
  {
    name: "María López",
    email: "maria.lopez@empresa.com",
    role: "Aprobador",
    area: "Operaciones",
    status: "Activo",
  },
  {
    name: "Carlos Méndez",
    email: "carlos.mendez@empresa.com",
    role: "Revisor OCR",
    area: "Finanzas",
    status: "Activo",
  },
  {
    name: "Ana Gómez",
    email: "ana.gomez@empresa.com",
    role: "Administrador",
    area: "Tecnología",
    status: "Bloqueado",
  },
];

const accessRows = [
  {
    event: "Inicio de sesión",
    user: "juan.perez@empresa.com",
    module: "Dashboard",
    date: "Hoy 08:15",
    status: "Correcto",
  },
  {
    event: "Consulta de documentos OCR",
    user: "carlos.mendez@empresa.com",
    module: "Rendición",
    date: "Hoy 09:40",
    status: "Correcto",
  },
  {
    event: "Intento fallido",
    user: "ana.gomez@empresa.com",
    module: "Login",
    date: "Hoy 10:05",
    status: "Alerta",
  },
];

const delegationRows = [
  {
    owner: "Gerente Comercial",
    delegate: "Jefe Comercial",
    scope: "Aprobaciones",
    period: "01/05/2026 - 15/05/2026",
    status: "Vigente",
  },
  {
    owner: "Gerente Financiero",
    delegate: "Analista Senior",
    scope: "Revisión financiera",
    period: "03/05/2026 - 10/05/2026",
    status: "Vigente",
  },
];

export function UsersAccessPage() {
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
          <Heading size="lg">Usuarios y Control de Accesos</Heading>
          <Text color="gray.500" mt="1">
            Administración de usuarios, roles, permisos, delegaciones temporales,
            accesos por estructura organizativa y bitácora de seguridad.
          </Text>
        </Box>

        <HStack>
          <Button colorPalette="blue">Nuevo usuario</Button>
          <Button variant="outline">Crear delegación</Button>
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
              <Heading size="md">Administración de usuarios</Heading>
              <Text fontSize="sm" color="gray.500" mt="1">
                Gestión de usuarios internos, perfiles funcionales y acceso por
                área, empresa o unidad de negocio.
              </Text>
            </Box>

            <Badge colorPalette="blue">Transversal</Badge>
          </Flex>

          <Table.Root size="sm">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Usuario</Table.ColumnHeader>
                <Table.ColumnHeader>Correo</Table.ColumnHeader>
                <Table.ColumnHeader>Rol</Table.ColumnHeader>
                <Table.ColumnHeader>Área</Table.ColumnHeader>
                <Table.ColumnHeader>Estado</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>

            <Table.Body>
              {userRows.map((row) => (
                <Table.Row key={row.email}>
                  <Table.Cell fontWeight="medium">{row.name}</Table.Cell>
                  <Table.Cell>{row.email}</Table.Cell>
                  <Table.Cell>{row.role}</Table.Cell>
                  <Table.Cell>{row.area}</Table.Cell>
                  <Table.Cell>
                    <StatusBadge status={row.status} />
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>

          <Flex justify="flex-end" mt="5">
            <Button colorPalette="blue">Administrar usuarios</Button>
          </Flex>
        </Box>

        <VStack align="stretch" gap="4">
          <FeatureCard
            title="Roles y permisos"
            status="Base funcional"
            description="Define permisos por módulo, acción, empresa, área y centro de costo."
          />

          <FeatureCard
            title="Delegaciones temporales"
            status="Diseño"
            description="Permite trasladar permisos de aprobación o revisión durante ausencias programadas."
          />

          <FeatureCard
            title="Control por estructura"
            status="Base técnica"
            description="Limita la visibilidad de información según unidad de negocio, área o centro de costo."
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
              <Heading size="md">Delegaciones temporales</Heading>
              <Text fontSize="sm" color="gray.500">
                Asignación temporal de responsabilidades para continuidad
                operativa.
              </Text>
            </Box>

            <Button size="sm" variant="outline">
              Ver delegaciones
            </Button>
          </Flex>

          <Table.Root size="sm">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Titular</Table.ColumnHeader>
                <Table.ColumnHeader>Delegado</Table.ColumnHeader>
                <Table.ColumnHeader>Ámbito</Table.ColumnHeader>
                <Table.ColumnHeader>Período</Table.ColumnHeader>
                <Table.ColumnHeader>Estado</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>

            <Table.Body>
              {delegationRows.map((row) => (
                <Table.Row key={`${row.owner}-${row.delegate}`}>
                  <Table.Cell fontWeight="medium">{row.owner}</Table.Cell>
                  <Table.Cell>{row.delegate}</Table.Cell>
                  <Table.Cell>{row.scope}</Table.Cell>
                  <Table.Cell>{row.period}</Table.Cell>
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
              <Heading size="md">Bitácora de accesos</Heading>
              <Text fontSize="sm" color="gray.500">
                Registro de ingresos, consultas y eventos sensibles del sistema.
              </Text>
            </Box>

            <Button size="sm" variant="outline">
              Exportar
            </Button>
          </Flex>

          <Table.Root size="sm">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Evento</Table.ColumnHeader>
                <Table.ColumnHeader>Usuario</Table.ColumnHeader>
                <Table.ColumnHeader>Módulo</Table.ColumnHeader>
                <Table.ColumnHeader>Fecha</Table.ColumnHeader>
                <Table.ColumnHeader>Estado</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>

            <Table.Body>
              {accessRows.map((row) => (
                <Table.Row key={`${row.event}-${row.date}`}>
                  <Table.Cell fontWeight="medium">{row.event}</Table.Cell>
                  <Table.Cell>{row.user}</Table.Cell>
                  <Table.Cell>{row.module}</Table.Cell>
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
    status === "Activo" ||
    status === "Correcto" ||
    status === "Vigente"
      ? "green"
      : status === "Alerta"
        ? "orange"
        : status === "Bloqueado"
          ? "red"
          : "gray";

  return <Badge colorPalette={color}>{status}</Badge>;
}