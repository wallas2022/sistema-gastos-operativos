import {
  Avatar,
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Menu,
  Portal,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  Bell,
  ChevronDown,
  LogOut,
  Settings,
  ShieldCheck,
  User,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const moduleTitles: Record<string, string> = {
  "/": "Dashboard general",
  "/notificaciones": "Notificaciones del sistema",

  "/planificacion-normativa": "Planificación y Normativa",
  "/solicitudes-gastos": "Solicitudes de gastos",
  "/solicitudes-gastos/nueva": "Nueva solicitud de gasto",
  "/simulador-gastos": "Simulador de gastos",
  "/politicas-reglas": "Políticas y reglas",
  "/verificador-presupuestario": "Verificador presupuestario",

  "/trazabilidad-flujos/autorizaciones": "Centro de Autorizaciones",
  "/trazabilidad-flujos/monitor-estados": "Monitor de Estados",
  "/trazabilidad-flujos/escalamientos": "Gestión de Escalamientos",
  "/trazabilidad-flujos/bitacora": "Bitácora de Eventos",

  "/rendicion-conciliacion": "Rendición y Conciliación Financiera",
  "/rendicion-conciliacion/ocr/documentos": "Documentos OCR",
  "/rendicion-conciliacion/liquidaciones": "Liquidaciones",
  "/rendicion-conciliacion/anticipos": "Conciliación de anticipos",
  "/rendicion-conciliacion/cierres-certificados": "Cierres certificados",

  "/control-presupuestario": "Control Presupuestario e Inteligencia",
  "/ejecucion-presupuestaria": "Ejecución presupuestaria",
  "/actual-vs-proyectado": "Actual vs proyectado",
  "/interoperabilidad-api": "Interoperabilidad API",
  "/proyeccion-desvios": "Proyección de desvíos",
  "/reportes-analitica": "Reportes y analítica",
};

const notifications = [
  {
    id: "1",
    title: "Solicitud pendiente de aprobación",
    description: "SOL-0002 espera revisión financiera.",
    type: "Autorización",
    color: "purple",
  },
  {
    id: "2",
    title: "Documento OCR confirmado",
    description: "DOC-001 ya puede asociarse a una liquidación.",
    type: "OCR",
    color: "blue",
  },
  {
    id: "3",
    title: "Liquidación pendiente",
    description: "LIQ-0003 requiere comprobantes adicionales.",
    type: "Liquidación",
    color: "yellow",
  },
];

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();

  const currentTitle = location.pathname.startsWith("/notificaciones/")
    ? "Detalle de notificación"
    : moduleTitles[location.pathname] ?? "Sistema de Gestión de Gastos";

 const storedUser = localStorage.getItem("user");
 console.log("USUARIO ALMACENADO:", storedUser);

let parsedUser: any = null;

try {
  parsedUser = storedUser ? JSON.parse(storedUser) : null;
} catch {
  parsedUser = null;
}

const userName = parsedUser?.name ;
const userRole = parsedUser?.role ;

const handleLogout = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("user");
console.log("TOKEN ELIMINADO:", localStorage.getItem("access_token"));
  navigate("/login", { replace: true });
};

  return (
    <Flex
      as="header"
      h="72px"
      bg="white"
      borderBottom="1px solid"
      borderColor="gray.200"
      px={{ base: "4", md: "6" }}
      align="center"
      justify="space-between"
      position="sticky"
      top="0"
      zIndex="20"
    >
      <Box minW="0">
        <Text fontSize="sm" color="gray.500">
          Sistema de Gestión y Control Presupuestario
        </Text>

        <Text
          fontSize="lg"
          fontWeight="bold"
          color="gray.800"
          truncate
        >
          {currentTitle}
        </Text>
      </Box>

      <HStack gap="3">
        <NotificationMenu />

        <Menu.Root>
          <Menu.Trigger asChild>
            <Button
              variant="ghost"
              px="2"
              py="2"
              h="auto"
              rounded="xl"
              _hover={{ bg: "gray.50" }}
            >
              <HStack gap="3">
                <Avatar.Root size="sm">
                  <Avatar.Fallback name={userName} />
                </Avatar.Root>

                <VStack
                  align="start"
                  gap="0"
                  display={{ base: "none", md: "flex" }}
                >
                  <Text fontSize="sm" fontWeight="semibold" color="gray.800">
                    {userName}
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    {userRole}
                  </Text>
                </VStack>

                <ChevronDown size={16} />
              </HStack>
            </Button>
          </Menu.Trigger>

          <Portal>
            <Menu.Positioner>
              <Menu.Content minW="230px">
                <Box
                  px="3"
                  py="3"
                  borderBottom="1px solid"
                  borderColor="gray.100"
                >
                  <Text fontSize="sm" fontWeight="semibold">
                    {userName}
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    {userRole}
                  </Text>
                </Box>

                <Menu.Item value="profile">
                  <User size={16} />
                  Mi perfil
                </Menu.Item>

                <Menu.Item value="security">
                  <ShieldCheck size={16} />
                  Seguridad
                </Menu.Item>

                <Menu.Item value="settings">
                  <Settings size={16} />
                  Preferencias
                </Menu.Item>

                <Menu.Separator />

                <Menu.Item
                  value="logout"
                  color="red.600"
                  onClick={handleLogout}
                >
                  <LogOut size={16} />
                  Cerrar sesión
                </Menu.Item>
              </Menu.Content>
            </Menu.Positioner>
          </Portal>
        </Menu.Root>
      </HStack>
    </Flex>
  );
}

