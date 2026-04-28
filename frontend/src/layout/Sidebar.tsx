import {
  Badge,
  Box,
  Flex,
  Image,
  Text,
  VStack,
} from "@chakra-ui/react";
import { NavLink } from "react-router-dom";
import {
  Activity,
  BarChart3,
  Building2,
  ChartLine,
  ClipboardCheck,
  ClipboardList,
  FileCheck,
  FileSearch,
  FileText,
  FolderArchive,
  GitBranch,
  Home,
  Landmark,
  LayoutDashboard,
  LineChart,
  LockKeyhole,
  Network,
  PieChart,
  ReceiptText,
  Route,
  Scale,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  TrendingUp,
  Users,
  WalletCards,
} from "lucide-react";

type MenuItem = {
  label: string;
  path: string;
  icon: React.ElementType;
  badge?: string;
};

type MenuGroup = {
  title: string;
  items: MenuItem[];
};

const menuGroups: MenuGroup[] = [
  {
    title: "Inicio",
    items: [
      {
        label: "Dashboard",
        path: "/",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: "Planificación y Normativa",
    items: [
      {
        label: "Planificación y Normativa",
        path: "/planificacion-normativa",
        icon: ShieldCheck,
      },
      {
        label: "Solicitudes de gastos",
        path: "/solicitudes-gastos",
        icon: ClipboardList,
      },
      {
        label: "Simulador de gastos",
        path: "/simulador-gastos",
        icon: SlidersHorizontal,
      },
      {
        label: "Políticas y reglas",
        path: "/politicas-reglas",
        icon: FileText,
      },
      {
        label: "Verificador presupuestario",
        path: "/verificador-presupuestario",
        icon: Scale,
      },
    ],
  },
  {
    title: "Trazabilidad de Flujos",
    items: [
      {
        label: "Centro de autorizaciones",
        path: "/autorizaciones",
        icon: ClipboardCheck,
      },
      {
        label: "Monitor de estados",
        path: "/monitor-estados",
        icon: Route,
      },
      {
        label: "Escalamientos SLA",
        path: "/escalamientos-sla",
        icon: GitBranch,
      },
      {
        label: "Bitácora de eventos",
        path: "/bitacora-eventos",
        icon: Activity,
      },
    ],
  },
  {
    title: "Rendición y Conciliación Financiera",
    items: [
      {
        label: "Rendición y conciliación",
        path: "/rendicion-conciliacion",
        icon: WalletCards,
      },
      {
        label: "Documentos OCR",
        path: "/rendicion-conciliacion/ocr/documentos",
        icon: FileSearch,
        badge: "OCR",
      },
      {
        label: "Liquidaciones",
        path: "/rendicion-conciliacion/liquidaciones",
        icon: ReceiptText,
      },
      {
        label: "Conciliación de anticipos",
        path: "/rendicion-conciliacion/anticipos",
        icon: FileCheck,
      },
      {
        label: "Cierres certificados",
        path: "/rendicion-conciliacion/cierres-certificados",
        icon: FolderArchive,
      },
    ],
  },
  {
    title: "Control Presupuestario e Inteligencia",
    items: [
      {
        label: "Control presupuestario",
        path: "/control-presupuestario",
        icon: BarChart3,
      },
      {
        label: "Ejecución presupuestaria",
        path: "/ejecucion-presupuestaria",
        icon: PieChart,
      },
      {
        label: "Actual vs proyectado",
        path: "/actual-vs-proyectado",
        icon: ChartLine,
      },
      {
        label: "Interoperabilidad API",
        path: "/interoperabilidad-api",
        icon: Network,
      },
      {
        label: "Proyección de desvíos",
        path: "/proyeccion-desvios",
        icon: TrendingUp,
      },
    ],
  },
  {
    title: "Gobernanza y Configuración",
    items: [
      {
        label: "Gobernanza y configuración",
        path: "/gobernanza-configuracion",
        icon: Settings,
      },
      {
        label: "Empresas y unidades",
        path: "/empresas-unidades",
        icon: Building2,
      },
      {
        label: "Centros de costo",
        path: "/centros-costo",
        icon: Landmark,
      },
      {
        label: "Matriz de roles",
        path: "/matriz-roles",
        icon: Users,
      },
      {
        label: "Auditoría del sistema",
        path: "/auditoria-sistema",
        icon: Activity,
      },
    ],
  },
  {
    title: "Seguridad y Usuarios",
    items: [
      {
        label: "Usuarios y accesos",
        path: "/usuarios-accesos",
        icon: Users,
      },
      {
        label: "Roles y permisos",
        path: "/roles-permisos",
        icon: LockKeyhole,
      },
      {
        label: "Delegaciones temporales",
        path: "/delegaciones-temporales",
        icon: GitBranch,
      },
      {
        label: "Bitácora de accesos",
        path: "/bitacora-accesos",
        icon: Activity,
      },
    ],
  },
  {
    title: "Reportes y Analítica",
    items: [
      {
        label: "Reportes y analítica",
        path: "/reportes-analitica",
        icon: LineChart,
      },
      {
        label: "KPIs ejecutivos",
        path: "/kpis-ejecutivos",
        icon: BarChart3,
      },
      {
        label: "Reportes de auditoría",
        path: "/reportes-auditoria",
        icon: FileCheck,
      },
      {
        label: "Exportaciones",
        path: "/exportaciones",
        icon: FileText,
      },
    ],
  },
];

export function Sidebar() {
  return (
    <Box
      w="280px"
      minH="100vh"
      bg="white"
      borderRight="1px solid"
      borderColor="gray.200"
      px="4"
      py="5"
      position="fixed"
      left="0"
      top="0"
      overflowY="auto"
    >
      <Flex align="center" gap="3" mb="8">
        <Image
          src="/logo-servicios-compartidos.jpg"
          alt="Servicios Compartidos"
          maxW="180px"
          objectFit="contain"
        />
      </Flex>

      <VStack align="stretch" gap="6">
        {menuGroups.map((group) => (
          <Box key={group.title}>
            <Text
              fontSize="xs"
              fontWeight="bold"
              color="gray.400"
              textTransform="uppercase"
              mb="2"
              px="2"
            >
              {group.title}
            </Text>

            <VStack align="stretch" gap="1">
              {group.items.map((item) => (
                <SidebarItem key={item.path} item={item} />
              ))}
            </VStack>
          </Box>
        ))}
      </VStack>
    </Box>
  );
}

function SidebarItem({ item }: { item: MenuItem }) {
  const Icon = item.icon;

  return (
    <NavLink to={item.path}>
      {({ isActive }) => (
        <Flex
          align="center"
          justify="space-between"
          gap="3"
          px="3"
          py="2.5"
          rounded="xl"
          fontSize="sm"
          fontWeight={isActive ? "semibold" : "medium"}
          color={isActive ? "blue.700" : "gray.700"}
          bg={isActive ? "blue.50" : "transparent"}
          _hover={{
            bg: isActive ? "blue.50" : "gray.50",
            color: "blue.700",
          }}
          transition="all 0.2s ease"
        >
          <Flex align="center" gap="3">
            <Box
              color={isActive ? "blue.600" : "gray.500"}
              display="flex"
              alignItems="center"
            >
              <Icon size={17} />
            </Box>

            <Text>{item.label}</Text>
          </Flex>

          {item.badge && (
            <Badge size="sm" colorPalette="blue" variant="subtle">
              {item.badge}
            </Badge>
          )}
        </Flex>
      )}
    </NavLink>
  );
}