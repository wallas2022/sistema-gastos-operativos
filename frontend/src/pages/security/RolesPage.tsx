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
import {
  CheckCircle,
  KeyRound,
  RefreshCw,
  Search,
  ShieldCheck,
} from "lucide-react";
import {
  assignPermissionToRole,
  createSecurityRole,
  getSecurityPermissions,
  getSecurityRoles,
  removePermissionFromRole,
  SecurityPermission,
  SecurityRole,
  updateSecurityRole,
} from "../../services/security.service";

export default function RolesPage() {
  const [roles, setRoles] = useState<SecurityRole[]>([]);
  const [permissions, setPermissions] = useState<SecurityPermission[]>([]);
  const [selectedRole, setSelectedRole] = useState<SecurityRole | null>(null);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>(
    []
  );
  const [isRoleFormOpen, setIsRoleFormOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<SecurityRole | null>(null);
    const [roleForm, setRoleForm] = useState({
    code: "",
    name: "",
    description: "",
    active: true,
    });
    const [savingRole, setSavingRole] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [filter, setFilter] = useState("");
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);

  const loadRoles = async () => {
    try {
      setLoading(true);
     const result = await getSecurityRoles();

const rolesResult = Array.isArray(result)
  ? result
  : Array.isArray((result as { roles?: SecurityRole[] }).roles)
    ? (result as { roles: SecurityRole[] }).roles
    : [];

setRoles(rolesResult);
    } catch (error) {
      console.error("Error cargando roles:", error);
      alert("No se pudo cargar el listado de roles.");
    } finally {
      setLoading(false);
    }
  };

  const loadPermissions = async () => {
    try {
     const result = await getSecurityPermissions();

const permissionsResult = Array.isArray(result)
  ? result
  : Array.isArray((result as { permissions?: SecurityPermission[] }).permissions)
    ? (result as { permissions: SecurityPermission[] }).permissions
    : [];

setPermissions(permissionsResult);
    } catch (error) {
      console.error("Error cargando permisos:", error);
      alert("No se pudo cargar el listado de permisos.");
    }
  };

  useEffect(() => {
    loadRoles();
    loadPermissions();
  }, []);

  const filteredRoles = useMemo(() => {
    const value = filter.trim().toLowerCase();

    if (!value) {
      return roles;
    }

    return roles.filter((role) => {
      return (
        role.code.toLowerCase().includes(value) ||
        role.name.toLowerCase().includes(value) ||
        role.description?.toLowerCase().includes(value)
      );
    });
  }, [roles, filter]);

  const groupedPermissions = useMemo(() => {
    const groups = permissions.reduce<Record<string, SecurityPermission[]>>(
      (acc, permission) => {
        if (!acc[permission.module]) {
          acc[permission.module] = [];
        }

        acc[permission.module].push(permission);
        return acc;
      },
      {}
    );

    return Object.entries(groups).map(([module, permissions]) => ({
      module,
      permissions,
    }));
  }, [permissions]);

  const openPermissionModal = (role: SecurityRole) => {
    setSelectedRole(role);

    const currentPermissionIds =
      role.permissions?.map((item) => item.permission.id) ?? [];

    setSelectedPermissionIds(currentPermissionIds);
    setIsPermissionModalOpen(true);
  };

  const togglePermission = (permissionId: string) => {
    setSelectedPermissionIds((current) => {
      if (current.includes(permissionId)) {
        return current.filter((id) => id !== permissionId);
      }

      return [...current, permissionId];
    });
  };

  const saveRolePermissions = async () => {
    if (!selectedRole) return;

    try {
      setSavingPermissions(true);

      const currentPermissionIds =
        selectedRole.permissions?.map((item) => item.permission.id) ?? [];

      const permissionsToAdd = selectedPermissionIds.filter(
        (permissionId) => !currentPermissionIds.includes(permissionId)
      );

      const permissionsToRemove = currentPermissionIds.filter(
        (permissionId) => !selectedPermissionIds.includes(permissionId)
      );

      for (const permissionId of permissionsToAdd) {
        await assignPermissionToRole(selectedRole.id, permissionId);
      }

      for (const permissionId of permissionsToRemove) {
        await removePermissionFromRole(selectedRole.id, permissionId);
      }

      await loadRoles();

      setIsPermissionModalOpen(false);
      setSelectedRole(null);
      setSelectedPermissionIds([]);

      alert("Permisos del rol actualizados correctamente.");
    } catch (error) {
      console.error("Error guardando permisos del rol:", error);
      alert("No se pudieron actualizar los permisos del rol.");
    } finally {
      setSavingPermissions(false);
    }
  };

  const openCreateRoleModal = () => {
  setEditingRole(null);
  setRoleForm({
    code: "",
    name: "",
    description: "",
    active: true,
  });
  setIsRoleFormOpen(true);
};

const openEditRoleModal = (role: SecurityRole) => {
  setEditingRole(role);
  setRoleForm({
    code: role.code,
    name: role.name,
    description: role.description ?? "",
    active: role.active,
  });
  setIsRoleFormOpen(true);
};

const saveRole = async () => {
  try {
    if (!roleForm.code.trim()) {
      alert("El código del rol es obligatorio.");
      return;
    }

    if (!roleForm.name.trim()) {
      alert("El nombre del rol es obligatorio.");
      return;
    }

    setSavingRole(true);

    if (editingRole) {
      await updateSecurityRole(editingRole.id, {
        name: roleForm.name.trim(),
        description: roleForm.description.trim() || undefined,
        active: roleForm.active,
      });

      alert("Rol actualizado correctamente.");
    } else {
      await createSecurityRole({
        code: roleForm.code.trim().toUpperCase(),
        name: roleForm.name.trim(),
        description: roleForm.description.trim() || undefined,
      });

      alert("Rol creado correctamente.");
    }

    await loadRoles();

    setIsRoleFormOpen(false);
    setEditingRole(null);
  } catch (error) {
    console.error("Error guardando rol:", error);
    alert("No se pudo guardar el rol.");
  } finally {
    setSavingRole(false);
  }
};
    


  if (loading) {
    return (
      <Flex minH="60vh" align="center" justify="center">
        <VStack gap={3}>
          <Spinner size="lg" />
          <Text color="gray.500">Cargando roles...</Text>
        </VStack>
      </Flex>
    );
  }

  return (
    <Box p={6}>
      <Flex justify="space-between" align="center" mb={6} gap={4}>
        <Box>
          <HStack gap={2} mb={1}>
            <ShieldCheck size={22} />
            <Heading size="lg">Roles</Heading>
          </HStack>
          <Text color="gray.600">
            Administración de roles funcionales y permisos asociados.
          </Text>
        </Box>

            <Button onClick={loadRoles}>
             <RefreshCw size={16} />
                Actualizar
        </Button>

         <Button onClick={openCreateRoleModal}>
            Nuevo rol
        </Button>
      </Flex>

      <Card.Root mb={5}>
        <Card.Body>
          <Flex justify="space-between" align="center" gap={4} wrap="wrap">
            <Box>
              <Text fontWeight="semibold">Resumen de roles</Text>
              <Text color="gray.500" fontSize="sm">
                Roles registrados: {roles.length} · Activos:{" "}
                {roles.filter((role) => role.active).length} · Permisos
                disponibles: {permissions.length}
              </Text>
            </Box>

            <HStack maxW="420px" w="full">
              <Search size={18} />
              <Input
                placeholder="Buscar rol, código o descripción..."
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
              <Heading size="md">Listado de roles</Heading>
              <Text color="gray.500" fontSize="sm">
                Cada rol puede tener múltiples permisos asignados.
              </Text>
            </Box>

            <Badge colorPalette="blue">
              {filteredRoles.length} resultado(s)
            </Badge>
          </Flex>

          <Box overflowX="auto">
            <Table.Root size="sm" variant="outline">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>Rol</Table.ColumnHeader>
                  <Table.ColumnHeader>Descripción</Table.ColumnHeader>
                  <Table.ColumnHeader>Permisos</Table.ColumnHeader>
                  <Table.ColumnHeader>Usuarios</Table.ColumnHeader>
                  <Table.ColumnHeader>Estado</Table.ColumnHeader>
                  <Table.ColumnHeader>Acciones</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>

              <Table.Body>
                {filteredRoles.map((role) => (
                  <Table.Row key={role.id}>
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
                        >
                          <ShieldCheck size={18} />
                        </Flex>

                        <Box>
                          <Text fontWeight="semibold">{role.name}</Text>
                          <Text fontSize="xs" color="gray.500">
                            {role.code}
                          </Text>
                        </Box>
                      </HStack>
                    </Table.Cell>

                    <Table.Cell>
                      <Text>{role.description ?? "Sin descripción"}</Text>
                    </Table.Cell>

                    <Table.Cell>
                      <Badge colorPalette="purple">
                        {role.permissions?.length ?? 0} permiso(s)
                      </Badge>
                    </Table.Cell>

                    <Table.Cell>
                      <Badge colorPalette="blue" variant="subtle">
                        {role.users?.length ?? 0} usuario(s)
                      </Badge>
                    </Table.Cell>

                    <Table.Cell>
                      {role.active ? (
                        <Badge colorPalette="green">Activo</Badge>
                      ) : (
                        <Badge colorPalette="red">Inactivo</Badge>
                      )}
                    </Table.Cell>

                    <Table.Cell>

                         <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditRoleModal(role)}
                        >
                        Editar
                        </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openPermissionModal(role)}
                      >
                        <KeyRound size={15} />
                        Gestionar permisos
                      </Button>
                    </Table.Cell>
                  </Table.Row>
                ))}

                {filteredRoles.length === 0 && (
                  <Table.Row>
                    <Table.Cell colSpan={6}>
                      <Text textAlign="center" color="gray.500" py={6}>
                        No se encontraron roles con el filtro aplicado.
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
        open={isPermissionModalOpen}
        onOpenChange={(details) => {
          setIsPermissionModalOpen(details.open);

          if (!details.open) {
            setSelectedRole(null);
            setSelectedPermissionIds([]);
          }
        }}
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content maxW="720px">
              <Dialog.Header>
                <Dialog.Title>Gestionar permisos del rol</Dialog.Title>
                <Dialog.CloseTrigger asChild>
                  <CloseButton size="sm" />
                </Dialog.CloseTrigger>
              </Dialog.Header>

              <Dialog.Body>
                {selectedRole && (
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
                          >
                            <ShieldCheck size={22} />
                          </Flex>

                          <Box>
                            <Text fontWeight="bold">{selectedRole.name}</Text>
                            <Text fontSize="sm" color="gray.500">
                              {selectedRole.code}
                            </Text>
                            <Text fontSize="sm" color="gray.500">
                              {selectedRole.description ?? "Sin descripción"}
                            </Text>
                          </Box>
                        </HStack>
                      </Card.Body>
                    </Card.Root>

                    <Box>
                      <Text fontWeight="semibold" mb={2}>
                        Permisos disponibles
                      </Text>

                      <VStack align="stretch" gap={4}>
                        {groupedPermissions.map((group) => (
                          <Card.Root key={group.module} variant="outline">
                            <Card.Body>
                              <Flex
                                justify="space-between"
                                align="center"
                                mb={3}
                              >
                                <Box>
                                  <Text fontWeight="bold">{group.module}</Text>
                                  <Text fontSize="xs" color="gray.500">
                                    {group.permissions.length} permiso(s)
                                  </Text>
                                </Box>

                                <Badge colorPalette="blue">
                                  {group.module}
                                </Badge>
                              </Flex>

                              <VStack align="stretch" gap={2}>
                                {group.permissions.map((permission) => {
                                  const checked =
                                    selectedPermissionIds.includes(
                                      permission.id
                                    );

                                  return (
                                    <Flex
                                      key={permission.id}
                                      align="center"
                                      justify="space-between"
                                      borderWidth="1px"
                                      rounded="lg"
                                      px={4}
                                      py={3}
                                    >
                                      <Box>
                                        <HStack gap={2}>
                                          <CheckCircle size={15} />
                                          <Text fontWeight="semibold">
                                            {permission.name}
                                          </Text>
                                          <Badge
                                            colorPalette={
                                              permission.active
                                                ? "green"
                                                : "red"
                                            }
                                          >
                                            {permission.active
                                              ? "Activo"
                                              : "Inactivo"}
                                          </Badge>
                                        </HStack>

                                        <Text
                                          fontSize="xs"
                                          color="gray.500"
                                          mt={1}
                                        >
                                          {permission.code}
                                        </Text>

                                        <Text
                                          fontSize="xs"
                                          color="gray.500"
                                          mt={1}
                                        >
                                          Acción: {permission.action}
                                        </Text>

                                        {permission.description && (
                                          <Text
                                            fontSize="sm"
                                            color="gray.600"
                                            mt={1}
                                          >
                                            {permission.description}
                                          </Text>
                                        )}
                                      </Box>

                                      <Checkbox.Root
                                        checked={checked}
                                        onCheckedChange={() =>
                                          togglePermission(permission.id)
                                        }
                                        disabled={!permission.active}
                                      >
                                        <Checkbox.HiddenInput />
                                        <Checkbox.Control />
                                      </Checkbox.Root>
                                    </Flex>
                                  );
                                })}
                              </VStack>
                            </Card.Body>
                          </Card.Root>
                        ))}

                        {permissions.length === 0 && (
                          <Text color="gray.500" fontSize="sm">
                            No hay permisos registrados.
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
                  onClick={() => setIsPermissionModalOpen(false)}
                  disabled={savingPermissions}
                >
                  Cancelar
                </Button>

                <Button onClick={saveRolePermissions} loading={savingPermissions}>
                  Guardar cambios
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>

      <Dialog.Root
  open={isRoleFormOpen}
  onOpenChange={(details) => {
    setIsRoleFormOpen(details.open);

    if (!details.open) {
      setEditingRole(null);
    }
  }}
>
  <Portal>
    <Dialog.Backdrop />
    <Dialog.Positioner>
      <Dialog.Content maxW="520px">
        <Dialog.Header>
          <Dialog.Title>
            {editingRole ? "Editar rol" : "Nuevo rol"}
          </Dialog.Title>
          <Dialog.CloseTrigger asChild>
            <CloseButton size="sm" />
          </Dialog.CloseTrigger>
        </Dialog.Header>

        <Dialog.Body>
          <VStack align="stretch" gap={4}>
            <Box>
              <Text fontWeight="semibold" mb={1}>
                Código del rol
              </Text>
              <Input
                value={roleForm.code}
                disabled={!!editingRole}
                
                placeholder="Ejemplo: GERENTE"
                onChange={(event) =>
                  setRoleForm((current) => ({
                    ...current,
                    code: event.target.value,
                  }))
                }
              />
              <Text fontSize="xs" color="gray.500" mt={1}>
                El código se usa internamente para identificar el rol.
              </Text>
            </Box>

            <Box>
              <Text fontWeight="semibold" mb={1}>
                Nombre del rol
              </Text>
              <Input
                value={roleForm.name}
                placeholder="Ejemplo: Gerente"
                onChange={(event) =>
                  setRoleForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
              />
            </Box>

            <Box>
              <Text fontWeight="semibold" mb={1}>
                Descripción
              </Text>
              <Input
                value={roleForm.description}
                placeholder="Describe el alcance del rol"
                onChange={(event) =>
                  setRoleForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
              />
            </Box>

            {editingRole && (
              <Flex align="center" justify="space-between" borderWidth="1px" rounded="lg" p={3}>
                <Box>
                  <Text fontWeight="semibold">Estado del rol</Text>
                  <Text fontSize="sm" color="gray.500">
                    Permite activar o inactivar el rol.
                  </Text>
                </Box>

                <Checkbox.Root
                  checked={roleForm.active}
                  onCheckedChange={(details) =>
                    setRoleForm((current) => ({
                      ...current,
                      active: !!details.checked,
                    }))
                  }
                >
                  <Checkbox.HiddenInput />
                  <Checkbox.Control />
                  <Checkbox.Label>Activo</Checkbox.Label>
                </Checkbox.Root>
              </Flex>
            )}
          </VStack>
        </Dialog.Body>

        <Dialog.Footer>
          <Button
            variant="outline"
            onClick={() => setIsRoleFormOpen(false)}
            disabled={savingRole}
          >
            Cancelar
          </Button>

          <Button onClick={saveRole} loading={savingRole}>
            Guardar
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Positioner>
  </Portal>
</Dialog.Root>
    </Box>
  );
}