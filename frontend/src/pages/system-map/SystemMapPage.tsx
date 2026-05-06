import {
  Box,
  Button,
  Flex,
  Grid,
  Heading,
  HStack,
  Icon,
  SimpleGrid,
  Text,
  VStack,
  Badge,
} from "@chakra-ui/react";
import {
  LayoutDashboard,
  ShieldCheck,
  ClipboardList,
  Calculator,
  ScrollText,
  FileSearch,
  CheckCircle2,
  GitBranch,
  Activity,
  Clock,
  WalletCards,
  FileText,
  BarChart3,
  BrainCircuit,
  ArrowRight,
  Map,
  FileCheck2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

type SystemMapOption = {
  title: string;
  description: string;
  path: string;
  icon: React.ElementType;
  status?: string;
};

type SystemMapGroup = {
  title: string;
  description: string;
  path: string;
  icon: React.ElementType;
  color: string;
  options: SystemMapOption[];
};

const systemMap: SystemMapGroup[] = [
  {
    title: "Dashboard",
    description:
      "Vista general del sistema con indicadores principales, accesos rápidos y resumen operativo.",
    path: "/dashboard",
    icon: LayoutDashboard,
    color: "blue",
    options: [
      {
        title: "Panel principal",
        description:
          "Muestra métricas generales, accesos rápidos y resumen del comportamiento del sistema.",
        path: "/dashboard",
        icon: LayoutDashboard,
        status: "Disponible",
      },
    ],
  },
  {
    title: "Planificación y Normativa",
    description:
      "Módulo encargado del registro inicial de solicitudes de gasto, validación normativa y revisión presupuestaria previa.",
    path: "/planificacion-normativa",
    icon: ShieldCheck,
    color: "blue",
    options: [
      {
        title: "Panel del módulo",
        description:
          "Presenta resumen de solicitudes abiertas, pendientes, aprobadas y observadas.",
        path: "/planificacion-normativa",
        icon: LayoutDashboard,
        status: "Disponible",
      },
      {
        title: "Nueva solicitud",
        description:
          "Permite registrar solicitudes de gastos según su tipo: viaje, proveedor o insumo.",
        path: "/solicitudes-gastos/nueva",
        icon: ClipboardList,
        status: "Disponible",
      },
      {
        title: "Solicitudes de gastos",
        description:
          "Lista las solicitudes registradas y permite consultar el detalle de cada expediente.",
        path: "/solicitudes-gastos",
        icon: FileText,
        status: "Disponible",
      },
      {
        title: "Simulador de gastos",
        description:
          "Permite calcular montos estimados antes de generar una solicitud formal.",
        path: "/simulador-gastos",
        icon: Calculator,
        status: "Simulado",
      },
      {
        title: "Políticas y reglas",
        description:
          "Administra o consulta reglas internas por empresa, tipo de gasto, rol o jerarquía.",
        path: "/politicas-reglas",
        icon: ScrollText,
        status: "Pendiente",
      },
      {
        title: "Verificador presupuestario",
        description:
          "Consulta disponibilidad presupuestaria contra centro de costo, cuenta y presupuesto operativo.",
        path: "/verificador-presupuestario",
        icon: WalletCards,
        status: "Simulado",
      },
    ],
  },
  {
    title: "Trazabilidad de Flujos",
    description:
      "Módulo orientado al seguimiento del estado de cada solicitud, eventos del proceso y control de tiempos.",
    path: "/trazabilidad-flujos",
    icon: GitBranch,
    color: "purple",
    options: [
      {
        title: "Centro de autorizaciones",
        description:
          "Centraliza solicitudes pendientes de aprobación, observación o rechazo.",
        path: "/centro-autorizaciones",
        icon: CheckCircle2,
        status: "Pendiente",
      },
      {
        title: "Monitor de estados",
        description:
          "Permite visualizar el estado actual de las solicitudes dentro del flujo.",
        path: "/monitor-estados",
        icon: Activity,
        status: "Pendiente",
      },
      {
        title: "Escalamientos SLA",
        description:
          "Controla tiempos máximos de atención y posibles alertas por vencimiento.",
        path: "/escalamientos-sla",
        icon: Clock,
        status: "Pendiente",
      },
      {
        title: "Bitácora de eventos",
        description:
          "Muestra el historial de acciones realizadas sobre cada solicitud.",
        path: "/bitacora-eventos",
        icon: FileSearch,
        status: "Parcial",
      },
    ],
  },
  {
    title: "Rendición y Conciliación Financiera",
    description:
      "Módulo enfocado en documentos OCR, liquidaciones, conciliación de anticipos y cierres certificados.",
    path: "/rendicion-conciliacion",
    icon: FileCheck2,
    color: "green",
    options: [
      {
        title: "Panel del módulo",
        description:
          "Resume documentos procesados, liquidaciones pendientes y conciliaciones en curso.",
        path: "/rendicion-conciliacion",
        icon: LayoutDashboard,
        status: "Pendiente",
      },
      {
        title: "Documentos OCR",
        description:
          "Permite cargar documentos, procesarlos con OCR y confirmar la información extraída.",
        path: "/documents",
        icon: FileSearch,
        status: "Disponible",
      },
      {
        title: "Liquidaciones",
        description:
          "Gestiona la rendición de gastos asociados a solicitudes aprobadas.",
        path: "/liquidaciones",
        icon: FileText,
        status: "Pendiente",
      },
      {
        title: "Conciliación de anticipos",
        description:
          "Compara anticipos entregados contra documentos liquidados y saldos finales.",
        path: "/conciliacion-anticipos",
        icon: WalletCards,
        status: "Pendiente",
      },
      {
        title: "Cierres certificados",
        description:
          "Genera cierres formales de expedientes con respaldo documental.",
        path: "/cierres-certificados",
        icon: FileCheck2,
        status: "Pendiente",
      },
    ],
  },
  {
    title: "Control Presupuestario e Inteligencia",
    description:
      "Módulo de análisis presupuestario, seguimiento de ejecución, indicadores y apoyo a la toma de decisiones.",
    path: "/control-presupuestario",
    icon: BarChart3,
    color: "orange",
    options: [
      {
        title: "Panel presupuestario",
        description:
          "Visualiza presupuesto asignado, ejecutado, comprometido y disponible.",
        path: "/control-presupuestario",
        icon: BarChart3,
        status: "Pendiente",
      },
      {
        title: "Indicadores de gasto",
        description:
          "Presenta métricas por empresa, centro de costo, cuenta, rubro y periodo.",
        path: "/indicadores-gasto",
        icon: Activity,
        status: "Pendiente",
      },
      {
        title: "Inteligencia financiera",
        description:
          "Apoya el análisis de tendencias, desviaciones y comportamiento del gasto.",
        path: "/inteligencia-financiera",
        icon: BrainCircuit,
        status: "Pendiente",
      },
    ],
  },
];

export default function SystemMapPage() {
  const navigate = useNavigate();

  return (
    <Box p={{ base: 4, md: 6 }} bg="gray.50" minH="100vh">
      <Flex
        justify="space-between"
        align={{ base: "flex-start", md: "center" }}
        direction={{ base: "column", md: "row" }}
        gap="4"
        mb="6"
      >
        <Box>
          <HStack gap="3" mb="2">
            <Flex
              w="42px"
              h="42px"
              rounded="xl"
              bg="blue.50"
              align="center"
              justify="center"
            >
              <Icon as={Map} boxSize="22px" color="blue.600" />
            </Flex>

            <Box>
              <Heading size="lg">Mapa del sistema</Heading>
              <Text color="gray.600" fontSize="sm">
                Vista agrupada de módulos, opciones principales y accesos
                directos del sistema.
              </Text>
            </Box>
          </HStack>
        </Box>

        <Button colorPalette="blue" onClick={() => navigate("/dashboard")}>
          Ir al dashboard
        </Button>
      </Flex>

      <SimpleGrid columns={{ base: 1, xl: 2 }} gap="5">
        {systemMap.map((group) => (
          <Box
            key={group.title}
            bg="white"
            border="1px solid"
            borderColor="gray.200"
            rounded="2xl"
            p="5"
            boxShadow="sm"
          >
            <Flex justify="space-between" align="flex-start" gap="4" mb="5">
              <HStack align="flex-start" gap="3">
                <Flex
                  w="44px"
                  h="44px"
                  rounded="xl"
                  bg={`${group.color}.50`}
                  align="center"
                  justify="center"
                  flexShrink={0}
                >
                  <Icon
                    as={group.icon}
                    boxSize="22px"
                    color={`${group.color}.600`}
                  />
                </Flex>

                <Box>
                  <Heading size="md">{group.title}</Heading>
                  <Text color="gray.600" fontSize="sm" mt="1">
                    {group.description}
                  </Text>
                </Box>
              </HStack>

              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate(group.path)}
              >
                Abrir
              </Button>
            </Flex>

            <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap="3">
              {group.options.map((option) => (
                <Box
                  key={`${group.title}-${option.title}`}
                  border="1px solid"
                  borderColor="gray.200"
                  rounded="xl"
                  p="4"
                  cursor="pointer"
                  transition="all 0.2s ease"
                  _hover={{
                    borderColor: `${group.color}.300`,
                    bg: `${group.color}.50`,
                    transform: "translateY(-2px)",
                  }}
                  onClick={() => navigate(option.path)}
                >
                  <Flex justify="space-between" align="flex-start" gap="3">
                    <HStack align="flex-start" gap="3">
                      <Flex
                        w="36px"
                        h="36px"
                        rounded="lg"
                        bg="gray.50"
                        align="center"
                        justify="center"
                        flexShrink={0}
                      >
                        <Icon
                          as={option.icon}
                          boxSize="18px"
                          color={`${group.color}.600`}
                        />
                      </Flex>

                      <VStack align="flex-start" gap="1">
                        <HStack gap="2" flexWrap="wrap">
                          <Text fontWeight="semibold" fontSize="sm">
                            {option.title}
                          </Text>

                          {option.status && (
                            <Badge
                              size="sm"
                              colorPalette={getStatusColor(option.status)}
                            >
                              {option.status}
                            </Badge>
                          )}
                        </HStack>

                        <Text fontSize="xs" color="gray.600">
                          {option.description}
                        </Text>
                      </VStack>
                    </HStack>

                    <Icon
                      as={ArrowRight}
                      boxSize="16px"
                      color="gray.400"
                      flexShrink={0}
                    />
                  </Flex>
                </Box>
              ))}
            </Grid>
          </Box>
        ))}
      </SimpleGrid>
    </Box>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case "Disponible":
      return "green";
    case "Parcial":
      return "yellow";
    case "Simulado":
      return "blue";
    case "Pendiente":
      return "gray";
    default:
      return "gray";
  }
}