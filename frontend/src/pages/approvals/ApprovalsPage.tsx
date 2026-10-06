import { useEffect, useMemo, useState } from "react";
import { Badge, Box, Button, CloseButton, Dialog, Flex, Grid, Heading, HStack, Input, NativeSelect, Portal, Skeleton, Table, Text, Textarea, VStack } from "@chakra-ui/react";
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronRight, Clock3, Eye, FileText, GitBranch, RefreshCw, Search, Send, ShieldCheck, ThumbsDown, ThumbsUp, UserRoundCog, XCircle } from "lucide-react";
import { APPROVAL_PENDING_CHANGED, approvalFlowsService, type ApprovalFlow, type ApprovalStatus, type ApprovalTrace, type PendingApproval } from "../../services/approvalFlows.service";
import { getExpenseRequestById, type ExpenseRequest } from "../../services/expenseRequests.service";
import { getSecurityUsers, type SecurityUser } from "../../services/security.service";

type Action = "approve" | "reject" | "observe" | "delegate" | "reassign" | "cancel";
type Filters = { company: string; status: string; level: string; requester: string; type: string; minAmount: string; maxAmount: string; from: string; to: string; priority: string };
const emptyFilters: Filters = { company: "", status: "", level: "", requester: "", type: "", minAmount: "", maxAmount: "", from: "", to: "", priority: "" };

