import {
  Badge,
  Box,
  Button,
  Flex,
  Grid,
  Heading,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  ClipboardCheck,
  ClipboardList,
  FileSearch,
  GitBranch,
  Landmark,
  LayoutDashboard,
  LineChart,
  ReceiptText,
  ShieldCheck,
  Users,
  WalletCards,
} from "lucide-react";

const stats = [
  {
    label: "Solicitudes pendientes",
    value: "18",
    description: "Solicitudes de gasto en proceso",
    color: "blue",
    icon: ClipboardList,
  },
  {
    label: "Aprobaciones pendientes",
    value: "11",
    description: "Pendientes de autorización",
    color: "purple",
    icon: ClipboardCheck,
  },
  {
    label: "Liquidaciones abiertas",
    value: "9",
    description: "Expedientes financieros activos",
    color: "green",
    icon: ReceiptText,
  },
  {
    label: "Presupuesto ejecutado",
    value: "Q 6,700,000",
    description: "67% del presupuesto anual",
    color: "orange",
    icon: BarChart3,
  },
];

const modules = [
  {
    title: "Planificación y Normativa",
    code: "MPN",
    description:
      "Registro inteligente de gastos, políticas, simulador y validación presupuestaria.",
    path: "/planificacion-normativa",
    icon: ShieldCheck,
    color: "blue",
  },
  {
    title: "Trazabilidad de Flujos",
    code: "MOTF",
    description:
      "Autorizaciones, estados, escalamientos SLA y bitácora de eventos.",
    path: "/monitor-estados",
    icon: GitBranch,
    color: "purple",
  },
  {
    title: "Rendición y Conciliación Financiera",
    code: "MRCF",
    description:
      "Carga OCR, liquidaciones, anticipos y cierres certificados.",
    path: "/rendicion-conciliacion",
    icon: WalletCards,
    color: "green",
  },
  {
    title: "Control Presupuestario e Inteligencia",
    code: "MCPIN",
    description:
      "Dashboards de ejecución, análisis histórico, APIs y proyección de desvíos.",
    path: "/control-presupuestario",
    icon: LineChart,
    color: "orange",
  },
  {
    title: "Gobernanza y Configuración",
    code: "MGCE",
    description:
      "Empresas, centros de costo, matriz de roles y auditoría del sistema.",
    path: "/gobernanza-configuracion",
    icon: Landmark,
    color: "cyan",
  },
  {
    title: "Usuarios y Control de Accesos",
    code: "Transversal",
    description:
      "Usuarios, roles, permisos, delegaciones y bitácora de accesos.",
    path: "/usuarios-accesos",
    icon: Users,
    color: "gray",
  },
];

const quickActions = [
  {
    label: "Nueva solicitud de gasto",
    path: "/solicitudes-gastos/nueva",
    icon: ClipboardList,
  },
  {
    label: "Subir comprobante OCR",
    path: "/rendicion-conciliacion/ocr/documentos",
    icon: FileSearch,
  },
  {
    label: "Nueva liquidación",
    path: "/rendicion-conciliacion/liquidaciones/nueva",
    icon: ReceiptText,
  },
  {
    label: "Ver autorizaciones",
    path: "/autorizaciones",
    icon: ClipboardCheck,
  },
];

