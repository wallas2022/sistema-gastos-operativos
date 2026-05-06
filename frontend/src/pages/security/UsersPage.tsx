import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Card,
  Flex,
  Heading,
  HStack,
  Input,
  Spinner,
  Table,
  Text,
  VStack,
} from "@chakra-ui/react";
import { RefreshCw, Search, ShieldCheck, UserRound } from "lucide-react";
import {
  getSecurityUsers,
  SecurityUser,
} from "../../services/security.service";

export default function UsersPage() {
  const [users, setUsers] = useState<SecurityUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  const loadUsers = async () => {
    try {
      setLoading(true);
      const result = await getSecurityUsers();
      setUsers(result);
    } catch (error) {
      console.error("Error cargando usuarios:", error);
      alert("No se pudo cargar el listado de usuarios.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const value = filter.trim().toLowerCase();

    if (!value) {
      return users;
    }

    return users.filter((user) => {
      const rolesText =
        user.roles
          ?.map((item) => `${item.role.code} ${item.role.name}`)
          .join(" ")
          .toLowerCase() ?? "";

      return (
        user.name.toLowerCase().includes(value) ||
        user.email.toLowerCase().includes(value) ||
        user.role.toLowerCase().includes(value) ||
        user.position?.toLowerCase().includes(value) ||
        user.costCenter?.toLowerCase().includes(value) ||
        rolesText.includes(value)
      );
    });
  }, [users, filter]);

  if (loading) {
    return (
      <Flex minH="60vh" align="center" justify="center">
        <VStack gap={3}>
          <Spinner size="lg" />
          <Text color="gray.500">Cargando usuarios...</Text>
        </VStack>
      </Flex>
    );
  }

  return (
    <Box p={6}>
      <Flex justify="space-between" align="center" mb={6} gap={4}>
        <Box>
          <HStack gap={2} mb={1}>
            <UserRound size={22} />
            <Heading size="lg">Usuarios</Heading>
          </HStack>
          <Text color="gray.600">
            Administración y consulta de usuarios registrados en el sistema.
          </Text>
        </Box>

        <Button onClick={loadUsers}>
          <RefreshCw size={16} />
          Actualizar
        </Button>
      </Flex>

      <Card.Root mb={5}>
        <Card.Body>
          <Flex justify="space-between" align="center" gap={4} wrap="wrap">
            <Box>
              <Text fontWeight="semibold">Resumen de usuarios</Text>
              <Text color="gray.500" fontSize="sm">
                Usuarios registrados: {users.length} · Activos:{" "}
                {users.filter((user) => user.active).length} · Inactivos:{" "}
                {users.filter((user) => !user.active).length}
              </Text>
            </Box>

            <HStack maxW="420px" w="full">
              <Search size={18} />
              <Input
                placeholder="Buscar usuario, correo, rol o puesto..."
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
              />
            </HStack>
          </Flex>
        </Card.Body>
      </Card.Root>

      <Card.Root>
        <Card.Body>
          <Flex justify="space-between" align="center" mb={4}>
            <Box>
              <Heading size="md">Listado de usuarios</Heading>
              <Text color="gray.500" fontSize="sm">
                Usuarios visibles según el permiso administrativo del perfil.
              </Text>
            </Box>

            <Badge colorPalette="blue">
              {filteredUsers.length} resultado(s)
            </Badge>
          </Flex>

          <Box overflowX="auto">
            <Table.Root size="sm" variant="outline">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>Usuario</Table.ColumnHeader>
                  <Table.ColumnHeader>Rol base</Table.ColumnHeader>
                  <Table.ColumnHeader>Roles asignados</Table.ColumnHeader>
                  <Table.ColumnHeader>Puesto</Table.ColumnHeader>
                  <Table.ColumnHeader>Centro de costo</Table.ColumnHeader>
                  <Table.ColumnHeader>Estado</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>

              <Table.Body>
                {filteredUsers.map((user) => (
                  <Table.Row key={user.id}>
                    <Table.Cell>
                      <HStack gap={3}>
                        <Flex
                          w="36px"
                          h="36px"
                          rounded="full"
                          bg="blue.50"
                          color="blue.600"
                          align="center"
                          justify="center"
                          fontWeight="bold"
                        >
                          {user.name
                            .split(" ")
                            .map((part) => part[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </Flex>

                        <Box>
                          <Text fontWeight="semibold">{user.name}</Text>
                          <Text fontSize="xs" color="gray.500">
                            {user.email}
                          </Text>
                        </Box>
                      </HStack>
                    </Table.Cell>

                    <Table.Cell>
                      <Badge colorPalette="purple">{user.role}</Badge>
                    </Table.Cell>

                    <Table.Cell>
                      <HStack gap={2} wrap="wrap">
                        {user.roles && user.roles.length > 0 ? (
                          user.roles.map((item) => (
                            <Badge
                              key={item.id}
                              colorPalette="blue"
                              variant="subtle"
                            >
                              <ShieldCheck size={12} />
                              {item.role.name}
                            </Badge>
                          ))
                        ) : (
                          <Badge colorPalette="gray" variant="subtle">
                            Sin rol dinámico
                          </Badge>
                        )}
                      </HStack>
                    </Table.Cell>

                    <Table.Cell>
                      <Text>{user.position ?? "No definido"}</Text>
                    </Table.Cell>

                    <Table.Cell>
                      <Text>{user.costCenter ?? "No definido"}</Text>
                    </Table.Cell>

                    <Table.Cell>
                      {user.active ? (
                        <Badge colorPalette="green">Activo</Badge>
                      ) : (
                        <Badge colorPalette="red">Inactivo</Badge>
                      )}
                    </Table.Cell>
                  </Table.Row>
                ))}

                {filteredUsers.length === 0 && (
                  <Table.Row>
                    <Table.Cell colSpan={6}>
                      <Text textAlign="center" color="gray.500" py={6}>
                        No se encontraron usuarios con el filtro aplicado.
                      </Text>
                    </Table.Cell>
                  </Table.Row>
                )}
              </Table.Body>
            </Table.Root>
          </Box>
        </Card.Body>
      </Card.Root>
    </Box>
  );
}