export function ApprovalsPage() {
  const [pending, setPending] = useState<PendingApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [sort, setSort] = useState("oldest");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [selected, setSelected] = useState<PendingApproval | null>(null);
  const [flow, setFlow] = useState<ApprovalFlow | null>(null);
  const [request, setRequest] = useState<ExpenseRequest | null>(null);
  const [history, setHistory] = useState<ApprovalTrace[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [users, setUsers] = useState<SecurityUser[]>([]);
  const [action, setAction] = useState<Action | null>(null);
  const [comment, setComment] = useState("");
  const [targetUserId, setTargetUserId] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => { const timeout = window.setTimeout(() => setDebouncedQuery(query.trim().toLowerCase()), 350); return () => window.clearTimeout(timeout); }, [query]);
  useEffect(() => { setPage(1); }, [debouncedQuery, filters, sort, pageSize]);

  const loadPending = async () => {
    setLoading(true); setError("");
    try { const items = await approvalFlowsService.pending(); setPending(items); window.dispatchEvent(new CustomEvent(APPROVAL_PENDING_CHANGED, { detail: items.length })); }
    catch (cause: any) { setError(apiMessage(cause, "No fue posible cargar sus aprobaciones pendientes.")); }
    finally { setLoading(false); }
  };

  useEffect(() => { void loadPending(); }, []);

  const options = useMemo(() => ({
    companies: unique(pending.map((item) => item.flow.expenseRequest?.companyName)),
    statuses: unique(pending.map((item) => item.status)),
    levels: unique(pending.map((item) => String(item.order))),
    requesters: unique(pending.map((item) => item.flow.expenseRequest?.requesterName)),
    types: unique(pending.map((item) => item.flow.expenseRequest?.type)),
    priorities: unique(pending.map((item) => item.flow.expenseRequest?.priority)),
  }), [pending]);

  const filtered = useMemo(() => pending.filter((item) => {
    const req = item.flow.expenseRequest; if (!req) return false;
    const haystack = [req.code, req.companyName, req.requesterName, req.concept, req.type, req.currency, item.sourcePolicyRuleCode, item.comment].join(" ").toLowerCase();
    const amount = Number(req.estimatedAmount || 0), date = req.createdAt.slice(0, 10);
    return (!debouncedQuery || haystack.includes(debouncedQuery)) && (!filters.company || req.companyName === filters.company) && (!filters.status || item.status === filters.status) && (!filters.level || String(item.order) === filters.level) && (!filters.requester || req.requesterName === filters.requester) && (!filters.type || req.type === filters.type) && (!filters.priority || req.priority === filters.priority) && (!filters.minAmount || amount >= Number(filters.minAmount)) && (!filters.maxAmount || amount <= Number(filters.maxAmount)) && (!filters.from || date >= filters.from) && (!filters.to || date <= filters.to);
  }).sort((a, b) => sortPending(a, b, sort)), [pending, debouncedQuery, filters, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  useEffect(() => { setPage((current) => Math.min(current, totalPages)); }, [totalPages]);
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);
  const stats = useMemo(() => ({ total: pending.length, urgent: pending.filter((item) => ["ALTA", "URGENTE"].includes(item.flow.expenseRequest?.priority || "")).length, observed: pending.filter((item) => item.status === "OBSERVADA").length, amount: pending.reduce((sum, item) => sum + Number(item.flow.expenseRequest?.estimatedAmount || 0), 0) }), [pending]);

  const openDetail = async (item: PendingApproval) => {
    setSelected(item); setFlow(null); setRequest(null); setHistory([]); setDetailLoading(true); setError("");
    try {
      const [flowData, historyData, requestData] = await Promise.all([approvalFlowsService.get(item.flowId), approvalFlowsService.history(item.flowId), getExpenseRequestById(item.flow.expenseRequestId!)]);
      setFlow(flowData); setHistory(historyData.traces); setRequest(requestData);
    } catch (cause: any) { setError(apiMessage(cause, "No fue posible cargar el expediente completo.")); }
    finally { setDetailLoading(false); }
  };

  const openAction = async (next: Action) => {
    setAction(next); setComment(""); setTargetUserId(""); setError("");
    if ((next === "delegate" || next === "reassign") && !users.length) {
      try { setUsers((await getSecurityUsers()).filter((user) => user.active && user.id !== selected?.assignedUserId)); } catch { setUsers([]); }
    }
  };

  const executeAction = async () => {
    if (!selected || !action || processing) return;
    if (action !== "approve" && !comment.trim()) { setError("El comentario es obligatorio para esta acción."); return; }
    if ((action === "delegate" || action === "reassign") && !targetUserId) { setError("Seleccione el usuario destino."); return; }
    setProcessing(true); setError("");
    try {
      if (action === "approve") await approvalFlowsService.approve(selected.flowId, comment.trim() || undefined);
      if (action === "reject") await approvalFlowsService.reject(selected.flowId, comment.trim());
      if (action === "observe") await approvalFlowsService.observe(selected.flowId, comment.trim());
      if (action === "delegate") await approvalFlowsService.delegate(selected.flowId, targetUserId, comment.trim());
      if (action === "reassign") await approvalFlowsService.reassign(selected.flowId, selected.id, targetUserId, comment.trim());
      if (action === "cancel") await approvalFlowsService.cancel(selected.flowId, comment.trim());
      setAction(null); setSelected(null); setFlow(null); setRequest(null); await loadPending();
    } catch (cause: any) { setError(apiMessage(cause, "La acción no pudo completarse.")); }
    finally { setProcessing(false); }
  };

  return <VStack align="stretch" gap="5">
    <Flex justify="space-between" align={{ base: "start", md: "center" }} direction={{ base: "column", md: "row" }} gap="3"><Box><HStack mb="1"><Badge colorPalette="purple">APROBACIONES</Badge><Badge colorPalette="blue">Bandeja personal</Badge></HStack><Heading size="lg">Centro de Autorizaciones</Heading><Text color="gray.500">Decisiones asignadas por el Approval Engine al usuario autenticado.</Text></Box><Button variant="outline" onClick={loadPending} disabled={loading}><RefreshCw size={16}/>Actualizar</Button></Flex>
    {error && <Box bg="red.50" border="1px solid" borderColor="red.200" color="red.700" rounded="lg" p="3"><HStack justify="space-between"><Text fontSize="sm">{error}</Text><CloseButton size="xs" onClick={() => setError("")}/></HStack></Box>}
    <Grid templateColumns={{ base: "1fr", sm: "repeat(2,1fr)", xl: "repeat(4,1fr)" }} gap="3"><Stat label="Mis pendientes" value={String(stats.total)} icon={Clock3}/><Stat label="Alta prioridad" value={String(stats.urgent)} icon={AlertTriangle} color="red"/><Stat label="Observadas" value={String(stats.observed)} icon={FileText} color="orange"/><Stat label="Monto asignado" value={money(stats.amount)} icon={ShieldCheck} color="purple"/></Grid>
    <Box bg="white" border="1px solid" borderColor="gray.200" rounded="2xl" p={{ base: "3", md: "5" }}>
      <Grid templateColumns={{ base: "1fr", md: "2fr repeat(3,1fr)" }} gap="2"><Box position="relative"><Box position="absolute" left="3" top="3" color="gray.400"><Search size={16}/></Box><Input pl="9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Código, concepto, empresa o política..."/></Box><Select value={filters.company} onChange={(value) => setFilters({ ...filters, company: value })} label="Todas las empresas" options={options.companies}/><Select value={filters.status} onChange={(value) => setFilters({ ...filters, status: value })} label="Todos los estados" options={options.statuses}/><Select value={sort} onChange={setSort} label="Ordenar" options={["oldest", "newest", "amount_desc", "priority"]} labels={{ oldest: "Más antiguas", newest: "Más recientes", amount_desc: "Mayor monto", priority: "Mayor prioridad" }}/></Grid>
      <details style={{ marginTop: 12 }}><summary style={{ cursor: "pointer", color: "#4a5568", fontSize: 14 }}>Filtros avanzados</summary><Grid mt="3" templateColumns={{ base: "1fr 1fr", md: "repeat(4,1fr)" }} gap="2"><Select value={filters.level} onChange={(value) => setFilters({ ...filters, level: value })} label="Todos los niveles" options={options.levels}/><Select value={filters.requester} onChange={(value) => setFilters({ ...filters, requester: value })} label="Todos los solicitantes" options={options.requesters}/><Select value={filters.type} onChange={(value) => setFilters({ ...filters, type: value })} label="Todos los tipos" options={options.types}/><Select value={filters.priority} onChange={(value) => setFilters({ ...filters, priority: value })} label="Todas las prioridades" options={options.priorities}/><Input type="number" min="0" value={filters.minAmount} onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })} placeholder="Monto mínimo"/><Input type="number" min="0" value={filters.maxAmount} onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })} placeholder="Monto máximo"/><Input type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })}/><Input type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })}/></Grid><Button mt="2" size="xs" variant="ghost" onClick={() => { setFilters(emptyFilters); setQuery(""); }}>Limpiar filtros</Button></details>
    </Box>
    <Grid templateColumns={{ base: "1fr", xl: selected ? "minmax(0,1fr) minmax(420px,.9fr)" : "1fr" }} gap="4" alignItems="start"><Box bg="white" border="1px solid" borderColor="gray.200" rounded="2xl" overflow="hidden"><Flex p="4" justify="space-between"><Box><Heading size="md">Mis pendientes</Heading><Text fontSize="sm" color="gray.500">{filtered.length} resultado(s) de {pending.length}</Text></Box></Flex>{loading ? <LoadingRows/> : visible.length ? <VStack align="stretch" gap="0">{visible.map((item) => <PendingRow key={item.id} item={item} selected={selected?.id === item.id} onOpen={() => void openDetail(item)}/>)}</VStack> : <Empty/>}<Flex p="4" justify="space-between" align="center" borderTop="1px solid" borderColor="gray.100"><HStack><Text fontSize="sm">Página {page} de {totalPages}</Text><NativeSelect.Root size="sm" w="80px"><NativeSelect.Field value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}><option value="5">5</option><option value="8">8</option><option value="15">15</option></NativeSelect.Field><NativeSelect.Indicator/></NativeSelect.Root></HStack><HStack><Button size="xs" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Anterior</Button><Button size="xs" variant="outline" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Siguiente</Button></HStack></Flex></Box>{selected && <DetailPanel loading={detailLoading} selected={selected} flow={flow} request={request} history={history} close={() => setSelected(null)} action={openAction}/>}</Grid>
    <ActionDialog action={action} comment={comment} setComment={setComment} targetUserId={targetUserId} setTargetUserId={setTargetUserId} users={users} processing={processing} error={error} close={() => { if (!processing) setAction(null); }} confirm={() => void executeAction()}/>
  </VStack>;
}

