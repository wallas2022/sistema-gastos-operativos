import { Badge, Box, Flex, Image, Text, VStack } from "@chakra-ui/react";
import { NavLink, useLocation } from "react-router-dom";
import { useState } from "react";
import {
  Activity,
  BarChart3,
  ChartLine,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  FileCheck,
  FileSearch,
  FileText,
  FolderArchive,
  GitBranch,
  LayoutDashboard,
  LineChart,
  Network,
  PieChart,
  ReceiptText,
  Route,
  Scale,
  ShieldCheck,
  SlidersHorizontal,
  TrendingUp,
  WalletCards,
} from "lucide-react";

type MenuChild = {
  label: string;
  path: string;
  icon: React.ElementType;
  badge?: string;
};

type MenuGroup = {
  title: string;
  icon: React.ElementType;
  path?: string;
  children?: MenuChild[];
};

type SidebarProps = {
  isCollapsed?: boolean;
};

const menuGroups: MenuGroup[] = [
  {
    title: "Dashboard",
    path: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Planificación y Normativa",
    icon: ShieldCheck,
    children: [
      {
        label: "Panel del módulo",
        path: "/planificacion-normativa",
        icon: ShieldCheck,
      },
      {
        label: "Nueva solicitud",
        path: "/solicitudes-gastos/nueva",
        icon: ClipboardCheck,
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
    icon: GitBranch,
    children: [
      {
        label: "Centro de autorizaciones",
        path: "/trazabilidad-flujos/autorizaciones",
        icon: ClipboardCheck,
      },
      {
        label: "Monitor de estados",
        path: "/trazabilidad-flujos/monitor-estados",
        icon: Route,
      },
      {
        label: "Escalamientos SLA",
        path: "/trazabilidad-flujos/escalamientos",
        icon: GitBranch,
      },
      {
        label: "Bitácora de eventos",
        path: "/trazabilidad-flujos/bitacora",
        icon: Activity,
      },
    ],
  },
  {
    title: "Rendición y Conciliación Financiera",
    icon: WalletCards,
    children: [
      {
        label: "Panel del módulo",
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
    icon: BarChart3,
    children: [
      {
        label: "Panel del módulo",
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
      {
        label: "Reportes y analítica",
        path: "/reportes-analitica",
        icon: LineChart,
      },
    ],
  },
];

export function Sidebar({ isCollapsed = false }: SidebarProps) {
  const location = useLocation();

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    "Planificación y Normativa": true,
    "Trazabilidad de Flujos": true,
    "Rendición y Conciliación Financiera": true,
    "Control Presupuestario e Inteligencia": true,
  });

  const toggleGroup = (title: string) => {
    setOpenGroups((previous) => ({
      ...previous,
      [title]: !previous[title],
    }));
  };

  const isGroupActive = (group: MenuGroup) => {
    if (group.path) {
      return location.pathname === group.path;
    }

    return group.children?.some((child) =>
      location.pathname.startsWith(child.path)
    );
  };

  return (
    <Box
      w={isCollapsed ? "88px" : "280px"}
      minH="100vh"
      bg="white"
      borderRight="1px solid"
      borderColor="gray.200"
      px={isCollapsed ? "3" : "4"}
      py="5"
      position="fixed"
      left="0"
      top="0"
      overflowY="auto"
      transition="width 0.2s ease"
    >
      <Flex
        align="center"
        justify={isCollapsed ? "center" : "flex-start"}
        mb="8"
      >
        <Image
          src="/images/logo-servicios-compartidos.jpg"
          alt="Servicios Compartidos"
          maxW={isCollapsed ? "46px" : "180px"}
          maxH={isCollapsed ? "46px" : "70px"}
          objectFit="contain"
          transition="all 0.2s ease"
        />
      </Flex>

      <VStack align="stretch" gap="2">
        {menuGroups.map((group) => {
          const Icon = group.icon;
          const activeGroup = isGroupActive(group);
          const isOpen = openGroups[group.title];

          if (group.path) {
            return (
              <NavLink
                key={group.title}
                to={group.path}
                title={isCollapsed ? group.title : undefined}
              >
                {({ isActive }) => (
                  <Flex
                    align="center"
                    justify={isCollapsed ? "center" : "flex-start"}
                    gap="3"
                    px={isCollapsed ? "0" : "3"}
                    py="2.5"
                    rounded="xl"
                    color={isActive ? "blue.700" : "gray.700"}
                    bg={isActive ? "blue.50" : "transparent"}
                    fontWeight={isActive ? "semibold" : "medium"}
                    _hover={{
                      bg: "blue.50",
                      color: "blue.700",
                    }}
                    transition="all 0.2s ease"
                    minH="42px"
                  >
                    <Icon size={isCollapsed ? 21 : 18} />
                    {!isCollapsed && <Text fontSize="sm">{group.title}</Text>}
                  </Flex>
                )}
              </NavLink>
            );
          }

          return (
            <Box key={group.title}>
              <Flex
                align="center"
                justify={isCollapsed ? "center" : "space-between"}
                gap="3"
                px={isCollapsed ? "0" : "3"}
                py="2.5"
                rounded="xl"
                cursor="pointer"
                color={activeGroup ? "blue.700" : "gray.700"}
                bg={activeGroup ? "blue.50" : "transparent"}
                fontWeight={activeGroup ? "semibold" : "medium"}
                _hover={{
                  bg: "blue.50",
                  color: "blue.700",
                }}
                transition="all 0.2s ease"
                minH="42px"
                title={isCollapsed ? group.title : undefined}
                onClick={() => toggleGroup(group.title)}
              >
                <Flex
                  align="center"
                  justify={isCollapsed ? "center" : "flex-start"}
                  gap="3"
                >
                  <Icon size={isCollapsed ? 21 : 18} />

                  {!isCollapsed && (
                    <Text fontSize="sm" lineHeight="1.2">
                      {group.title}
                    </Text>
                  )}
                </Flex>

                {!isCollapsed &&
                  (isOpen ? (
                    <ChevronDown size={17} />
                  ) : (
                    <ChevronRight size={17} />
                  ))}
              </Flex>

              {!isCollapsed && isOpen && group.children && (
                <VStack align="stretch" gap="1" mt="1" pl="3">
                  {group.children.map((child) => (
                    <SidebarChildItem key={child.path} item={child} />
                  ))}
                </VStack>
              )}
            </Box>
          );
        })}
      </VStack>
    </Box>
  );
}

function SidebarChildItem({ item }: { item: MenuChild }) {
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
          color={isActive ? "blue.700" : "gray.600"}
          bg={isActive ? "blue.50" : "transparent"}
          fontWeight={isActive ? "semibold" : "medium"}
          _hover={{
            bg: "gray.50",
            color: "blue.700",
          }}
          transition="all 0.2s ease"
          minH="40px"
        >
          <Flex align="center" gap="3">
            <Box
              color={isActive ? "blue.600" : "gray.400"}
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Icon size={16} />
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