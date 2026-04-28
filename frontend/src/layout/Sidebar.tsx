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
  BarChart3,
  ClipboardCheck,
  FileSearch,
  FileText,
  GitBranch,
  Home,
  Landmark,
  LayoutDashboard,
  LineChart,
  Settings,
  ShieldCheck,
  Users,
  Activity
} from "lucide-react";
import { ClipboardList } from "lucide-react";
import { UserCheck } from "lucide-react";


type MenuItem = {
  label: string;
  path: string;
  badge?: string;
  icon: React.ElementType;
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
    title: "Gestión de Gastos",
    items: [
      {
        label: "Planificación y Normativa",
        path: "/planificacion-normativa",
        icon: ClipboardCheck,
      },
      {
        label: "Solicitudes de gastos",
        path: "/solicitudes-gastos",
        icon: ClipboardList,
        },

        {
            label: "Autorizaciones",
            path: "/autorizaciones",
            icon: UserCheck,
     },
     {
            label: "Monitor de Estados",
            path: "/monitor-estados",
            icon: GitBranch,
    },
      {
        label: "Trazabilidad de Flujos",
        path: "/trazabilidad-flujos",
        icon: GitBranch,
      },
      {
        label: "Bitácora de Eventos",
        path: "/bitacora-eventos",
        icon: Activity,
        },
      {
        label: "Rendición y Conciliación",
        path: "/rendicion-conciliacion",
        icon: Landmark,
      },
      {
        label: "Documentos OCR",
        path: "/rendicion-conciliacion/ocr/documentos",
        badge: "OCR",
        icon: FileSearch,
      },
      {
        label: "Liquidaciones",
        path: "/rendicion-conciliacion/liquidaciones",
        icon: FileText,
      },
    ],
  },
  {
    title: "Control y Gobierno",
    items: [
      {
        label: "Control Presupuestario",
        path: "/control-presupuestario",
        icon: BarChart3,
      },
      {
        label: "Gobernanza y Configuración",
        path: "/gobernanza-configuracion",
        icon: Settings,
      },
      {
        label: "Usuarios y Accesos",
        path: "/usuarios-accesos",
        icon: Users,
      },
      {
        label: "Reportes y Analítica",
        path: "/reportes-analitica",
        icon: LineChart,
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
    >
      <Flex align="center" gap="3" mb="8">
        <Image
          src="/images/logo-servicios-compartidos.jpg"
          alt="Servicios Compartidos"
          maxW="200px"
          rounded="md"
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
                <NavItem
                  key={item.path}
                  label={item.label}
                  path={item.path}
                  badge={item.badge}
                  icon={item.icon}
                />
              ))}
            </VStack>
          </Box>
        ))}
      </VStack>
    </Box>
  );
}

function NavItem({ label, path, badge, icon: Icon }: MenuItem) {
  return (
    <NavLink to={path}>
      {({ isActive }) => (
        <Flex
          align="center"
          justify="space-between"
          gap="2"
          px="3"
          py="2.5"
          rounded="lg"
          bg={isActive ? "blue.50" : "transparent"}
          color={isActive ? "blue.700" : "gray.700"}
          fontWeight={isActive ? "semibold" : "medium"}
          _hover={{
            bg: isActive ? "blue.50" : "gray.50",
            textDecoration: "none",
          }}
        >
          <Flex align="center" gap="3">
            <Icon size={18} />
            <Text fontSize="sm">{label}</Text>
          </Flex>

          {badge && (
            <Badge size="sm" colorPalette="blue">
              {badge}
            </Badge>
          )}
        </Flex>
      )}
    </NavLink>
  );
}