function DetailPanel({ loading, selected, flow, request, history, close, action }: { loading: boolean; selected: PendingApproval; flow: ApprovalFlow | null; request: ExpenseRequest | null; history: ApprovalTrace[]; close: () => void; action: (value: Action) => void }) {
  if (loading) return <Box bg="white" border="1px solid" borderColor="gray.200" rounded="2xl" p="5"><VStack align="stretch"><Skeleton h="32px"/><Skeleton h="120px"/><Skeleton h="220px"/><Skeleton h="160px"/></VStack></Box>;
  const summary = request || selected.flow.expenseRequest;
  return <Box bg="white" border="1px solid" borderColor="gray.200" rounded="2xl" p={{ base: "4", md: "5" }} position={{ xl: "sticky" }} top="3" maxH={{ xl: "calc(100vh - 24px)" }} overflowY="auto"><Flex justify="space-between" mb="4"><Box><HStack><Badge colorPalette="blue">{summary?.code}</Badge><StatusBadge status={selected.status}/></HStack><Heading size="md" mt="2">{summary?.concept}</Heading></Box><CloseButton onClick={close}/></Flex><Grid templateColumns="repeat(2,1fr)" gap="3" mb="5"><Info label="Solicitante" value={summary?.requesterName}/><Info label="Empresa" value={summary?.companyName}/><Info label="Monto" value={money(Number(summary?.estimatedAmount || 0), summary?.currency)}/><Info label="Tipo" value={summary?.type}/><Info label="Prioridad" value={summary?.priority}/><Info label="Tiempo pendiente" value={elapsed(selected.assignedAt || selected.createdAt)}/><Info label="Centro de costo" value={summary?.costCenter}/><Info label="Cuenta" value={summary?.budgetAccount}/></Grid><Section title="Justificación"><Text fontSize="sm">{summary?.justification || "Sin justificación registrada."}</Text></Section><Section title="Resultado de políticas y validaciones"><VStack align="stretch" gap="2">{request?.validations?.length ? request.validations.map((validation) => <Flex key={validation.id} justify="space-between" gap="2"><Box><Text fontSize="sm" fontWeight="medium">{validation.type}</Text><Text fontSize="xs" color="gray.500">{validation.message || "Sin mensaje"}</Text></Box><StatusBadge status={validation.status}/></Flex>) : <Muted text="Sin validaciones disponibles."/>}</VStack></Section><Section title="Ítems"><Box overflowX="auto"><Table.Root size="sm"><Table.Header><Table.Row><Table.ColumnHeader>Descripción</Table.ColumnHeader><Table.ColumnHeader textAlign="end">Cant.</Table.ColumnHeader><Table.ColumnHeader textAlign="end">Total</Table.ColumnHeader></Table.Row></Table.Header><Table.Body>{request?.items?.map((item) => <Table.Row key={item.id}><Table.Cell>{item.name}</Table.Cell><Table.Cell textAlign="end">{item.quantity}</Table.Cell><Table.Cell textAlign="end">{money(item.totalAmount, request.currency)}</Table.Cell></Table.Row>)}</Table.Body></Table.Root>{!request?.items?.length && <Muted text="Sin ítems disponibles."/>}</Box></Section><Section title="Documentos"><VStack align="stretch">{request?.documents?.map((document) => <Flex key={document.id} justify="space-between"><HStack><FileText size={15}/><Text fontSize="sm">{document.fileName}</Text></HStack><Badge>{document.status}</Badge></Flex>)}{!request?.documents?.length && <Muted text="Sin documentos asociados."/>}</VStack></Section><Section title="Flujo de aprobación"><FlowTimeline flow={flow}/></Section><Section title="Historial y bitácora"><HistoryTimeline traces={history}/></Section><Grid templateColumns={{ base: "1fr 1fr", md: "repeat(3,1fr)" }} gap="2" mt="5"><Button size="sm" colorPalette="green" onClick={() => action("approve")}><ThumbsUp size={15}/>Aprobar</Button><Button size="sm" colorPalette="orange" variant="outline" onClick={() => action("observe")}><FileText size={15}/>Observar</Button><Button size="sm" colorPalette="red" variant="outline" onClick={() => action("reject")}><ThumbsDown size={15}/>Rechazar</Button><Button size="sm" variant="outline" onClick={() => action("delegate")}><Send size={15}/>Delegar</Button><Button size="sm" variant="outline" onClick={() => action("reassign")}><UserRoundCog size={15}/>Reasignar</Button><Button size="sm" colorPalette="red" variant="ghost" onClick={() => action("cancel")}><XCircle size={15}/>Cancelar</Button></Grid></Box>;
}

