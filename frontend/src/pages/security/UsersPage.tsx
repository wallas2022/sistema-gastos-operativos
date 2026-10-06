import { useEffect, useState } from "react";
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
import {
  getUsers,
  type SecurityUser,
  createUser,
  updateUser,
  activateUser,
  deactivateUser,
  blockUser,
  unblockUser,
  forcePasswordChange,
  generatePasswordResetLink,
  adminResetPassword,
} from "../../services/security/users.service";
import { api } from "../../shared/services/api";

type UserFormState = {
  name: string;
  email: string;
  password: string;
  roleId: string;
  companyId: string;
  costCenter: string;
  position: string;
};

const emptyForm: UserFormState = {
  name: "",
  email: "",
  password: "",
  roleId: "",
  companyId: "",
  costCenter: "",
  position: "",
};
type RoleOption = {
  id: string;
  name: string;
  code?: string;
};

type CompanyOption = {
  id: string;
  name: string;
};

export default function UsersPage() {
  const [users, setUsers] = useState<SecurityUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<SecurityUser | null>(null);
  const [form, setForm] = useState<UserFormState>(emptyForm);

  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);

  const costCenters = [
  "ADM-ROOT",
  "CC-ADM-001",
  "CC-ADM-002",
  "FIN-001",
  "GER-001",
  "DOC-001",
  "TES-001",
  "CC-TI-001",
];

const positions = [
  "Administrador del Sistema",
  "Analista Financiero",
  "Gerente de Área",
  "Revisor Documental OCR",
  "Asistente Administrativo",
  "Analista de Tesorería",
  "Operador",
];