function NotificationMenu() {
  const navigate = useNavigate();

  return (
    <Menu.Root>
      <Menu.Trigger asChild>
        <Box position="relative">
          <IconButton
            aria-label="Notificaciones"
            variant="outline"
            rounded="xl"
            size="sm"
          >
            <Bell size={18} />
          </IconButton>

          <Badge
            position="absolute"
            top="-7px"
            right="-7px"
            colorPalette="red"
            rounded="full"
            fontSize="10px"
            minW="18px"
            h="18px"
            display="flex"
            alignItems="center"
            justifyContent="center"
            px="1"
          >
            {notifications.length}
          </Badge>
        </Box>
      </Menu.Trigger>

      <Portal>
        <Menu.Positioner>
          <Menu.Content minW="340px">
            <Box px="4" py="3" borderBottom="1px solid" borderColor="gray.100">
              <Flex justify="space-between" align="center">
                <Box>
                  <Text fontWeight="bold">Notificaciones</Text>
                  <Text fontSize="xs" color="gray.500">
                    Eventos recientes del sistema
                  </Text>
                </Box>

                <Badge colorPalette="red">
                  {notifications.length} nuevas
                </Badge>
              </Flex>
            </Box>

            <VStack align="stretch" gap="0">
              {notifications.map((item) => (
                <Box
                  key={item.id}
                  px="4"
                  py="3"
                  borderBottom="1px solid"
                  borderColor="gray.100"
                  _hover={{ bg: "gray.50" }}
                  cursor="pointer"
                  onClick={() => navigate(`/notificaciones/${item.id}`)}
                >
                  <HStack align="start" gap="3">
                    <Box
                      w="10px"
                      h="10px"
                      rounded="full"
                      bg={`${item.color}.500`}
                      mt="2"
                      flexShrink={0}
                    />

                    <Box>
                      <HStack mb="1">
                        <Text fontSize="sm" fontWeight="semibold">
                          {item.title}
                        </Text>

                        <Badge size="sm" colorPalette={item.color}>
                          {item.type}
                        </Badge>
                      </HStack>

                      <Text fontSize="xs" color="gray.500">
                        {item.description}
                      </Text>
                    </Box>
                  </HStack>
                </Box>
              ))}
            </VStack>

            <Box px="4" py="3">
              <Button
                size="sm"
                variant="outline"
                w="100%"
                onClick={() => navigate("/notificaciones")}
              >
                Ver todas las notificaciones
              </Button>
            </Box>
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
}