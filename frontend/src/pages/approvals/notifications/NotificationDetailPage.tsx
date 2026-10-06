import { useEffect, useState } from "react";
import { Badge, Box, Button, Flex, Heading, HStack, Skeleton, Text, VStack } from "@chakra-ui/react";
import { ArrowLeft, Bell, Calendar, CheckCheck, ExternalLink } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { notificationsService, type WorkflowNotification } from "../../../services/notifications.service";

export function NotificationDetailPage() {
  const { id = "" } = useParams(); const navigate = useNavigate();
  const [item, setItem] = useState<WorkflowNotification | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  useEffect(() => { void (async () => { try { const data = await notificationsService.get(id); setItem(data); if (data.status === "UNREAD") { await notificationsService.markRead(id); setItem({ ...data, status: "READ", readAt: new Date().toISOString() }); } } catch (cause: any) { setError(cause?.response?.data?.message || "No se encontró la notificación."); } finally { setLoading(false); } })(); }, [id]);
  if (loading) return <VStack align="stretch"><Skeleton h="40px"/><Skeleton h="260px"/></VStack>;
  if (!item) return <Box bg="white" rounded="xl" p="8"><Heading size="md">Notificación no disponible</Heading><Text color="red.600" mt="2">{error}</Text><Button mt="4" onClick={() => navigate("/notificaciones")}>Volver</Button></Box>;
  return <VStack align="stretch" gap="5"><Flex justify="space-between" align={{ base: "start", md: "center" }} direction={{ base: "column", md: "row" }} gap="3"><Button variant="outline" onClick={() => navigate("/notificaciones")}><ArrowLeft size={16}/>Volver</Button>{item.link && <Button colorPalette="blue" onClick={() => navigate(item.link!)}><ExternalLink size={16}/>Ir al expediente</Button>}</Flex><Box bg="white" border="1px solid" borderColor="gray.200" rounded="2xl" p={{ base: "5", md: "8" }}><HStack mb="4"><Box color="blue.600"><Bell size={25}/></Box><Badge colorPalette={priorityColor(item.priority)}>{friendly(item.priority)}</Badge><Badge colorPalette="green"><CheckCheck size={12}/>Leída</Badge></HStack><Heading size="lg">{item.title}</Heading><Text mt="4" lineHeight="1.8" color="gray.700">{item.description}</Text><Box borderTop="1px solid" borderColor="gray.100" mt="6" pt="5"><HStack color="gray.500"><Calendar size={16}/><Text fontSize="sm">{new Intl.DateTimeFormat("es-GT", { dateStyle: "full", timeStyle: "short" }).format(new Date(item.createdAt))}</Text></HStack><Text fontSize="sm" color="gray.500" mt="2">Evento: {friendly(item.eventType)}</Text></Box></Box></VStack>;
}
function friendly(value: string) { return value.replace(/_/g, " "); }
function priorityColor(value: string) { return value === "URGENT" ? "red" : value === "HIGH" ? "orange" : value === "NORMAL" ? "blue" : "gray"; }