const loadCatalogs = async () => {
  try {
    const [rolesResponse, companiesResponse] = await Promise.all([
      api.get("/security/roles"),
      api.get("/catalog/companies"),
    ]);

    setRoles(rolesResponse.data);
    setCompanies(companiesResponse.data);
  } catch (error) {
    console.error("Error al cargar catálogos:", error);
  }
};

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await getUsers();
      setUsers(data);
       console.log("Usuarios recibidos:", data);
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
      alert("No se pudieron cargar los usuarios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    loadCatalogs();
  }, []);

  const filteredUsers = users.filter((user) => {
  const roleNames =
    user.roles?.map((item) => item.role.name).join(" ") ?? "";

  const text = `${user.name} ${user.email} ${roleNames}`.toLowerCase();

  return text.includes(search.toLowerCase());
});

  const handleOpenCreate = () => {
    setEditingUser(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: SecurityUser) => {
    setEditingUser(user);
    setForm({
      name: user.name ?? "",
      email: user.email ?? "",
      password: "",
      roleId: user.roles?.[0]?.role.id ?? "",
      companyId: user.companyId ?? "",
      costCenter: user.costCenter ?? "",
      position: user.position ?? "",
    });
    setIsModalOpen(true);
  };

const handleToggleStatus = async (user: SecurityUser) => {
  try {
    if (user.active) {
      await deactivateUser(user.id);
    } else {
      await activateUser(user.id);
    }

    await loadUsers();
  } catch (error) {
    console.error("Error al cambiar estado del usuario:", error);
    alert("No se pudo cambiar el estado del usuario");
  }
};

  const handleSecurityAction = async (user: SecurityUser, action: 'block'|'force'|'link'|'reset') => {
    try {
      if (action === 'block') user.blocked ? await unblockUser(user.id) : await blockUser(user.id);
      if (action === 'force') { await forcePasswordChange(user.id); alert('El usuario deberá cambiar su contraseña en el próximo inicio.'); }
      if (action === 'link') { const result = await generatePasswordResetLink(user.id); await navigator.clipboard.writeText(result.resetUrl); alert(`Enlace copiado. Vence en ${result.expiresMinutes} minutos.`); }
      if (action === 'reset') { const result = await adminResetPassword(user.id); alert(`Contraseña temporal (se muestra una sola vez): ${result.temporaryPassword}`); }
      await loadUsers();
    } catch (error) { console.error(error); alert('No se pudo completar la operación de seguridad.'); }
  };

  const handleSaveUser = async () => {
    try {
      if (!form.name || !form.email) {
        alert("Nombre y correo son obligatorios");
        return;
      }

      if (!editingUser && !form.password) {
        alert("La contraseña es obligatoria para crear usuario");
        return;
      }

      const payload = editingUser
  ? {
      name: form.name,
      companyId: form.companyId || undefined,
      costCenter: form.costCenter || undefined,
      position: form.position || undefined,
      ...(form.password ? { password: form.password } : {}),
    }
  : {
      name: form.name,
      email: form.email,
      companyId: form.companyId || undefined,
      costCenter: form.costCenter || undefined,
      position: form.position || undefined,
      ...(form.password ? { password: form.password } : {}),
    };
      if (editingUser) {
        await updateUser(editingUser.id, payload);
      } else {
        await createUser(payload as any);
      }

      setIsModalOpen(false);
      setEditingUser(null);
      setForm(emptyForm);
      await loadUsers();
    } catch (error) {
      console.error("Error al guardar usuario:", error);
      alert("No se pudo guardar el usuario");
    }
  };

  return (
    <Box p={6}>
      <Card.Root borderRadius="2xl" shadow="sm">
        <Card.Body>
          <Flex justify="space-between" align="center" mb={6} gap={4}>
            <Box>
              <Heading size="lg">Usuarios</Heading>
              <Text color="gray.500" mt={1}>
                Administración de usuarios del sistema
              </Text>
            </Box>

            <Button colorPalette="blue" onClick={handleOpenCreate}>
              Nuevo usuario
            </Button>
          </Flex>

          <Flex mb={5}>
            <Input
              placeholder="Buscar por nombre, correo o rol"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              maxW="360px"
            />
          </Flex>

          {loading ? (
            <VStack py={10}>
              <Spinner />
              <Text color="gray.500">Cargando usuarios...</Text>
            </VStack>
          ) : (
            <Table.Root size="sm" variant="outline">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>Nombre</Table.ColumnHeader>
                  <Table.ColumnHeader>Correo</Table.ColumnHeader>
                  <Table.ColumnHeader>Rol</Table.ColumnHeader>
                  <Table.ColumnHeader>Puesto</Table.ColumnHeader>
                  <Table.ColumnHeader>Centro de costo</Table.ColumnHeader>
                  <Table.ColumnHeader>Estado</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="end">
                    Acciones
                  </Table.ColumnHeader>
                </Table.Row>
              </Table.Header>

              <Table.Body>
                {filteredUsers.map((user) => (
                  <Table.Row key={user.id}>
                    <Table.Cell fontWeight="medium">{user.name}</Table.Cell>
                    <Table.Cell>{user.email}</Table.Cell>
                    <Table.Cell>{user.roles?.map((item) => item.role.name).join(", ") || "Sin rol"}</Table.Cell>
                    <Table.Cell>{user.position ?? "-"}</Table.Cell>
                    <Table.Cell>{user.costCenter ?? "-"}</Table.Cell>

                    <Table.Cell>
                    <Badge
                        colorPalette={user.active ? "green" : "red"}
                        variant="subtle"
                      >
                        {user.active ? "Activo" : "Inactivo"}
                      </Badge>
                    </Table.Cell>

                    <Table.Cell>
                      <HStack justify="flex-end">
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => handleOpenEdit(user)}
                        >
                          Editar
                        </Button>
                        <Button
                          size="xs"
                          colorPalette={user.active ? "red" : "green"}
                          variant="subtle"
                          onClick={() => handleToggleStatus(user)}
                        >
                          {user.active ? "Desactivar" : "Activar"}
                        </Button>
                        <Button size="xs" variant="outline" onClick={() => handleSecurityAction(user, 'block')}>{user.blocked ? 'Desbloquear' : 'Bloquear'}</Button>
                        <Button size="xs" variant="outline" onClick={() => handleSecurityAction(user, 'force')}>Obligar cambio</Button>
                        <Button size="xs" variant="outline" onClick={() => handleSecurityAction(user, 'link')}>Generar enlace</Button>
                        <Button size="xs" colorPalette="orange" variant="subtle" onClick={() => handleSecurityAction(user, 'reset')}>Restablecer</Button>
                      </HStack>
                    </Table.Cell>
                  </Table.Row>
                ))}

                {filteredUsers.length === 0 && (
                  <Table.Row>
                    <Table.Cell colSpan={7}>
                      <Text textAlign="center" color="gray.500" py={6}>
                        No se encontraron usuarios.
                      </Text>
                    </Table.Cell>
                  </Table.Row>
                )}
              </Table.Body>
            </Table.Root>
          )}
        </Card.Body>
      </Card.Root>

      {isModalOpen && (
        <Box
          position="fixed"
          inset="0"
          bg="blackAlpha.500"
          display="flex"
          alignItems="center"
          justifyContent="center"
          zIndex={1000}
        >
          <Box
            bg="white"
            p={6}
            borderRadius="2xl"
            shadow="xl"
            w="100%"
            maxW="520px"
          >
            <Heading size="md" mb={4}>
              {editingUser ? "Editar usuario" : "Nuevo usuario"}
            </Heading>

            <VStack gap={3} align="stretch">
              <Input
                placeholder="Nombre"
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
              />

              <Input
                placeholder="Correo"
                value={form.email}
                onChange={(e) =>
                  setForm({ ...form, email: e.target.value })
                }
              />

              <Input
                placeholder={
                  editingUser ? "Nueva contraseña opcional" : "Contraseña"
                }
                type="password"
                value={form.password}
                onChange={(e) =>
                  setForm({ ...form, password: e.target.value })
                }
              />

             <Box>
            <Text fontSize="sm" mb={1} color="gray.600">
              Rol
            </Text>
       
        <Box>


              <select
                value={form.roleId}
                onChange={(e) =>
                  setForm({ ...form, roleId: e.target.value })
                }
                style={{
                  width: "100%",
                  height: "40px",
                  padding: "0 12px",
                  border: "1px solid #E2E8F0",
                  borderRadius: "6px",
                  background: "white",
                }}
              >
                <option value="">Seleccione un rol</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </Box>

              <Box>
                <Text fontSize="sm" mb={1} color="gray.600">
                  Empresa
                </Text>

                <select
                  value={form.companyId}
                  onChange={(e) =>
                    setForm({ ...form, companyId: e.target.value })
                  }
                  style={{
                    width: "100%",
                    height: "40px",
                    padding: "0 12px",
                    border: "1px solid #E2E8F0",
                    borderRadius: "6px",
                    background: "white",
                  }}
                >
                  <option value="">Seleccione una empresa</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </Box>

              <Box>
                <Text fontSize="sm" mb={1} color="gray.600">
                  Centro de costo
                </Text>

                <select
                  value={form.costCenter}
                  onChange={(e) =>
                    setForm({ ...form, costCenter: e.target.value })
                  }
                  style={{
                    width: "100%",
                    height: "40px",
                    padding: "0 12px",
                    border: "1px solid #E2E8F0",
                    borderRadius: "6px",
                    background: "white",
                  }}
                >
                  <option value="">Seleccione centro de costo</option>
                  {costCenters.map((costCenter) => (
                    <option key={costCenter} value={costCenter}>
                      {costCenter}
                    </option>
                  ))}
                </select>
              </Box>

              <Box>
                <Text fontSize="sm" mb={1} color="gray.600">
                  Puesto
                </Text>

                <select
                  value={form.position}
                  onChange={(e) =>
                    setForm({ ...form, position: e.target.value })
                  }
                  style={{
                    width: "100%",
                    height: "40px",
                    padding: "0 12px",
                    border: "1px solid #E2E8F0",
                    borderRadius: "6px",
                    background: "white",
                  }}
                >
                  <option value="">Seleccione puesto</option>
                  {positions.map((position) => (
                    <option key={position} value={position}>
                      {position}
                    </option>
                  ))}
                </select>
              </Box>
                      </Box>

                            <HStack justify="flex-end" mt={4}>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setIsModalOpen(false);
                                  setEditingUser(null);
                                  setForm(emptyForm);
                                }}
                              >
                                Cancelar
                              </Button>

                              <Button colorPalette="blue" onClick={handleSaveUser}>
                                Guardar
                              </Button>
                            </HStack>
                          </VStack>
                        </Box>
                      </Box>
                    )}
                  </Box>
  );
}
