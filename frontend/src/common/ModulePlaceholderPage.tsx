import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Icon,
  Text,
  VStack,
} from "@chakra-ui/react";
import { ArrowLeft, Construction, Layers3 } from "lucide-react";
import { useNavigate } from "react-router-dom";

type ModulePlaceholderPageProps = {
  title: string;
  moduleName: string;
  description: string;
  status?: string;
};

export function ModulePlaceholderPage({
  title,
  moduleName,
  description,
  status = "Pendiente de desarrollo",
}: ModulePlaceholderPageProps) {
  const navigate = useNavigate();

  return (
    <VStack align="stretch" gap="6">
      <Flex
        justify="space-between"
        align={{ base: "start", md: "center" }}
        direction={{ base: "column", md: "row" }}
        gap="4"
      >
        <Box>
          <HStack mb="2">
            <Badge colorPalette="blue" variant="subtle">
              {moduleName}
            </Badge>

            <Badge colorPalette="yellow" variant="subtle">
              {status}
            </Badge>
          </HStack>

          <Heading size="lg">{title}</Heading>

          <Text color="gray.500" mt="2" maxW="800px">
            {description}
          </Text>
        </Box>

        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} />
          Regresar
        </Button>
      </Flex>

      <Box
        bg="white"
        border="1px solid"
        borderColor="gray.200"
        rounded="2xl"
        p={{ base: "6", md: "10" }}
      >
        <Flex
          direction={{ base: "column", md: "row" }}
          align="center"
          gap="8"
        >
          <Box
            w="90px"
            h="90px"
            rounded="3xl"
            bg="blue.50"
            color="blue.600"
            display="flex"
            alignItems="center"
            justifyContent="center"
            flexShrink="0"
          >
            <Icon as={Construction} boxSize="42px" />
          </Box>

          <Box flex="1">
            <Heading size="md" mb="3">
              Pantalla preparada para integración
            </Heading>

            <Text color="gray.600" lineHeight="1.8">
              Esta sección ya forma parte de la estructura general del sistema.
              Su objetivo es reservar el espacio funcional dentro del frontend
              para continuar el desarrollo de forma ordenada, manteniendo la
              navegación principal alineada con los módulos definidos para el
              proyecto.
            </Text>

            <HStack mt="6" gap="3" flexWrap="wrap">
              <Badge colorPalette="blue" variant="surface" px="3" py="1">
                Frontend estructurado
              </Badge>

              <Badge colorPalette="green" variant="surface" px="3" py="1">
                Ruta registrada
              </Badge>

              <Badge colorPalette="purple" variant="surface" px="3" py="1">
                Listo para desarrollo
              </Badge>
            </HStack>
          </Box>

          <Box
            display={{ base: "none", xl: "flex" }}
            w="180px"
            h="130px"
            rounded="2xl"
            bg="gray.50"
            border="1px solid"
            borderColor="gray.100"
            alignItems="center"
            justifyContent="center"
            color="gray.400"
          >
            <Layers3 size={58} />
          </Box>
        </Flex>
      </Box>
    </VStack>
  );
}