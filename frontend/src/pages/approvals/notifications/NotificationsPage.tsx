import { useEffect, useMemo, useState } from "react";
import { Badge, Box, Button, Flex, Grid, Heading, HStack, Input, Skeleton, Text, VStack } from "@chakra-ui/react";
import { Bell, CheckCheck, Clock3, Eye, History, Search, Send, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { notificationsService, type NotificationBox, type PendingWithSla, type WorkflowNotification } from "../../../services/notifications.service";

const boxes: Array<{ value: NotificationBox; label: string }> = [{ value: "NOTIFICATIONS", label: "Mis notificaciones" }, { value: "PENDING", label: "Pendientes" }, { value: "OBSERVED", label: "Mis observadas" }, { value: "DELEGATED", label: "Mis delegadas" }, { value: "APPROVED", label: "Mis aprobadas" }, { value: "HISTORY", label: "Historial" }];

export function NotificationsPage() {
  const navigate = useNavigate();
  const [box, setBox] = useState<NotificationBox>("NOTIFICATIONS");
  const [items, setItems] = useState<WorkflowNotification[]>([]);
  const [pending, setPending] = useState<PendingWithSla[]>([]);
  const [meta, setMeta] = useState({ page: 1, pageSize: 10, total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => { const timeout = window.setTimeout(() => setDebounced(query.toLowerCase().trim()), 300); return () => clearTimeout(timeout); }, [query]);
  useEffect(() => { setPage(1); }, [box]);
  useEffect(() => { void load(); }, [box, page]);
  const load = async () => { setLoading(true); setError(""); try { if (box === "PENDING") { const data = await notificationsService.pendingWithSla(); setPending(data); setMeta({ page: 1, pageSize: data.length, total: data.length, totalPages: 1 }); } else { const data = await notificationsService.list(box, page, 10); setItems(data.items); setMeta(data.meta); } } catch (cause: any) { setError(message(cause)); } finally { setLoading(false); } };
  const visibleNotifications = useMemo(() => items.filter((item) => `${item.title} ${item.description} ${item.eventType}`.toLowerCase().includes(debounced)), [items, debounced]);
  const visiblePending = useMemo(() => pending.filter((item) => { const req = item.flow.expenseRequest; return `${req?.code} ${req?.concept} ${req?.requesterName}`.toLowerCase().includes(debounced); }), [pending, debounced]);
  const unread = items.filter((item) => item.status === "UNREAD").length;
  const open = async (item: WorkflowNotification) => { if (item.status === "UNREAD") await notificationsService.markRead(item.id); navigate(`/notificaciones/${item.id}`); };
  const markAll = async () => { await notificationsService.markAllRead(); await load(); };

  return <VStack align="stretch" gap="5"><Flex justify="space-between" direction={{ base: "column", md: "row" }} gap="3"><Box><HStack><Badge colorPalette="purple">WORKFLOW</Badge><Badge colorPalette="blue">IN_APP</Badge></HStack><Heading size="lg" mt="2">Notificaciones y bandejas</Heading><Text color="gray.500">Eventos personales de solicitudes, aprobaciones y seguimiento SLA.</Text></Box><Button variant="outline" onClick={markAll}><CheckCheck size={16}/>Marcar todas como leídas</Button></Flex>{error && <Box bg="red.50" color="red.700" rounded="lg" p="3">{error}</Box>}<Grid templateColumns={{ base: "1fr", md: "repeat(3,1fr)" }} gap="3"><Stat label="Resultados" value={meta.total} icon={Bell}/><Stat label="No leídas en página" value={unread} icon={Eye} color="red"/><Stat label="Bandeja activa" value={boxes.find((item) => item.value === box)?.label || ""} icon={ShieldCheck} color="purple"/></Grid><Flex gap="2" wrap="wrap">{boxes.map((item) => <Button key={item.value} size="sm" variant={box === item.value ? "solid" : "outline"} colorPalette={box === item.value ? "blue" : "gray"} onClick={() => setBox(item.value)}>{item.value === "PENDING" ? <Clock3 size={15}/> : item.value === "DELEGATED" ? <Send size={15}/> : <History size={15}/>} {item.label}</Button>)}</Flex><Box bg="white" border="1px solid" borderColor="gray.200" rounded="2xl" overflow="hidden"><Box p="4" borderBottom="1px solid" borderColor="gray.100"><Box position="relative"><Box position="absolute" left="3" top="3" color="gray.400"><Search size={16}/></Box><Input pl="9" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por título, solicitud o evento..."/></Box></Box>{loading ? <VStack p="5" align="stretch">{[1,2,3,4].map((value) => <Skeleton key={value} h="72px"/>)}</VStack> : box === "PENDING" ? <VStack align="stretch" gap="0">{visiblePending.map((item) => <PendingRow key={item.id} item={item} navigate={() => navigate(`/trazabilidad-flujos/autorizaciones`)}/>)}{!visiblePending.length && <Empty/>}</VStack> : <VStack align="stretch" gap="0">{visibleNotifications.map((item) => <NotificationRow key={item.id} item={item} open={() => void open(item)}/>) }{!visibleNotifications.length && <Empty/>}</VStack>}<Flex justify="space-between" p="4" borderTop="1px solid" borderColor="gray.100"><Text fontSize="sm">Página {meta.page} de {meta.totalPages}</Text><HStack><Button size="xs" variant="outline" disabled={page <= 1 || box === "PENDING"} onClick={() => setPage(page - 1)}>Anterior</Button><Button size="xs" variant="outline" disabled={page >= meta.totalPages || box === "PENDING"} onClick={() => setPage(page + 1)}>Siguiente</Button></HStack></Flex></Box></VStack>;
}

function NotificationRow({ item, open }: { item: WorkflowNotification; open: () => void }) { return <Flex p="4" gap="3" align="center" borderTop="1px solid" borderColor="gray.100" bg={item.status === "UNREAD" ? "blue.50" : "white"}><Box w="10px" h="10px" rounded="full" bg={item.status === "UNREAD" ? "blue.500" : "gray.300"}/><Box flex="1"><HStack wrap="wrap"><Text fontWeight="semibold">{item.title}</Text><Badge colorPalette={priorityColor(item.priority)}>{friendly(item.priority)}</Badge><Badge variant="subtle">{friendly(item.eventType)}</Badge></HStack><Text fontSize="sm" color="gray.600">{item.description}</Text><Text fontSize="xs" color="gray.500">{dateTime(item.createdAt)}</Text></Box><Button size="xs" variant="outline" onClick={open}>Ver</Button></Flex>; }
function PendingRow({ item, navigate }: { item: PendingWithSla; navigate: () => void }) { const request = item.flow.expenseRequest; return <Flex p="4" borderTop="1px solid" borderColor="gray.100" gap="3" align={{ base: "start", md: "center" }} direction={{ base: "column", md: "row" }}><Box flex="1"><HStack><Badge colorPalette="blue">{request?.code}</Badge><Badge colorPalette={slaColor(item.sla.indicator)}>{slaLabel(item.sla)}</Badge><Badge>{friendly(request?.priority)}</Badge></HStack><Text fontWeight="semibold" mt="2">{request?.concept}</Text><Text fontSize="sm" color="gray.500">Nivel {item.order} · {request?.requesterName} · {money(Number(request?.estimatedAmount || 0), request?.currency)}</Text></Box><Button size="xs" variant="outline" onClick={navigate}>Ir a aprobación</Button></Flex>; }
function Stat({ label, value, icon: Icon, color = "blue" }: { label: string; value: string | number; icon: React.ElementType; color?: string }) { return <Box bg="white" border="1px solid" borderColor="gray.200" rounded="xl" p="4"><Flex justify="space-between"><Box><Text fontSize="sm" color="gray.500">{label}</Text><Text fontSize="xl" fontWeight="bold">{value}</Text></Box><Box color={`${color}.600`}><Icon size={22}/></Box></Flex></Box>; }
function Empty() { return <VStack py="12"><CheckCheck size={36}/><Text fontWeight="semibold">No hay elementos en esta bandeja</Text><Text fontSize="sm" color="gray.500">Los nuevos eventos aparecerán automáticamente.</Text></VStack>; }
function friendly(value?: string | null) { return (value || "—").replace(/_/g, " "); }
function dateTime(value: string) { return new Intl.DateTimeFormat("es-GT", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
function money(value: number, currency = "GTQ") { return new Intl.NumberFormat("es-GT", { style: "currency", currency: currency || "GTQ" }).format(value); }
function priorityColor(value: string) { return value === "URGENT" ? "red" : value === "HIGH" ? "orange" : value === "NORMAL" ? "blue" : "gray"; }
function slaColor(value: string) { return value === "RED" ? "red" : value === "YELLOW" ? "yellow" : "green"; }
function slaLabel(sla: PendingWithSla["sla"]) { return sla.overdueMinutes ? `Vencido ${formatMinutes(sla.overdueMinutes)}` : `Restan ${formatMinutes(sla.remainingMinutes)}`; }
function formatMinutes(value: number) { return value < 60 ? `${value} min` : `${Math.floor(value / 60)} h ${value % 60} min`; }
function message(error: any) { const value = error?.response?.data?.message; return Array.isArray(value) ? value.join(" ") : value || "No fue posible cargar la bandeja."; }
