import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Card,
  Checkbox,
  CloseButton,
  Dialog,
  Flex,
  Heading,
  HStack,
  Input,
  Portal,
  Spinner,
  Table,
  Text,
  VStack,
} from "@chakra-ui/react";
import { RefreshCw, Search, ShieldCheck, UserCog, UserRound } from "lucide-react";
import {
  getSecurityUsers,
  SecurityUser,
  assignRoleToUser,
  getSecurityRoles,
  removeRoleFromUser,
  SecurityRole,
} from "../../services/security.service";

export default function UsersPage() {
  const [users, setUsers] = useState<SecurityUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [roles, setRoles] = useState<SecurityRole[]>([]);
  const [selectedUser, setSelectedUser] = useState<SecurityUser | null>(null);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [savingRoles, setSavingRoles] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  

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

const loadRoles = async () => {
  try {
    const result = await getSecurityRoles();
    setRoles(result);
  } catch (error) {
    console.error("Error cargando roles:", error);
    alert("No se pudo cargar el listado de roles.");
  }
};

  useEffect(() => {
    loadUsers();
    loadRoles();
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


  const openRoleModal = (user: SecurityUser) => {
  setSelectedUser(user);

  const currentRoleIds =
    user.roles?.map((item) => item.role.id) ?? [];

  setSelectedRoleIds(currentRoleIds);
  setIsRoleModalOpen(true);
};

const toggleRole = (roleId: string) => {
  setSelectedRoleIds((current) => {
    if (current.includes(roleId)) {
      return current.filter((id) => id !== roleId);
    }

    return [...current, roleId];
  });
};

const saveUserRoles = async () => {
  if (!selectedUser) return;

  try {
    setSavingRoles(true);

    const currentRoleIds =
      selectedUser.roles?.map((item) => item.role.id) ?? [];

    const rolesToAdd = selectedRoleIds.filter(
      (roleId) => !currentRoleIds.includes(roleId)
    );

    const rolesToRemove = currentRoleIds.filter(
      (roleId) => !selectedRoleIds.includes(roleId)
    );

    for (const roleId of rolesToAdd) {
      await assignRoleToUser(selectedUser.id, roleId);
    }

    for (const roleId of rolesToRemove) {
      await removeRoleFromUser(selectedUser.id, roleId);
    }

    await loadUsers();

    setIsRoleModalOpen(false);
    setSelectedUser(null);
    setSelectedRoleIds([]);

    alert("Roles del usuario actualizados correctamente.");
  } catch (error) {
    console.error("Error guardando roles del usuario:", error);
    alert("No se pudieron actualizar los roles del usuario.");
  } finally {
    setSavingRoles(false);
  }
};

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
                  <Table.ColumnHeader>Acciones</Table.ColumnHeader>
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
                    <Table.Cell>
                        <Button size="sm" variant="outline" onClick={() => openRoleModal(user)}>
                          <UserCog size={15} />
                          Gestionar roles
                        </Button>
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

      <Dialog.Root
  open={isRoleModalOpen}
  onOpenChange={(details) => {
    setIsRoleModalOpen(details.open);

    if (!details.open) {
      setSelectedUser(null);
      setSelectedRoleIds([]);
    }
  }}
>
  <Portal>
    <Dialog.Backdrop />
    <Dialog.Positioner>
      <Dialog.Content maxW="560px">
        <Dialog.Header>
          <Dialog.Title>Gestionar roles del usuario</Dialog.Title>
          <Dialog.CloseTrigger asChild>
            <CloseButton size="sm" />
          </Dialog.CloseTrigger>
        </Dialog.Header>

        <Dialog.Body>
          {selectedUser && (
            <VStack align="stretch" gap={5}>
              <Card.Root variant="outline">
                <Card.Body>
                  <HStack gap={3}>
                    <Flex
                      w="44px"
                      h="44px"
                      rounded="full"
                      bg="blue.50"
                      color="blue.600"
                      align="center"
                      justify="center"
                      fontWeight="bold"
                    >
                      {selectedUser.name
                        .split(" ")
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </Flex>

                    <Box>
                      <Text fontWeight="bold">{selectedUser.name}</Text>
                      <Text fontSize="sm" color="gray.500">
                        {selectedUser.email}
                      </Text>
                      <Text fontSize="sm" color="gray.500">
                        {selectedUser.position ?? "Puesto no definido"}
                      </Text>
                    </Box>
                  </HStack>
                </Card.Body>
              </Card.Root>

              <Box>
                <Text fontWeight="semibold" mb={2}>
                  Roles disponibles
                </Text>

                <VStack align="stretch" gap={2}>
                  {roles.map((role) => {
                    const checked = selectedRoleIds.includes(role.id);

                    return (
                      <Flex
                        key={role.id}
                        align="center"
                        justify="space-between"
                        borderWidth="1px"
                        rounded="lg"
                        px={4}
                        py={3}
                      >
                        <Box>
                          <HStack gap={2}>
                            <ShieldCheck size={16} />
                            <Text fontWeight="semibold">{role.name}</Text>
                            <Badge colorPalette={role.active ? "green" : "red"}>
                              {role.active ? "Activo" : "Inactivo"}
                            </Badge>
                          </HStack>

                          <Text fontSize="xs" color="gray.500" mt={1}>
                            {role.code}
                          </Text>

                          {role.description && (
                            <Text fontSize="sm" color="gray.600" mt={1}>
                              {role.description}
                            </Text>
                          )}
                        </Box>

                        <Checkbox.Root
                          checked={checked}
                          onCheckedChange={() => toggleRole(role.id)}
                          disabled={!role.active}
                        >
                          <Checkbox.HiddenInput />
                          <Checkbox.Control />
                        </Checkbox.Root>
                      </Flex>
                    );
                  })}

                  {roles.length === 0 && (
                    <Text color="gray.500" fontSize="sm">
                      No hay roles registrados.
                    </Text>
                  )}
                </VStack>
              </Box>
            </VStack>
          )}
        </Dialog.Body>

        <Dialog.Footer>
          <Button
            variant="outline"
            onClick={() => setIsRoleModalOpen(false)}
            disabled={savingRoles}
          >
            Cancelar
          </Button>

          <Button onClick={saveUserRoles} loading={savingRoles}>
            Guardar cambios
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Positioner>
  </Portal>
</Dialog.Root>
    </Box>
  );
}