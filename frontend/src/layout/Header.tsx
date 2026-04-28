import { Box, Button, Flex, HStack, Input, Text } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

export function Header() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <Flex
      h="72px"
      bg="white"
      borderBottom="1px solid"
      borderColor="gray.200"
      align="center"
      justify="space-between"
      px="6"
      position="sticky"
      top="0"
      zIndex="10"
    >
      <Box>
        <Text fontSize="sm" color="gray.500">
          Sistema web
        </Text>
        <Text fontSize="md" fontWeight="semibold">
          Gestión y control presupuestario de gastos operativos empresariales
        </Text>
      </Box>

      <HStack gap="4">
        <Input placeholder="Buscar..." size="sm" w="260px" bg="gray.50" />

        <Text fontSize="sm" color="gray.600">
          Walter Rosales
        </Text>

        <Button size="sm" variant="outline" onClick={handleLogout}>
          Salir
        </Button>
      </HStack>
    </Flex>
  );
}