export function DashboardPage() {
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
              Vista general
            </Badge>
            <Badge colorPalette="green" variant="subtle">
              Sistema operativo
            </Badge>
          </HStack>

          <Heading size="lg">Dashboard General</Heading>

          <Text color="gray.500" mt="1">
            Vista central del comportamiento de solicitudes, aprobaciones,
            liquidaciones, documentos OCR y ejecución presupuestaria.
          </Text>
        </Box>

        <RouterLink to="/rendicion-conciliacion/ocr/documentos">
          <Button colorPalette="blue">
            <FileSearch size={18} />
            Ir a documentos OCR
          </Button>
        </RouterLink>
      </Flex>

      <Grid
        templateColumns={{
          base: "1fr",
          md: "repeat(2, 1fr)",
          xl: "repeat(4, 1fr)",
        }}
        gap="4"
      >
        {stats.map((item) => (
          <StatCard key={item.label} {...item} />
        ))}
      </Grid>

      <Grid templateColumns={{ base: "1fr", xl: "1.6fr 1fr" }} gap="5">
        <Box
          bg="white"
          border="1px solid"
          borderColor="gray.200"
          rounded="2xl"
          p="5"
        >
          <Flex justify="space-between" align="center" mb="5">
            <Box>
              <Heading size="md">Mapa funcional del sistema</Heading>
              <Text fontSize="sm" color="gray.500">
                Organización general de los módulos definidos para el sistema.
              </Text>
            </Box>

            <LayoutDashboard size={24} color="#2563eb" />
          </Flex>

          <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap="4">
            {modules.map((item) => (
              <ModuleCard key={item.title} {...item} />
            ))}
          </Grid>
        </Box>

        <VStack align="stretch" gap="5">
          <Box
            bg="white"
            border="1px solid"
            borderColor="gray.200"
            rounded="2xl"
            p="5"
          >
            <Heading size="md">Accesos rápidos</Heading>

            <Text fontSize="sm" color="gray.500" mt="1" mb="5">
              Acciones frecuentes para operar el sistema.
            </Text>

            <VStack align="stretch" gap="3">
              {quickActions.map((item) => {
                const Icon = item.icon;

                return (
                  <RouterLink key={item.path} to={item.path}>
                    <Flex
                      align="center"
                      justify="space-between"
                      border="1px solid"
                      borderColor="gray.100"
                      rounded="xl"
                      p="3"
                      _hover={{
                        bg: "blue.50",
                        borderColor: "blue.200",
                      }}
                    >
                      <HStack>
                        <Box
                          w="36px"
                          h="36px"
                          rounded="lg"
                          bg="blue.50"
                          color="blue.600"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <Icon size={18} />
                        </Box>

                        <Text fontSize="sm" fontWeight="medium">
                          {item.label}
                        </Text>
                      </HStack>

                      <ArrowRight size={17} />
                    </Flex>
                  </RouterLink>
                );
              })}
            </VStack>
          </Box>

          <Box
            bg="blue.600"
            color="white"
            rounded="2xl"
            p="5"
            position="relative"
            overflow="hidden"
          >
            <Box
              position="absolute"
              right="-30px"
              top="-30px"
              w="120px"
              h="120px"
              rounded="full"
              bg="whiteAlpha.200"
            />

            <Heading size="md">OCR integrado al proceso</Heading>

            <Text fontSize="sm" mt="2" color="whiteAlpha.900">
              El módulo OCR ya queda ubicado dentro de Rendición y Conciliación
              Financiera como soporte para comprobar gastos ejecutados y crear
              liquidaciones.
            </Text>

            <RouterLink to="/rendicion-conciliacion/ocr/documentos">
              <Button mt="5" bg="white" color="blue.700" variant="solid">
                Ver documentos OCR
              </Button>
            </RouterLink>
          </Box>
        </VStack>
      </Grid>
    </VStack>
  );
}

function StatCard({
  label,
  value,
  description,
  color,
  icon: Icon,
}: {
  label: string;
  value: string;
  description: string;
  color: string;
  icon: React.ElementType;
}) {
  return (
    <Box
      bg="white"
      border="1px solid"
      borderColor="gray.200"
      rounded="2xl"
      p="5"
    >
      <Flex justify="space-between" align="start">
        <Box>
          <Text fontSize="sm" color="gray.500">
            {label}
          </Text>

          <Heading size="lg" mt="2">
            {value}
          </Heading>

          <Text fontSize="sm" color="gray.500" mt="2">
            {description}
          </Text>
        </Box>

        <Box
          w="42px"
          h="42px"
          rounded="xl"
          bg={`${color}.50`}
          color={`${color}.600`}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Icon size={21} />
        </Box>
      </Flex>
    </Box>
  );
}

function ModuleCard({
  title,
  code,
  description,
  path,
  icon: Icon,
  color,
}: {
  title: string;
  code: string;
  description: string;
  path: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <RouterLink to={path}>
      <Box
        border="1px solid"
        borderColor="gray.100"
        rounded="2xl"
        p="4"
        h="100%"
        _hover={{
          borderColor: `${color}.300`,
          bg: `${color}.50`,
          transform: "translateY(-2px)",
        }}
        transition="all 0.2s ease"
      >
        <Flex justify="space-between" align="start" mb="4">
          <Box
            w="44px"
            h="44px"
            rounded="xl"
            bg={`${color}.50`}
            color={`${color}.600`}
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Icon size={22} />
          </Box>

          <Badge colorPalette={color === "gray" ? "gray" : color} variant="subtle">
            {code}
          </Badge>
        </Flex>

        <Text fontWeight="semibold">{title}</Text>

        <Text fontSize="sm" color="gray.500" mt="2" lineHeight="1.6">
          {description}
        </Text>
      </Box>
    </RouterLink>
  );
}