function FlowTimeline({ flow }: { flow: ApprovalFlow | null }) { if (!flow) return <Muted text="Flujo no disponible."/>; return <VStack align="stretch" gap="0">{flow.steps.map((step, index) => <Box key={step.id}><Flex gap="3"><VStack gap="0"><Box w="28px" h="28px" rounded="full" display="grid" placeItems="center" bg={`${statusColor(step.status)}.100`} color={`${statusColor(step.status)}.700`}><Text fontSize="xs" fontWeight="bold">{step.order}</Text></Box>{index < flow.steps.length - 1 && <Box w="2px" minH="38px" bg="gray.200"/>}</VStack><Box pb="3" flex="1"><Flex justify="space-between" gap="2"><Box><Text fontSize="sm" fontWeight="semibold">{step.approverRoleCode || "Aprobador"}</Text><Text fontSize="xs" color="gray.500">{step.assignedUser?.name}{step.delegatedFromUser ? ` · delegado por ${step.delegatedFromUser.name}` : ""}</Text></Box><StatusBadge status={step.status}/></Flex>{step.comment && <Text fontSize="xs" mt="1">“{step.comment}”</Text>}</Box></Flex></Box>)}</VStack>; }
function HistoryTimeline({ traces }: { traces: ApprovalTrace[] }) { if (!traces.length) return <Muted text="Sin eventos de aprobación."/>; return <VStack align="stretch" gap="3">{traces.map((trace, index) => <Flex key={trace.id} gap="3"><Box mt="1"><GitBranch size={15}/></Box><Box flex="1"><Flex justify="space-between"><Text fontSize="sm" fontWeight="semibold">{friendly(trace.event)}</Text><Text fontSize="xs" color="gray.500">{dateTime(trace.createdAt)}</Text></Flex><Text fontSize="xs" color="gray.500">{trace.userName || "Sistema"}{index ? ` · ${duration(traces[index - 1].createdAt, trace.createdAt)}` : ""}</Text>{trace.description && <Text fontSize="sm" mt="1">{trace.description}</Text>}</Box></Flex>)}</VStack>; }

