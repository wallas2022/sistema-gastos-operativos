import { Box, Flex, Text, VStack } from "@chakra-ui/react";
import { NavLink } from "react-router-dom";

const menuItems = [
  {
    label: "Dashboard",
    path: "/",
  },
  {
    label: "Planificación y Normativa",
    path: "/planificacion",
  },
  {
    label: "Trazabilidad de Flujos",
    path: "/trazabilidad",
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
    path: "/gobernanza",
  },
  {
    label: "Usuarios y Accesos",
    path: "/usuarios",
  },
  {
    label: "Reportes y Analítica",
    path: "/reportes",
  },
];

export function Sidebar() {
  return (
    <Box
      position="fixed"
      left="0"
      top="0"
      w="260px"
      h="100vh"
      bg="white"
      borderRight="1px solid"
      borderColor="gray.200"
      px="4"
      py="5"
    >
      <Box mb="8">
        <Text fontSize="lg" fontWeight="bold" color="blue.700">
          Gestión de Gastos
        </Text>
        <Text fontSize="sm" color="gray.500">
          Control presupuestario empresarial
        </Text>
      </Box>

      <VStack align="stretch" gap="2">
        {menuItems.map((item) => (
          <NavLink key={item.path} to={item.path}>
            {({ isActive }) => (
              <Flex
                px="4"
                py="3"
                rounded="lg"
                bg={isActive ? "blue.50" : "transparent"}
                color={isActive ? "blue.700" : "gray.700"}
                fontWeight={isActive ? "semibold" : "normal"}
                _hover={{
                  bg: "gray.100",
                }}
              >
                <Text fontSize="sm">{item.label}</Text>
              </Flex>
            )}
          </NavLink>
        ))}
      </VStack>
    </Box>
  );
}