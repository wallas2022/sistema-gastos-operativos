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
import { Check, RefreshCw, ShieldCheck, X } from "lucide-react";
import {
  AccessMatrixResponse,
  getAccessMatrix,
} from "../../services/security.service";

export default function AccessMatrixPage() {
  const [data, setData] = useState<AccessMatrixResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await getAccessMatrix();
      setData(result);
    } catch (error) {
      console.error("Error cargando matriz de accesos:", error);
      alert("No se pudo cargar la matriz de accesos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const groupedPermissions = useMemo(() => {
    if (!data) return [];

    const normalizedFilter = filter.trim().toLowerCase();

    const permissions = data.permissions.filter((permission) => {
      if (!normalizedFilter) return true;

      return (
        permission.code.toLowerCase().includes(normalizedFilter) ||
        permission.name.toLowerCase().includes(normalizedFilter) ||
        permission.module.toLowerCase().includes(normalizedFilter) ||
        permission.action.toLowerCase().includes(normalizedFilter)
      );
    });

    const groups = permissions.reduce<Record<string, typeof permissions>>(
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
  }, [data, filter]);

  const roleHasPermission = (role: any, permission: any) => {
  if (!role.permissions) {
    return false;
  }

  if (
    role.permissions?.[permission.module]?.[permission.action] === true
  ) {
    return true;
  }

  if (Array.isArray(role.permissions)) {
    return role.permissions.some((item: any) => {
      const currentPermission = item.permission ?? item;

      return (
        currentPermission.code === permission.code ||
        currentPermission.action === permission.action
      );
    });
  }

  return false;
};

  if (loading) {
    return (
      <Flex minH="60vh" align="center" justify="center">
        <VStack gap={3}>
          <Spinner size="lg" />
          <Text color="gray.500">Cargando matriz de accesos...</Text>
        </VStack>
      </Flex>
    );
  }

  if (!data) {
    return (
      <Box p={6}>
        <Text>No se encontró información de matriz de accesos.</Text>
      </Box>
    );
  }

  return (
    <Box p={6}>
      <Flex justify="space-between" align="center" mb={6} gap={4}>
        <Box>
          <HStack gap={2} mb={1}>
            <ShieldCheck size={22} />
            <Heading size="lg">Matriz de accesos</Heading>
          </HStack>
          <Text color="gray.600">
            Consulta visual de permisos asignados por rol dentro del sistema.
          </Text>
        </Box>

        <Button onClick={loadData}>
          <RefreshCw size={16} />
          Actualizar
        </Button>
      </Flex>

      <Card.Root mb={5}>
        <Card.Body>
          <Flex justify="space-between" align="center" gap={4} wrap="wrap">
            <Box>
              <Text fontWeight="semibold">Resumen de seguridad</Text>
              <Text color="gray.500" fontSize="sm">
                Roles configurados: {data.roles.length} · Permisos registrados:{" "}
                {data.permissions.length}
              </Text>
            </Box>

            <Input
              maxW="360px"
              placeholder="Buscar permiso, módulo o acción..."
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            />
          </Flex>
        </Card.Body>
      </Card.Root>

      <VStack align="stretch" gap={5}>
        {groupedPermissions.map((group) => (
          <Card.Root key={group.module}>
            <Card.Body>
              <Flex justify="space-between" align="center" mb={4}>
                <Box>
                  <Heading size="md">{group.module}</Heading>
                  <Text fontSize="sm" color="gray.500">
                    {group.permissions.length} permisos del módulo
                  </Text>
                </Box>
                <Badge colorPalette="blue">{group.module}</Badge>
              </Flex>

              <Box overflowX="auto">
                <Table.Root size="sm" variant="outline">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader minW="260px">
                        Permiso
                      </Table.ColumnHeader>

                      {data.roles.map((role) => (
                        <Table.ColumnHeader
                          key={role.id}
                          textAlign="center"
                          minW="140px"
                        >
                          {role.name}
                        </Table.ColumnHeader>
                      ))}
                    </Table.Row>
                  </Table.Header>

                  <Table.Body>
                    {group.permissions.map((permission) => (
                      <Table.Row key={permission.id}>
                        <Table.Cell>
                          <Text fontWeight="semibold">{permission.name}</Text>
                          <Text fontSize="xs" color="gray.500">
                            {permission.code}
                          </Text>
                          <Badge size="sm" mt={1}>
                            {permission.action}
                          </Badge>
                        </Table.Cell>

                        {data.roles.map((role) => {
                          const hasPermission = roleHasPermission(role, permission);

                          return (
                            <Table.Cell key={role.id} textAlign="center">
                              {hasPermission ? (
                                <Badge colorPalette="green">
                                  <Check size={13} /> Sí
                                </Badge>
                              ) : (
                                <Badge colorPalette="red" variant="subtle">
                                  <X size={13} /> No
                                </Badge>
                              )}
                            </Table.Cell>
                          );
                        })}
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              </Box>
            </Card.Body>
          </Card.Root>
        ))}
      </VStack>
    </Box>
  );
}