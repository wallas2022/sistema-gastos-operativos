import { Box, Button, Text, VStack } from "@chakra-ui/react";
import { NavLink } from "react-router-dom";

const menuItems = [
  {
    label: "Dashboard",
    path: "/dashboard",
  },
  {
    label: "Planificación y Normativa",
    path: "/planificacion-normativa",
  },
  {
    label: "Trazabilidad de Flujos",
    path: "/trazabilidad-flujos",
  },
  {
    label: "Rendición y Conciliación",
    path: "/rendicion-conciliacion",
  },
  {
    label: "Control Presupuestario",
    path: "/control-presupuestario",
  },
  {
    label: "Gobernanza y Configuración",
    path: "/gobernanza-configuracion",
  },
  {
    label: "Usuarios y Accesos",
    path: "/usuarios-accesos",
  },
  {
    label: "Reportes y Analítica",
    path: "/reportes-analitica",
  },
];

export function Sidebar() {
  return (
    <Box
      w="260px"
      minH="100vh"
      bg="white"
      borderRight="1px solid"
      borderColor="gray.200"
      position="fixed"
      left="0"
      top="0"
      p="4"
    >
      <Box mb="8">
        <img
          src="/images/logo-servicios-compartidos.jpg"
          alt="Servicios Compartidos"
          style={{
            width: "190px",
            height: "auto",
            display: "block",
            marginBottom: "16px",
          }}
        />

        <Text fontSize="sm" fontWeight="bold" color="blue.800">
          Gestión de Gastos
        </Text>

        <Text fontSize="xs" color="gray.500">
          Control presupuestario empresarial
        </Text>
      </Box>

      <VStack align="stretch" gap="2">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={{ textDecoration: "none" }}
          >
            {({ isActive }) => (
              <Button
                w="100%"
                justifyContent="flex-start"
                variant={isActive ? "subtle" : "ghost"}
                colorPalette="blue"
              >
                {item.label}
              </Button>
            )}
          </NavLink>
        ))}
      </VStack>
    </Box>
  );
}