import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { Home, SearchX, ShieldAlert } from "lucide-react";

export function NotFoundPage() {
  return (
    <Flex
      minH="100vh"
      bg="gray.50"
      align="center"
      justify="center"
      px="6"
    >
      <Box
        w="100%"
        maxW="760px"
        bg="white"
        border="1px solid"
        borderColor="gray.200"
        rounded="3xl"
        p={{ base: "8", md: "12" }}
        shadow="xl"
      >
        <VStack gap="6" textAlign="center">
          <Box
            w="76px"
            h="76px"
            rounded="2xl"
            bg="blue.50"
            color="blue.600"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <SearchX size={38} />
          </Box>

          <Box>
            <Text
              fontSize="sm"
              fontWeight="bold"
              color="blue.600"
              textTransform="uppercase"
              letterSpacing="wide"
            >
              Error 404
            </Text>

            <Heading size="xl" mt="2">
              Página no encontrada
            </Heading>

            <Text color="gray.500" mt="4" fontSize="md">
              La ruta que intentas abrir no existe o todavía no ha sido
              habilitada dentro del sistema.
            </Text>
          </Box>

          <Box
            w="100%"
            bg="gray.50"
            border="1px solid"
            borderColor="gray.200"
            rounded="2xl"
            p="5"
            textAlign="left"
          >
            <HStack align="start" gap="3">
              <Box color="orange.500" mt="1">
                <ShieldAlert size={20} />
              </Box>

              <Box>
                <Text fontWeight="semibold">
                  Posible causa
                </Text>
                <Text fontSize="sm" color="gray.500" mt="1">
                  La opción del menú puede estar apuntando a una ruta que aún no
                  está registrada en el archivo de rutas principal.
                </Text>
              </Box>
            </HStack>
          </Box>

          <HStack gap="3" flexWrap="wrap" justify="center">
            <RouterLink to="/">
              <Button colorPalette="blue">
                <Home size={18} />
                Volver al dashboard
              </Button>
            </RouterLink>

            <RouterLink to="/rendicion-conciliacion">
              <Button variant="outline">
                Ir a Rendición y Conciliación
              </Button>
            </RouterLink>
          </HStack>
        </VStack>
      </Box>
    </Flex>
  );
}