function ActionDialog({ action, comment, setComment, targetUserId, setTargetUserId, users, processing, error, close, confirm }: { action: Action | null; comment: string; setComment: (value: string) => void; targetUserId: string; setTargetUserId: (value: string) => void; users: SecurityUser[]; processing: boolean; error: string; close: () => void; confirm: () => void }) { const needsUser = action === "delegate" || action === "reassign"; return <Dialog.Root open={!!action} onOpenChange={(details) => { if (!details.open) close(); }}><Portal><Dialog.Backdrop/><Dialog.Positioner><Dialog.Content maxW="520px"><Dialog.Header><Dialog.Title>{actionTitle(action)}</Dialog.Title><Dialog.CloseTrigger asChild><CloseButton size="sm" disabled={processing}/></Dialog.CloseTrigger></Dialog.Header><Dialog.Body>{error && <Box role="alert" bg="red.50" color="red.700" p="3" mb="3" rounded="lg">{error}</Box>}<Text fontSize="sm" color="gray.600" mb="4">Confirme la decisión. El backend validará asignación, estado y orden del flujo.</Text>{needsUser && <Box mb="3"><Text fontSize="sm" fontWeight="semibold" mb="1">Usuario destino</Text><NativeSelect.Root><NativeSelect.Field value={targetUserId} onChange={(e) => setTargetUserId(e.target.value)}><option value="">Seleccione un usuario</option>{users.map((user) => <option key={user.id} value={user.id}>{user.name} — {user.email}</option>)}</NativeSelect.Field><NativeSelect.Indicator/></NativeSelect.Root></Box>}<Text fontSize="sm" fontWeight="semibold" mb="1">Comentario {action === "approve" ? "(opcional)" : "(obligatorio)"}</Text><Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Describa el motivo de la decisión..." minH="110px"/></Dialog.Body><Dialog.Footer><Button variant="outline" onClick={close} disabled={processing}>Volver</Button><Button colorPalette={action === "reject" || action === "cancel" ? "red" : action === "approve" ? "green" : "blue"} loading={processing} onClick={confirm}>Confirmar</Button></Dialog.Footer></Dialog.Content></Dialog.Positioner></Portal></Dialog.Root>; }

function PendingRow({ item, selected, onOpen }: { item: PendingApproval; selected: boolean; onOpen: () => void }) { const request = item.flow.expenseRequest!; return <Flex p="4" borderTop="1px solid" borderColor="gray.100" bg={selected ? "blue.50" : "white"} _hover={{ bg: selected ? "blue.50" : "gray.50" }} gap="3" align={{ base: "start", md: "center" }} direction={{ base: "column", md: "row" }}><Box flex="1"><HStack wrap="wrap"><Badge colorPalette="blue">{request.code}</Badge><StatusBadge status={item.status}/><Badge colorPalette={priorityColor(request.priority)}>{friendly(request.priority)}</Badge></HStack><Text fontWeight="semibold" mt="2">{request.concept}</Text><Text fontSize="sm" color="gray.500">{request.companyName} · {request.requesterName} · {friendly(request.type)}</Text><Text fontSize="xs" color="gray.500" mt="1">Nivel {item.order} · {item.sourcePolicyRuleCode || "Política no identificada"} · pendiente {elapsed(item.assignedAt || item.createdAt)}</Text>{item.comment && <Text fontSize="xs" mt="1">Comentario: {item.comment}</Text>}</Box><VStack align={{ base: "start", md: "end" }}><Text fontWeight="bold">{money(Number(request.estimatedAmount), request.currency)}</Text><Button size="xs" variant="outline" onClick={onOpen}><Eye size={14}/>Revisar<ChevronRight size={14}/></Button></VStack></Flex>; }
function LoadingRows() { return <VStack align="stretch" p="4">{[1,2,3,4].map((item) => <Box key={item}><Skeleton h="18px" w="35%"/><Skeleton h="14px" mt="2"/><Skeleton h="14px" mt="2" w="70%"/></Box>)}</VStack>; }
function Empty() { return <VStack py="12"><Box color="green.500"><CheckCircle2 size={40}/></Box><Heading size="sm">Bandeja al día</Heading><Text fontSize="sm" color="gray.500">No hay aprobaciones asignadas que coincidan con los filtros.</Text></VStack>; }
function Stat({ label, value, icon: Icon, color = "blue" }: { label: string; value: string; icon: React.ElementType; color?: string }) { return <Box bg="white" border="1px solid" borderColor="gray.200" rounded="xl" p="4"><Flex justify="space-between"><Box><Text fontSize="sm" color="gray.500">{label}</Text><Text fontSize="2xl" fontWeight="bold">{value}</Text></Box><Box color={`${color}.600`}><Icon size={23}/></Box></Flex></Box>; }
function Section({ title, children }: { title: string; children: React.ReactNode }) { return <Box borderTop="1px solid" borderColor="gray.100" pt="4" mt="4"><Heading size="sm" mb="3">{title}</Heading>{children}</Box>; }
function Info({ label, value }: { label: string; value?: string | null }) { return <Box><Text fontSize="xs" color="gray.500">{label}</Text><Text fontSize="sm" fontWeight="medium">{value || "—"}</Text></Box>; }
function Muted({ text }: { text: string }) { return <Text fontSize="sm" color="gray.500">{text}</Text>; }
function Select({ value, onChange, label, options, labels = {} }: { value: string; onChange: (value: string) => void; label: string; options: string[]; labels?: Record<string,string> }) { return <NativeSelect.Root><NativeSelect.Field value={value} onChange={(e) => onChange(e.target.value)}><option value="">{label}</option>{options.map((option) => <option key={option} value={option}>{labels[option] || friendly(option)}</option>)}</NativeSelect.Field><NativeSelect.Indicator/></NativeSelect.Root>; }
function StatusBadge({ status }: { status: string }) { return <Badge colorPalette={statusColor(status)}>{friendly(status)}</Badge>; }
function statusColor(status: string) { const value = status.toUpperCase(); return value.includes("APROB") ? "green" : value.includes("RECH") || value.includes("CANCEL") || value.includes("EXPIR") ? "red" : value.includes("OBSERV") ? "orange" : value.includes("ASIGN") || value.includes("REVISION") ? "blue" : "gray"; }
function priorityColor(priority: string) { return priority === "URGENTE" ? "red" : priority === "ALTA" ? "orange" : priority === "NORMAL" ? "blue" : "gray"; }
function unique(values: Array<string | null | undefined>) { return [...new Set(values.filter(Boolean) as string[])].sort(); }
function friendly(value?: string | null) { return (value || "—").replace(/_/g, " "); }
function money(value: number, currency = "GTQ") { try { return new Intl.NumberFormat("es-GT", { style: "currency", currency: currency || "GTQ" }).format(value); } catch { return `${currency} ${value.toFixed(2)}`; } }
function dateTime(value: string) { return new Intl.DateTimeFormat("es-GT", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
function elapsed(value: string) { const hours = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 3600000)); return hours < 1 ? "menos de una hora" : hours < 24 ? `${hours} h` : `${Math.floor(hours / 24)} d ${hours % 24} h`; }
function duration(from: string, to: string) { const minutes = Math.max(0, Math.round((new Date(to).getTime() - new Date(from).getTime()) / 60000)); return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} h ${minutes % 60} min`; }
function sortPending(a: PendingApproval, b: PendingApproval, sort: string) { const ar = a.flow.expenseRequest!, br = b.flow.expenseRequest!; if (sort === "newest") return +new Date(br.createdAt) - +new Date(ar.createdAt); if (sort === "amount_desc") return Number(br.estimatedAmount) - Number(ar.estimatedAmount); if (sort === "priority") return priorityRank(br.priority) - priorityRank(ar.priority); return +new Date(ar.createdAt) - +new Date(br.createdAt); }
function priorityRank(value: string) { return ({ BAJA: 1, NORMAL: 2, ALTA: 3, URGENTE: 4 } as Record<string,number>)[value] || 0; }
function actionTitle(action: Action | null) { return action === "approve" ? "Aprobar solicitud" : action === "reject" ? "Rechazar solicitud" : action === "observe" ? "Observar solicitud" : action === "delegate" ? "Delegar aprobación" : action === "reassign" ? "Reasignar aprobación" : "Cancelar flujo"; }
function apiMessage(error: any, fallback: string) { const message = error?.response?.data?.message; return Array.isArray(message) ? message.join(" ") : message || fallback; }
