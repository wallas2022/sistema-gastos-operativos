import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react";
import { Link } from "react-router-dom";

const kpis = [
  {
    label: "Solicitudes pendientes",
    value: "18",
    description: "Solicitudes de gasto en proceso",
  },
  {
    label: "Aprobaciones pendientes",
    value: "11",
    description: "Pendientes de autorización",
  },
  {
    label: "Liquidaciones abiertas",
    value: "9",
    description: "Procesos pendientes de cierre",
  },
  {
    label: "Presupuesto ejecutado",
    value: "Q 6,700,000",
    description: "67% del presupuesto anual",
  },
];

const modules = [
  {
    name: "Planificación y Normativa",
    status: "Diseño",
    description: "Reglas, políticas y simulación de gastos.",
    path: "/planificacion-normativa",
  },
  {
    name: "Trazabilidad de Flujos",
    status: "Diseño",
    description: "Aprobaciones, estados, SLA y bitácora.",
    path: "/trazabilidad-flujos",
  },
  {
    name: "Rendición y Conciliación",
    status: "En integración",
    description: "Liquidaciones, comprobantes y OCR.",
    path: "/rendicion-conciliacion",
  },
  {
    name: "Control Presupuestario",
    status: "Diseño",
    description: "Presupuesto proyectado, ejecutado y desvíos.",
    path: "/control-presupuestario",
  },
  {
    name: "Gobernanza y Configuración",
    status: "Diseño",
    description: "Empresas, centros de costo, roles y reglas.",
    path: "/gobernanza-configuracion",
  },
  {
    name: "Reportes y Analítica",
    status: "Diseño",
    description: "KPIs, exportaciones y análisis financiero.",
    path: "/reportes-analitica",
  },
];

const activities = [
  {
    title: "OCR confirmado",
    description: "Documento FEL-001 procesado y confirmado para liquidación.",
    time: "Hace 10 min",
  },
  {
    title: "Solicitud enviada",
    description: "Nueva solicitud de gasto registrada por el área Comercial.",
    time: "Hace 35 min",
  },
  {
    title: "Aprobación pendiente",
    description: "Solicitud SG-2026-0008 espera autorización de Gerencia.",
    time: "Hace 1 h",
  },
  {
    title: "Presupuesto actualizado",
    description: "Centro de costo Administración recibió ajuste presupuestario.",
    time: "Hoy",
  },
];

export function DashboardPage() {
  return (
    <Box>
      <Flex
        justify="space-between"
        align={{ base: "flex-start", md: "center" }}
        gap="4"
        mb="6"
        direction={{ base: "column", md: "row" }}
      >
        <Box>
          <Heading size="lg">Dashboard General</Heading>
          <Text color="gray.500" mt="1">
            Vista ejecutiva del sistema de gestión y control presupuestario de
            gastos operativos.
          </Text>
        </Box>

        <HStack>
          <Link to="/rendicion-conciliacion/ocr/documentos">
            <Button colorPalette="blue">Subir comprobante OCR</Button>
          </Link>

          <Link to="/planificacion-normativa">
            <Button variant="outline">Nueva solicitud</Button>
          </Link>
        </HStack>
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} gap="4" mb="6">
        {kpis.map((item) => (
          <Box
            key={item.label}
            bg="white"
            p="5"
            rounded="xl"
            border="1px solid"
            borderColor="gray.200"
          >
            <Text fontSize="sm" color="gray.500">
              {item.label}
            </Text>
            <Text fontSize="2xl" fontWeight="bold" mt="2">
              {item.value}
            </Text>
            <Text fontSize="sm" color="gray.500" mt="1">
              {item.description}
            </Text>
          </Box>
        ))}
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, xl: 3 }} gap="4">
        <Box
          gridColumn={{ base: "span 1", xl: "span 2" }}
          bg="white"
          p="5"
          rounded="xl"
          border="1px solid"
          borderColor="gray.200"
        >
          <Flex justify="space-between" align="center" mb="4">
            <Box>
              <Heading size="md">Estado de módulos</Heading>
              <Text fontSize="sm" color="gray.500">
                Mapa funcional del sistema y avance visual de integración.
              </Text>
            </Box>
          </Flex>

          <SimpleGrid columns={{ base: 1, md: 2 }} gap="4">
            {modules.map((module) => (
              <Link key={module.name} to={module.path}>
                <Box
                  p="4"
                  rounded="lg"
                  border="1px solid"
                  borderColor="gray.200"
                  _hover={{
                    borderColor: "blue.300",
                    bg: "blue.50",
                  }}
                >
                  <Flex justify="space-between" align="flex-start" gap="3">
                    <Box>
                      <Text fontWeight="semibold">{module.name}</Text>
                      <Text fontSize="sm" color="gray.500" mt="1">
                        {module.description}
                      </Text>
                    </Box>

                    <Badge
                      colorPalette={
                        module.status === "En integración" ? "green" : "gray"
                      }
                    >
                      {module.status}
                    </Badge>
                  </Flex>
                </Box>
              </Link>
            ))}
          </SimpleGrid>
        </Box>

        <VStack align="stretch" gap="4">
          <Box
            bg="white"
            p="5"
            rounded="xl"
            border="1px solid"
            borderColor="gray.200"
          >
            <Heading size="md">Actividad reciente</Heading>
            <VStack align="stretch" gap="4" mt="4">
              {activities.map((activity) => (
                <Box
                  key={activity.title}
                  borderLeft="3px solid"
                  borderColor="blue.500"
                  pl="3"
                >
                  <Flex justify="space-between" gap="3">
                    <Text fontWeight="semibold" fontSize="sm">
                      {activity.title}
                    </Text>
                    <Text fontSize="xs" color="gray.400">
                      {activity.time}
                    </Text>
                  </Flex>
                  <Text fontSize="sm" color="gray.500" mt="1">
                    {activity.description}
                  </Text>
                </Box>
              ))}
            </VStack>
          </Box>

          <Box
            bg="white"
            p="5"
            rounded="xl"
            border="1px solid"
            borderColor="gray.200"
          >
            <Heading size="md">Accesos rápidos</Heading>

            <VStack align="stretch" gap="2" mt="4">
              <Link to="/planificacion-normativa">
                <Button w="100%" justifyContent="flex-start" variant="ghost">
                  Nueva solicitud de gasto
                </Button>
              </Link>

              <Link to="/rendicion-conciliacion">
                <Button w="100%" justifyContent="flex-start" variant="ghost">
                  Nueva liquidación
                </Button>
              </Link>

              <Link to="/rendicion-conciliacion/ocr/documentos">
                <Button w="100%" justifyContent="flex-start" variant="ghost">
                  Subir comprobante OCR
                </Button>
              </Link>

              <Link to="/trazabilidad-flujos">
                <Button w="100%" justifyContent="flex-start" variant="ghost">
                  Ver autorizaciones
                </Button>
              </Link>

              <Link to="/control-presupuestario">
                <Button w="100%" justifyContent="flex-start" variant="ghost">
                  Ver presupuesto
                </Button>
              </Link>
            </VStack>
          </Box>
        </VStack>
      </SimpleGrid>
    </Box>
  );
}