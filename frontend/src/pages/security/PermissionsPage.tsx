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
import { Edit, KeyRound, Plus, RefreshCw, Search } from "lucide-react";
import {
  createSecurityPermission,
  getSecurityPermissions,
  SecurityPermission,
  updateSecurityPermission,
} from "../../services/security.service";

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<SecurityPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPermission, setEditingPermission] =
    useState<SecurityPermission | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    code: "",
    name: "",
    description: "",
    module: "",
    action: "",
    active: true,
  });

  const loadPermissions = async () => {
    try {
      setLoading(true);
      const result = await getSecurityPermissions();
      setPermissions(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error("Error cargando permisos:", error);
      alert("No se pudo cargar el listado de permisos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPermissions();
  }, []);

  const filteredPermissions = useMemo(() => {
    const value = filter.trim().toLowerCase();

    if (!value) return permissions;

    return permissions.filter((permission) => {
      return (
        permission.code.toLowerCase().includes(value) ||
        permission.name.toLowerCase().includes(value) ||
        permission.module.toLowerCase().includes(value) ||
        permission.action.toLowerCase().includes(value) ||
        permission.description?.toLowerCase().includes(value)
      );
    });
  }, [permissions, filter]);

  const groupedSummary = useMemo(() => {
    const modules = permissions.reduce<Record<string, number>>(
      (acc, permission) => {
        acc[permission.module] = (acc[permission.module] ?? 0) + 1;
        return acc;
      },
      {}
    );

    return Object.entries(modules);
  }, [permissions]);

  const openCreateModal = () => {
    setEditingPermission(null);
    setForm({
      code: "",
      name: "",
      description: "",
      module: "",
      action: "",
      active: true,
    });
    setIsFormOpen(true);
  };

  const openEditModal = (permission: SecurityPermission) => {
    setEditingPermission(permission);
    setForm({
      code: permission.code,
      name: permission.name,
      description: permission.description ?? "",
      module: permission.module,
      action: permission.action,
      active: permission.active,
    });
    setIsFormOpen(true);
  };

  const savePermission = async () => {
    try {
      if (!form.code.trim()) {
        alert("El código del permiso es obligatorio.");
        return;
      }

      if (!form.name.trim()) {
        alert("El nombre del permiso es obligatorio.");
        return;
      }

      if (!form.module.trim()) {
        alert("El módulo del permiso es obligatorio.");
        return;
      }

      if (!form.action.trim()) {
        alert("La acción del permiso es obligatoria.");
        return;
      }

      setSaving(true);

      if (editingPermission) {
        await updateSecurityPermission(editingPermission.id, {
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          module: form.module.trim(),
          action: form.action.trim().toUpperCase(),
          active: form.active,
        });

        alert("Permiso actualizado correctamente.");
      } else {
        await createSecurityPermission({
          code: form.code.trim().toUpperCase(),
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          module: form.module.trim(),
          action: form.action.trim().toUpperCase(),
        });

        alert("Permiso creado correctamente.");
      }

      await loadPermissions();
      setIsFormOpen(false);
      setEditingPermission(null);
    } catch (error) {
      console.error("Error guardando permiso:", error);
      alert("No se pudo guardar el permiso.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Flex minH="60vh" align="center" justify="center">
        <VStack gap={3}>
          <Spinner size="lg" />
          <Text color="gray.500">Cargando permisos...</Text>
        </VStack>
      </Flex>
    );
  }

  return (
    <Box p={6}>
      <Flex justify="space-between" align="center" mb={6} gap={4}>
        <Box>
          <HStack gap={2} mb={1}>
            <KeyRound size={22} />
            <Heading size="lg">Permisos</Heading>
          </HStack>
          <Text color="gray.600">
            Administración de permisos funcionales utilizados por los roles del sistema.
          </Text>
        </Box>

        <HStack>
          <Button variant="outline" onClick={loadPermissions}>
            <RefreshCw size={16} />
            Actualizar
          </Button>

          <Button onClick={openCreateModal}>
            <Plus size={16} />
            Nuevo permiso
          </Button>
        </HStack>
      </Flex>

      <Card.Root mb={5}>
        <Card.Body>
          <Flex justify="space-between" align="center" gap={4} wrap="wrap">
            <Box>
              <Text fontWeight="semibold">Resumen de permisos</Text>
              <Text color="gray.500" fontSize="sm">
                Permisos registrados: {permissions.length} · Activos:{" "}
                {permissions.filter((permission) => permission.active).length} ·
                Inactivos: {permissions.filter((permission) => !permission.active).length}
              </Text>
            </Box>

            <HStack maxW="440px" w="full">
              <Search size={18} />
              <Input
                placeholder="Buscar permiso, código, módulo o acción..."
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
              />
            </HStack>
          </Flex>

          {groupedSummary.length > 0 && (
            <HStack gap={2} wrap="wrap" mt={4}>
              {groupedSummary.map(([module, count]) => (
                <Badge key={module} colorPalette="blue" variant="subtle">
                  {module}: {count}
                </Badge>
              ))}
            </HStack>
          )}
        </Card.Body>
      </Card.Root>

      <Card.Root>
        <Card.Body>
          <Flex justify="space-between" align="center" mb={4}>
            <Box>
              <Heading size="md">Listado de permisos</Heading>
              <Text color="gray.500" fontSize="sm">
                Los permisos se asignan posteriormente a cada rol.
              </Text>
            </Box>

            <Badge colorPalette="blue">
              {filteredPermissions.length} resultado(s)
            </Badge>
          </Flex>

          <Box overflowX="auto">
            <Table.Root size="sm" variant="outline">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>Permiso</Table.ColumnHeader>
                  <Table.ColumnHeader>Módulo</Table.ColumnHeader>
                  <Table.ColumnHeader>Acción</Table.ColumnHeader>
                  <Table.ColumnHeader>Descripción</Table.ColumnHeader>
                  <Table.ColumnHeader>Estado</Table.ColumnHeader>
                  <Table.ColumnHeader>Acciones</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>

              <Table.Body>
                {filteredPermissions.map((permission) => (
                  <Table.Row key={permission.id}>
                    <Table.Cell>
                      <Box>
                        <Text fontWeight="semibold">{permission.name}</Text>
                        <Text fontSize="xs" color="gray.500">
                          {permission.code}
                        </Text>
                      </Box>
                    </Table.Cell>

                    <Table.Cell>
                      <Badge colorPalette="purple">{permission.module}</Badge>
                    </Table.Cell>

                    <Table.Cell>
                      <Badge colorPalette="blue" variant="subtle">
                        {permission.action}
                      </Badge>
                    </Table.Cell>

                    <Table.Cell>
                      <Text>{permission.description ?? "Sin descripción"}</Text>
                    </Table.Cell>

                    <Table.Cell>
                      {permission.active ? (
                        <Badge colorPalette="green">Activo</Badge>
                      ) : (
                        <Badge colorPalette="red">Inactivo</Badge>
                      )}
                    </Table.Cell>

                    <Table.Cell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditModal(permission)}
                      >
                        <Edit size={15} />
                        Editar
                      </Button>
                    </Table.Cell>
                  </Table.Row>
                ))}

                {filteredPermissions.length === 0 && (
                  <Table.Row>
                    <Table.Cell colSpan={6}>
                      <Text textAlign="center" color="gray.500" py={6}>
                        No se encontraron permisos con el filtro aplicado.
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
        open={isFormOpen}
        onOpenChange={(details) => {
          setIsFormOpen(details.open);

          if (!details.open) {
            setEditingPermission(null);
          }
        }}
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content maxW="560px">
              <Dialog.Header>
                <Dialog.Title>
                  {editingPermission ? "Editar permiso" : "Nuevo permiso"}
                </Dialog.Title>
                <Dialog.CloseTrigger asChild>
                  <CloseButton size="sm" />
                </Dialog.CloseTrigger>
              </Dialog.Header>

              <Dialog.Body>
                <VStack align="stretch" gap={4}>
                  <Box>
                    <Text fontWeight="semibold" mb={1}>
                      Código del permiso
                    </Text>
                    <Input
                      value={form.code}
                      disabled={!!editingPermission}
                      placeholder="Ejemplo: EXPENSE_REQUEST_CREATE"
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          code: event.target.value,
                        }))
                      }
                    />
                    <Text fontSize="xs" color="gray.500" mt={1}>
                      El código se utiliza internamente para validar accesos.
                    </Text>
                  </Box>

                  <Box>
                    <Text fontWeight="semibold" mb={1}>
                      Nombre
                    </Text>
                    <Input
                      value={form.name}
                      placeholder="Ejemplo: Crear solicitud de gasto"
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                    />
                  </Box>

                  <Box>
                    <Text fontWeight="semibold" mb={1}>
                      Módulo
                    </Text>
                    <Input
                      value={form.module}
                      placeholder="Ejemplo: Solicitudes de gasto"
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          module: event.target.value,
                        }))
                      }
                    />
                  </Box>

                  <Box>
                    <Text fontWeight="semibold" mb={1}>
                      Acción
                    </Text>
                    <Input
                      value={form.action}
                      placeholder="Ejemplo: CREATE"
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          action: event.target.value,
                        }))
                      }
                    />
                  </Box>

                  <Box>
                    <Text fontWeight="semibold" mb={1}>
                      Descripción
                    </Text>
                    <Input
                      value={form.description}
                      placeholder="Describe el alcance del permiso"
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          description: event.target.value,
                        }))
                      }
                    />
                  </Box>

                  {editingPermission && (
                    <Flex
                      align="center"
                      justify="space-between"
                      borderWidth="1px"
                      rounded="lg"
                      p={3}
                    >
                      <Box>
                        <Text fontWeight="semibold">Estado del permiso</Text>
                        <Text fontSize="sm" color="gray.500">
                          Permite activar o inactivar el permiso.
                        </Text>
                      </Box>

                      <Checkbox.Root
                        checked={form.active}
                        onCheckedChange={(details) =>
                          setForm((current) => ({
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
                  onClick={() => setIsFormOpen(false)}
                  disabled={saving}
                >
                  Cancelar
                </Button>

                <Button onClick={savePermission} loading={saving}>
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