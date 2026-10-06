import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Flex,
  Grid,
  Heading,
  HStack,
  Input,
  Table,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  CheckCircle2,
  Download,
  Eye,
  FlaskConical,
  LayoutGrid,
  Library,
  List,
  Pencil,
  Plus,
  Power,
  Trash2,
  WandSparkles,
} from "lucide-react";
import {
  catalogsService,
  type Company,
  type Country,
  type Currency,
} from "../../services/catalogs.service";
import {
  policiesService,
  type PolicyField,
  type PolicyFilters,
  type PolicyOperator,
  type PolicyApprovalStep,
  type PolicyResultStatus,
  type PolicyRule,
  type PolicyRulePayload,
  type PolicySimulationPayload,
  type PolicySimulationResult,
} from "../../services/policies.service";
import {
  getSecurityRoles,
  getSecurityUsers,
  type SecurityRole,
  type SecurityUser,
} from "../../services/security.service";

const expenseTypes = ["GASTO_OPERATIVO", "GASTO_VIAJE", "PAGO_PROVEEDOR", "COMPRA_INSUMO", "SERVICIO", "OTRO"];
const priorities = ["BAJA", "NORMAL", "ALTA", "URGENTE"];
const roles = ["ADMIN", "SOLICITANTE", "GERENTE", "FINANZAS", "TESORERIA", "REVISOR_OCR"];
const fields: PolicyField[] = ["AMOUNT", "COMPANY", "COUNTRY", "COST_CENTER", "BUDGET_ACCOUNT", "EXPENSE_TYPE", "PRIORITY", "REQUESTER_ROLE", "DESTINATION", "CURRENCY", "DAYS", "DOCUMENT_TYPE"];
const documentTypes = ["FACTURA", "RECIBO", "COMPROBANTE_DE_PAGO", "NOTA_DE_CREDITO", "NOTA_DE_DEBITO", "OTRO"];
const operators: PolicyOperator[] = ["EQUALS", "NOT_EQUALS", "GREATER_THAN", "GREATER_THAN_OR_EQUAL", "LESS_THAN", "LESS_THAN_OR_EQUAL", "CONTAINS", "IN"];
const actions: Exclude<PolicyResultStatus, "NOT_APPLICABLE">[] = ["OK", "WARNING", "ERROR", "APPROVAL_REQUIRED"];

const emptyForm: PolicyRulePayload = { code: "", name: "", description: "", field: "AMOUNT", operator: "GREATER_THAN", comparisonValue: "", action: "WARNING", message: "", priority: 100 };
const emptySimulation: PolicySimulationPayload = { companyId: "", countryId: "", costCenter: "", budgetAccount: "", expenseType: "GASTO_OPERATIVO", priority: "NORMAL", amount: 0, currency: "GTQ", destination: "", requesterRole: "SOLICITANTE", days: 0 };

type Section = "CATALOG" | "TEMPLATES" | "LIBRARY" | "SIMULATOR";
type ViewMode = "CARDS" | "TABLE";
type PolicyPreset = { id: string; title: string; description: string; payload: PolicyRulePayload };

const templates: PolicyPreset[] = [
  preset("TPL-AMOUNT", "Monto mayor a X", "Solicita aprobación cuando el monto supera el límite.", "AMOUNT", "GREATER_THAN", "10000", "APPROVAL_REQUIRED", 10),
  preset("TPL-COST", "Centro de costo controlado", "Genera advertencia para un centro de costo específico.", "COST_CENTER", "EQUALS", "MARKETING", "WARNING", 20),
  { ...preset("TPL-PERDIEM", "Viáticos: monto diario permitido", "Precarga un límite monetario para solicitudes de viaje.", "AMOUNT", "GREATER_THAN", "1000", "WARNING", 30), payload: { ...preset("X", "", "", "AMOUNT", "GREATER_THAN", "1000", "WARNING", 30).payload, expenseType: "GASTO_VIAJE" } },
  { ...preset("TPL-INTL", "Viaje internacional", "Solicita aprobación y recuerda adjuntar pasaporte.", "DESTINATION", "CONTAINS", "INTERNACIONAL", "APPROVAL_REQUIRED", 40), payload: { ...preset("X", "", "", "DESTINATION", "CONTAINS", "INTERNACIONAL", "APPROVAL_REQUIRED", 40).payload, expenseType: "GASTO_VIAJE", message: "El viaje internacional requiere aprobación y documento de pasaporte." } },
  { ...preset("TPL-PROVIDER", "Proveedor específico", "Genera una advertencia para referencias de proveedor.", "BUDGET_ACCOUNT", "CONTAINS", "PROVEEDOR", "WARNING", 50), payload: { ...preset("X", "", "", "BUDGET_ACCOUNT", "CONTAINS", "PROVEEDOR", "WARNING", 50).payload, expenseType: "PAGO_PROVEEDOR" } },
];

const ruleLibrary: PolicyPreset[] = [
  preset("LIB-10000", "Monto superior a 10,000", "Escalamiento de aprobación por monto.", "AMOUNT", "GREATER_THAN", "10000", "APPROVAL_REQUIRED", 100),
  preset("LIB-100000", "Monto superior a 100,000", "Marca como error un monto extraordinario.", "AMOUNT", "GREATER_THAN", "100000", "ERROR", 110),
  { ...templates[3], id: "LIB-PASSPORT", title: "Pasaporte para viaje internacional" },
  { ...templates[2], id: "LIB-PERDIEM", title: "Límite general de viáticos" },
  preset("LIB-MARKETING", "Centro de costo Marketing", "Advierte sobre solicitudes del centro Marketing.", "COST_CENTER", "EQUALS", "MARKETING", "WARNING", 120),
  preset("LIB-PROJECT", "Proyecto Especial", "Requiere aprobación del Director General.", "BUDGET_ACCOUNT", "CONTAINS", "PROYECTO ESPECIAL", "APPROVAL_REQUIRED", 130),
];

export function PoliciesRulesPage() {
  const [section, setSection] = useState<Section>("CATALOG");
  const [view, setView] = useState<ViewMode>("CARDS");
  const [rules, setRules] = useState<PolicyRule[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [securityRoles, setSecurityRoles] = useState<SecurityRole[]>([]);
  const [securityUsers, setSecurityUsers] = useState<SecurityUser[]>([]);
  const [filters, setFilters] = useState<PolicyFilters>({ sortBy: "priority", sortOrder: "asc" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [meta, setMeta] = useState({ page: 1, pageSize: 10, total: 0, totalPages: 1 });
  const [selected, setSelected] = useState<PolicyRule | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<PolicyRulePayload>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [simulation, setSimulation] = useState<PolicySimulationPayload>(emptySimulation);
  const [simulationResult, setSimulationResult] = useState<PolicySimulationResult | null>(null);
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    Promise.all([catalogsService.getCompanies(), catalogsService.getCountries(), catalogsService.getCurrencies(), getSecurityRoles(), getSecurityUsers()])
      .then(([companyData, countryData, currencyData, roleData, userData]) => { setCompanies(companyData); setCountries(countryData); setCurrencies(currencyData); setSecurityRoles(roleData.filter((role) => role.active)); setSecurityUsers(userData.filter((user) => user.active)); })
      .catch(() => { setCompanies([]); setCountries([]); setCurrencies([]); setSecurityRoles([]); setSecurityUsers([]); });
  }, []);

  const loadRules = async () => {
    setLoading(true);
    try {
      const response = await policiesService.listPage({ ...cleanFilters(filters), page, pageSize });
      setRules(response.data);
      setMeta(response.meta);
    } catch (error: any) {
      alert(apiMessage(error, "No se pudieron cargar las políticas."));
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (section !== "CATALOG") return;
    const timer = window.setTimeout(loadRules, 250);
    return () => window.clearTimeout(timer);
  }, [section, filters, page, pageSize]);

  const stats = useMemo(() => ({ active: rules.filter((rule) => rule.active).length, inactive: rules.filter((rule) => !rule.active).length, errors: rules.filter((rule) => rule.action === "ERROR").length, approvals: rules.filter((rule) => rule.action === "APPROVAL_REQUIRED").length }), [rules]);
  const updateFilter = (key: keyof PolicyFilters, value: unknown) => { setFilters((current) => ({ ...current, [key]: value || undefined })); setPage(1); };
  const updateForm = <K extends keyof PolicyRulePayload>(key: K, value: PolicyRulePayload[K]) => setForm((current) => ({ ...current, [key]: value }));

  const startCreate = (payload: PolicyRulePayload = emptyForm) => { setSelected(null); setForm({ ...payload }); setEditing(true); setSection("CATALOG"); };
  const startEdit = (rule: PolicyRule) => { setSelected(rule); setForm(toForm(rule)); setEditing(true); };
  const showDetail = async (rule: PolicyRule) => { try { setSelected(await policiesService.getById(rule.id)); setEditing(false); } catch (error: any) { alert(apiMessage(error, "No se pudo consultar la política.")); } };

  const save = async () => {
    const validation = validateForm(form);
    if (validation) { alert(validation); return; }
    setSaving(true);
    try {
      const payload = normalizePayload(form);
      const saved = selected ? await policiesService.update(selected.id, payload) : await policiesService.create(payload);
      setSelected(saved); setEditing(false); await loadRules();
    } catch (error: any) { alert(apiMessage(error, "No se pudo guardar la política.")); } finally { setSaving(false); }
  };

  const toggle = async (rule: PolicyRule) => { try { const updated = rule.active ? await policiesService.deactivate(rule.id) : await policiesService.activate(rule.id); if (selected?.id === rule.id) setSelected(updated); await loadRules(); } catch (error: any) { alert(apiMessage(error, "No se pudo cambiar el estado.")); } };
  const remove = async (rule: PolicyRule) => { if (!window.confirm(`¿Eliminar lógicamente ${rule.code}?`)) return; try { await policiesService.remove(rule.id); if (selected?.id === rule.id) setSelected(null); await loadRules(); } catch (error: any) { alert(apiMessage(error, "No se pudo eliminar la política.")); } };

  const simulate = async () => {
    if (!simulation.companyId || !simulation.countryId || !simulation.currency || Number(simulation.amount) < 0) { alert("Empresa, país, moneda y monto válido son obligatorios."); return; }
    setSimulating(true);
    try { setSimulationResult(await policiesService.simulate({ ...simulation, amount: Number(simulation.amount), days: Number(simulation.days || 0) })); }
    catch (error: any) { alert(apiMessage(error, "No se pudo ejecutar la simulación.")); }
    finally { setSimulating(false); }
  };

  const exportCatalog = async (format: "JSON" | "CSV" | "EXCEL") => {
    try {
      const allRules = await policiesService.list(cleanFilters(filters));
      if (format === "JSON") download(JSON.stringify(allRules, null, 2), "politicas.json", "application/json");
      else if (format === "CSV") download(toCsv(allRules), "politicas.csv", "text/csv;charset=utf-8");
      else download(toExcel(allRules), "politicas.xls", "application/vnd.ms-excel;charset=utf-8");
    } catch (error: any) { alert(apiMessage(error, "No se pudo exportar el catálogo.")); }
  };

  return <VStack align="stretch" gap="5">
    <Flex justify="space-between" align={{ base: "start", md: "center" }} gap="4"><Box><Heading size="lg">Catálogo de políticas de negocio</Heading><Text color="gray.500">Administra, prueba y exporta reglas consumidas por el motor institucional.</Text></Box><Button colorPalette="blue" onClick={() => startCreate()}><Plus size={17}/>Nueva política</Button></Flex>
    <HStack wrap="wrap">{(["CATALOG", "TEMPLATES", "LIBRARY", "SIMULATOR"] as Section[]).map((item) => <Button key={item} size="sm" variant={section === item ? "solid" : "outline"} colorPalette={section === item ? "blue" : "gray"} onClick={() => setSection(item)}>{item === "CATALOG" ? <List size={15}/> : item === "TEMPLATES" ? <WandSparkles size={15}/> : item === "LIBRARY" ? <Library size={15}/> : <FlaskConical size={15}/>} {sectionLabel(item)}</Button>)}</HStack>

    {section === "CATALOG" && <>
      <Grid templateColumns={{ base: "1fr 1fr", xl: "repeat(5, 1fr)" }} gap="3"><Stat label="Total filtrado" value={meta.total}/><Stat label="Activas en página" value={stats.active}/><Stat label="Inactivas" value={stats.inactive}/><Stat label="Errores" value={stats.errors}/><Stat label="Requieren aprobación" value={stats.approvals}/></Grid>
      <FilterPanel filters={filters} companies={companies} countries={countries} update={updateFilter}/>
      <Flex justify="space-between" wrap="wrap" gap="3"><HStack><Button size="sm" variant={view === "CARDS" ? "solid" : "outline"} onClick={() => setView("CARDS")}><LayoutGrid size={15}/>Tarjetas</Button><Button size="sm" variant={view === "TABLE" ? "solid" : "outline"} onClick={() => setView("TABLE")}><List size={15}/>Tabla</Button></HStack><HStack><Button size="sm" variant="outline" onClick={() => exportCatalog("CSV")}><Download size={15}/>CSV</Button><Button size="sm" variant="outline" onClick={() => exportCatalog("EXCEL")}><Download size={15}/>Excel</Button><Button size="sm" variant="outline" onClick={() => exportCatalog("JSON")}><Download size={15}/>JSON</Button></HStack></Flex>
      <Grid templateColumns={{ base: "1fr", xl: selected || editing ? "1.45fr 1fr" : "1fr" }} gap="5" alignItems="start">
        <Box>{loading ? <Text color="gray.500">Cargando políticas...</Text> : rules.length === 0 ? <Empty/> : view === "CARDS" ? <VStack align="stretch" gap="3">{rules.map((rule) => <PolicyCard key={rule.id} rule={rule} detail={() => showDetail(rule)} edit={() => startEdit(rule)} toggle={() => toggle(rule)} remove={() => remove(rule)}/>)}</VStack> : <PolicyTable rules={rules} detail={showDetail} edit={startEdit} toggle={toggle}/>}<Pagination meta={meta} pageSize={pageSize} setPage={setPage} setPageSize={(size) => { setPageSize(size); setPage(1); }}/></Box>
        {(editing || selected) && <Box bg="white" border="1px solid" borderColor="gray.200" rounded="2xl" p="5" position={{ xl: "sticky" }} top="4">{editing ? <><PolicyForm form={form} companies={companies} countries={countries} currencies={currencies} update={updateForm} save={save} saving={saving} cancel={() => setEditing(false)}/>{form.action === "APPROVAL_REQUIRED" && <ApprovalRouteEditor form={form} roles={securityRoles} users={securityUsers} update={updateForm}/>}</> : selected ? <PolicyDetail rule={selected} edit={() => startEdit(selected)}/> : null}</Box>}
      </Grid>
    </>}
    {section === "TEMPLATES" && <PresetGallery title="Plantillas rápidas" description="Precargan el formulario; puedes ajustar todos los valores antes de guardar." presets={templates} apply={(presetValue) => startCreate(presetValue.payload)}/>} 
    {section === "LIBRARY" && <PresetGallery title="Biblioteca de reglas empresariales" description="Ejemplos reutilizables que no se insertan automáticamente." presets={ruleLibrary} apply={(presetValue) => startCreate(presetValue.payload)}/>} 
    {section === "SIMULATOR" && <Simulator value={simulation} setValue={setSimulation} companies={companies} countries={countries} currencies={currencies} run={simulate} running={simulating} result={simulationResult}/>} 
  </VStack>;
}

function FilterPanel({ filters, companies, countries, update }: { filters: PolicyFilters; companies: Company[]; countries: Country[]; update: (key: keyof PolicyFilters, value: unknown) => void }) {
  return <Box bg="white" border="1px solid" borderColor="gray.200" rounded="2xl" p="4"><Text fontWeight="semibold" mb="3">Filtros avanzados</Text><Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)", xl: "repeat(5, 1fr)" }} gap="3"><Input placeholder="Buscar código, nombre o mensaje" value={filters.search || ""} onChange={(e) => update("search", e.target.value)}/><Select value={filters.companyId || ""} onChange={(v) => update("companyId", v)} options={[blank("Todas las empresas"), ...companies.map((c) => ({ value: c.id, label: c.code }))]}/><Select value={filters.countryId || ""} onChange={(v) => update("countryId", v)} options={[blank("Todos los países"), ...countries.map((c) => ({ value: c.id, label: c.code }))]}/><Select value={filters.expenseType || ""} onChange={(v) => update("expenseType", v)} options={[blank("Todos los tipos"), ...expenseTypes.map(option)]}/><Select value={filters.active === undefined ? "" : String(filters.active)} onChange={(v) => update("active", v === "" ? undefined : v === "true")} options={[blank("Todos los estados"), { value: "true", label: "Activas" }, { value: "false", label: "Inactivas" }]}/><Select value={filters.validity || ""} onChange={(v) => update("validity", v)} options={[blank("Toda vigencia"), option("CURRENT"), option("UPCOMING"), option("EXPIRED")]}/><Input type="number" min="1" placeholder="Prioridad exacta" value={filters.priority || ""} onChange={(e) => update("priority", e.target.value ? Number(e.target.value) : undefined)}/><Select value={filters.action || ""} onChange={(v) => update("action", v)} options={[blank("Todos los resultados"), ...actions.map(option)]}/><Select value={filters.field || ""} onChange={(v) => update("field", v)} options={[blank("Todos los campos"), ...fields.map(option)]}/><Select value={filters.operator || ""} onChange={(v) => update("operator", v)} options={[blank("Todos los operadores"), ...operators.map(option)]}/><Select value={filters.sortBy || "priority"} onChange={(v) => update("sortBy", v)} options={[option("priority"), option("code"), option("name"), option("createdAt"), option("updatedAt")]}/><Select value={filters.sortOrder || "asc"} onChange={(v) => update("sortOrder", v)} options={[{ value: "asc", label: "Ascendente" }, { value: "desc", label: "Descendente" }]}/></Grid></Box>;
}

function PolicyCard({ rule, detail, edit, toggle, remove }: { rule: PolicyRule; detail: () => void; edit: () => void; toggle: () => void; remove: () => void }) { const validity = validityInfo(rule); return <Box bg="white" border="1px solid" borderColor="gray.200" rounded="xl" p="4"><Flex justify="space-between" gap="4" align="start"><Box><HStack wrap="wrap" mb="2"><Badge colorPalette="blue">{rule.code}</Badge><ResultBadge value={rule.action}/><Badge colorPalette={rule.active ? "green" : "gray"}>{rule.active ? "ACTIVA" : "INACTIVA"}</Badge><Badge colorPalette={validity.color}>{validity.label}</Badge></HStack><Text fontWeight="semibold">{rule.name}</Text><Text fontSize="sm" color="gray.500">{friendlyCondition(rule)}</Text><Text fontSize="sm" mt="2">{rule.message}</Text><Text fontSize="xs" color="gray.500" mt="2">Prioridad {rule.priority} · {rule.company?.code || "Todas las empresas"} · {rule.expenseType || "Todos los tipos"}</Text></Box><HStack wrap="wrap" justify="end"><IconButton label="Ver" icon={<Eye size={14}/>} onClick={detail}/><IconButton label="Editar" icon={<Pencil size={14}/>} onClick={edit}/><IconButton label={rule.active ? "Desactivar" : "Activar"} icon={<Power size={14}/>} onClick={toggle}/><IconButton label="Eliminar" icon={<Trash2 size={14}/>} onClick={remove} red/></HStack></Flex></Box>; }

function PolicyTable({ rules, detail, edit, toggle }: { rules: PolicyRule[]; detail: (rule: PolicyRule) => void; edit: (rule: PolicyRule) => void; toggle: (rule: PolicyRule) => void }) { return <Box bg="white" border="1px solid" borderColor="gray.200" rounded="xl" overflowX="auto"><Table.Root size="sm"><Table.Header><Table.Row><Table.ColumnHeader>Código</Table.ColumnHeader><Table.ColumnHeader>Política</Table.ColumnHeader><Table.ColumnHeader>Condición</Table.ColumnHeader><Table.ColumnHeader>Resultado</Table.ColumnHeader><Table.ColumnHeader>Estado</Table.ColumnHeader><Table.ColumnHeader>Acciones</Table.ColumnHeader></Table.Row></Table.Header><Table.Body>{rules.map((rule) => <Table.Row key={rule.id}><Table.Cell>{rule.code}</Table.Cell><Table.Cell>{rule.name}</Table.Cell><Table.Cell>{friendlyCondition(rule)}</Table.Cell><Table.Cell><ResultBadge value={rule.action}/></Table.Cell><Table.Cell><Badge colorPalette={rule.active ? "green" : "gray"}>{rule.active ? "ACTIVA" : "INACTIVA"}</Badge></Table.Cell><Table.Cell><HStack><IconButton label="Ver" icon={<Eye size={14}/>} onClick={() => detail(rule)}/><IconButton label="Editar" icon={<Pencil size={14}/>} onClick={() => edit(rule)}/><IconButton label="Estado" icon={<Power size={14}/>} onClick={() => toggle(rule)}/></HStack></Table.Cell></Table.Row>)}</Table.Body></Table.Root></Box>; }

function PolicyForm({ form, companies, countries, currencies, update, save, saving, cancel }: { form: PolicyRulePayload; companies: Company[]; countries: Country[]; currencies: Currency[]; update: <K extends keyof PolicyRulePayload>(key: K, value: PolicyRulePayload[K]) => void; save: () => void; saving: boolean; cancel: () => void }) { const availableOperators = numericField(form.field) ? operators.filter(numericOperator) : operators.filter((value) => !numericOperator(value)); const valueOptions = form.operator === "IN" ? null : form.field === "EXPENSE_TYPE" ? expenseTypes.map(option) : form.field === "PRIORITY" ? priorities.map(option) : form.field === "REQUESTER_ROLE" ? roles.map(option) : form.field === "COUNTRY" ? countries.map((c) => ({ value: c.id, label: `${c.code} - ${c.name}` })) : form.field === "CURRENCY" ? currencies.map((c) => ({ value: c.code, label: `${c.code} - ${c.name}` })) : null; const changeField = (value: string) => { const field = value as PolicyField; update("field", field); update("operator", numericField(field) ? "GREATER_THAN" : "EQUALS"); update("comparisonValue", ""); update("companyId", undefined); update("expenseType", undefined); }; return <VStack align="stretch" gap="3"><Heading size="md">{form.code ? "Configurar política" : "Nueva política"}</Heading><Text fontSize="sm" color="gray.500">La condición dispara el resultado esperado cuando coincide con los datos evaluados.</Text><Field label="Código" help="Identificador único, por ejemplo MONTO_GERENCIA"><Input value={form.code} onChange={(e) => update("code", e.target.value)}/></Field><Field label="Nombre"><Input value={form.name} onChange={(e) => update("name", e.target.value)}/></Field><Field label="Descripción amigable"><textarea value={form.description || ""} onChange={(e) => update("description", e.target.value)} style={textAreaStyle}/></Field><Grid templateColumns="1fr 1fr" gap="3"><Field label="Campo evaluado"><Select value={form.field} onChange={changeField} options={fields.map(option)}/></Field><Field label="Operador"><Select value={form.operator} onChange={(v) => { update("operator", v as PolicyOperator); if (v !== "EQUALS" && form.field === "COMPANY") update("companyId", undefined); if (v !== "EQUALS" && form.field === "EXPENSE_TYPE") update("expenseType", undefined); }} options={availableOperators.map(option)}/></Field></Grid><Field label="Valor" help={form.operator === "IN" ? "Escribe dos o más valores separados por coma." : undefined}>{form.field === "COMPANY" && form.operator === "EQUALS" ? <Select value={form.companyId || ""} onChange={(v) => { update("companyId", v || undefined); update("comparisonValue", v); }} options={[blank("Seleccione"), ...companies.map((c) => ({ value: c.id, label: `${c.code} - ${c.name}` }))]}/> : valueOptions ? <Select value={form.comparisonValue} onChange={(v) => { update("comparisonValue", v); if (form.field === "EXPENSE_TYPE") update("expenseType", v || undefined); }} options={[blank("Seleccione"), ...valueOptions]}/> : <Input type={numericField(form.field) ? "number" : "text"} min="0" value={form.comparisonValue} onChange={(e) => update("comparisonValue", e.target.value)}/>}</Field><Grid templateColumns="1fr 1fr" gap="3"><Field label="Resultado esperado"><Select value={form.action} onChange={(v) => update("action", v as PolicyResultStatus)} options={actions.map(option)}/></Field><Field label="Prioridad" help="Menor número se evalúa primero."><Input type="number" min="1" max="9999" value={form.priority} onChange={(e) => update("priority", Number(e.target.value))}/></Field></Grid>{form.field !== "COMPANY" && <Field label="Alcance por empresa"><Select value={form.companyId || ""} onChange={(v) => update("companyId", v || undefined)} options={[blank("Todas"), ...companies.map((c) => ({ value: c.id, label: c.code }))]}/></Field>}{form.field !== "EXPENSE_TYPE" && <Field label="Alcance por tipo"><Select value={form.expenseType || ""} onChange={(v) => update("expenseType", v || undefined)} options={[blank("Todos"), ...expenseTypes.map(option)]}/></Field>}<Field label="Mensaje para el usuario"><textarea value={form.message} onChange={(e) => update("message", e.target.value)} style={textAreaStyle}/></Field><Grid templateColumns="1fr 1fr" gap="3"><Field label="Vigente desde"><Input type="datetime-local" value={form.validFrom || ""} onChange={(e) => update("validFrom", e.target.value || undefined)}/></Field><Field label="Vigente hasta"><Input type="datetime-local" value={form.validTo || ""} onChange={(e) => update("validTo", e.target.value || undefined)}/></Field></Grid><HStack justify="end"><Button variant="outline" onClick={cancel}>Cancelar</Button><Button colorPalette="blue" loading={saving} onClick={save}><CheckCircle2 size={16}/>Guardar</Button></HStack></VStack>; }

function Simulator({ value, setValue, companies, countries, currencies, run, running, result }: { value: PolicySimulationPayload; setValue: React.Dispatch<React.SetStateAction<PolicySimulationPayload>>; companies: Company[]; countries: Country[]; currencies: Currency[]; run: () => void; running: boolean; result: PolicySimulationResult | null }) { const update = (key: keyof PolicySimulationPayload, next: unknown) => setValue((current) => ({ ...current, [key]: next })); return <Grid templateColumns={{ base: "1fr", xl: "1fr 1.2fr" }} gap="5" alignItems="start"><Box bg="white" border="1px solid" borderColor="gray.200" rounded="2xl" p="5"><Heading size="md">Simulador</Heading><Text fontSize="sm" color="gray.500" mb="4">Evalúa las reglas activas sin crear ni modificar solicitudes.</Text><Grid templateColumns="1fr 1fr" gap="3"><Field label="Empresa"><Select value={value.companyId} onChange={(v) => update("companyId", v)} options={[blank("Seleccione"), ...companies.map((c) => ({ value: c.id, label: c.code }))]}/></Field><Field label="País"><Select value={value.countryId} onChange={(v) => update("countryId", v)} options={[blank("Seleccione"), ...countries.map((c) => ({ value: c.id, label: c.code }))]}/></Field><Field label="Tipo"><Select value={value.expenseType} onChange={(v) => update("expenseType", v)} options={expenseTypes.map(option)}/></Field><Field label="Prioridad"><Select value={value.priority || "NORMAL"} onChange={(v) => update("priority", v)} options={priorities.map(option)}/></Field><Field label="Monto"><Input type="number" min="0" value={value.amount} onChange={(e) => update("amount", Number(e.target.value))}/></Field><Field label="Moneda"><Select value={value.currency} onChange={(v) => update("currency", v)} options={currencies.map((c) => ({ value: c.code, label: c.code }))}/></Field><Field label="Centro de costo"><Input value={value.costCenter || ""} onChange={(e) => update("costCenter", e.target.value)}/></Field><Field label="Cuenta"><Input value={value.budgetAccount || ""} onChange={(e) => update("budgetAccount", e.target.value)}/></Field><Field label="Destino"><Input value={value.destination || ""} onChange={(e) => update("destination", e.target.value)}/></Field><Field label="Rol"><Select value={value.requesterRole} onChange={(v) => update("requesterRole", v)} options={roles.map(option)}/></Field><Field label="Días"><Input type="number" min="0" value={value.days || 0} onChange={(e) => update("days", Number(e.target.value))}/></Field></Grid><Button mt="4" colorPalette="blue" loading={running} onClick={run}><FlaskConical size={16}/>Evaluar políticas</Button></Box><SimulationResults result={result}/></Grid>; }

function SimulationResults({ result }: { result: PolicySimulationResult | null }) { if (!result) return <Box bg="gray.50" border="1px dashed" borderColor="gray.300" rounded="2xl" p="8" textAlign="center"><FlaskConical style={{ margin: "0 auto 8px" }}/><Text>Completa los datos para ver el resultado.</Text></Box>; return <VStack align="stretch" gap="3"><Grid templateColumns="repeat(4, 1fr)" gap="2"><Stat label="Aplicadas" value={result.results.length - result.notApplicable.length}/><Stat label="Ignoradas" value={result.notApplicable.length}/><Stat label="Advertencias" value={result.warnings.length}/><Stat label="Errores" value={result.errors.length}/></Grid>{([...["errors", "approvalsRequired", "warnings", "ok", "notApplicable"] as const]).map((key) => result[key].length > 0 && <Box key={key} bg="white" border="1px solid" borderColor="gray.200" rounded="xl" p="4"><Heading size="sm" mb="2">{resultGroupLabel(key)}</Heading><VStack align="stretch" gap="2">{result[key].map((item) => <Box key={item.ruleId} bg="gray.50" p="3" rounded="lg"><HStack><Badge>{item.code}</Badge><ResultBadge value={item.status}/></HStack><Text fontSize="sm" fontWeight="semibold" mt="1">{item.name}</Text><Text fontSize="sm" color="gray.600">{item.message}</Text></Box>)}</VStack></Box>)}</VStack>; }

function PresetGallery({ title, description, presets, apply }: { title: string; description: string; presets: PolicyPreset[]; apply: (preset: PolicyPreset) => void }) { return <Box><Heading size="md">{title}</Heading><Text color="gray.500" mb="4">{description}</Text><Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", xl: "repeat(3, 1fr)" }} gap="4">{presets.map((presetValue) => <Box key={presetValue.id} bg="white" border="1px solid" borderColor="gray.200" rounded="xl" p="5"><HStack mb="2"><Badge colorPalette="purple">{presetValue.payload.field}</Badge><ResultBadge value={presetValue.payload.action}/></HStack><Text fontWeight="semibold">{presetValue.title}</Text><Text fontSize="sm" color="gray.500" mt="1">{presetValue.description}</Text><Text fontSize="xs" mt="3">{presetValue.payload.operator} · {presetValue.payload.comparisonValue}</Text><Button mt="4" size="sm" variant="outline" onClick={() => apply(presetValue)}><WandSparkles size={15}/>Usar plantilla</Button></Box>)}</Grid></Box>; }

function PolicyDetail({ rule, edit }: { rule: PolicyRule; edit: () => void }) { const validity = validityInfo(rule); return <VStack align="stretch" gap="3"><HStack justify="space-between"><Heading size="md">Detalle</Heading><Button size="sm" onClick={edit}><Pencil size={15}/>Editar</Button></HStack><HStack><Badge colorPalette="blue">{rule.code}</Badge><ResultBadge value={rule.action}/><Badge colorPalette={validity.color}>{validity.label}</Badge></HStack><Text fontWeight="semibold">{rule.name}</Text><Text color="gray.600">{rule.description || "Sin descripción"}</Text><Detail label="Condición" value={friendlyCondition(rule)}/><Detail label="Mensaje" value={rule.message}/><Detail label="Prioridad" value={String(rule.priority)}/><Detail label="Empresa" value={rule.company ? `${rule.company.code} - ${rule.company.name}` : "Todas"}/><Detail label="Tipo" value={rule.expenseType || "Todos"}/><Detail label="Vigencia" value={`${formatDate(rule.validFrom)} — ${formatDate(rule.validTo)}`}/></VStack>; }

function Pagination({ meta, pageSize, setPage, setPageSize }: { meta: { page: number; total: number; totalPages: number }; pageSize: number; setPage: (page: number) => void; setPageSize: (size: number) => void }) { return <Flex mt="4" justify="space-between" align="center"><Text fontSize="sm" color="gray.500">Página {meta.page} de {meta.totalPages} · {meta.total} registros</Text><HStack><Select value={String(pageSize)} onChange={(v) => setPageSize(Number(v))} options={[{ value: "5", label: "5" }, { value: "10", label: "10" }, { value: "20", label: "20" }]}/><Button size="sm" disabled={meta.page <= 1} onClick={() => setPage(meta.page - 1)}>Anterior</Button><Button size="sm" disabled={meta.page >= meta.totalPages} onClick={() => setPage(meta.page + 1)}>Siguiente</Button></HStack></Flex>; }
function Stat({ label, value }: { label: string; value: number }) { return <Box bg="white" border="1px solid" borderColor="gray.200" rounded="xl" p="4"><Text fontSize="sm" color="gray.500">{label}</Text><Text fontSize="2xl" fontWeight="bold">{value}</Text></Box>; }
function Empty() { return <Box p="8" textAlign="center" bg="white" rounded="xl" border="1px dashed" borderColor="gray.300"><Text>No existen políticas para los filtros seleccionados.</Text></Box>; }
function Field({ label, help, children }: { label: string; help?: string; children: React.ReactNode }) { return <Box><Text fontSize="sm" fontWeight="medium" mb="1">{label}</Text>{children}{help && <Text fontSize="xs" color="gray.500" mt="1">{help}</Text>}</Box>; }
function Detail({ label, value }: { label: string; value: string }) { return <Box><Text fontSize="xs" color="gray.500">{label}</Text><Text fontSize="sm">{value}</Text></Box>; }
function Select({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: { value: string; label: string }[] }) { return <select value={value} onChange={(e) => onChange(e.target.value)} style={selectStyle}>{options.map((item) => <option key={`${item.value}-${item.label}`} value={item.value}>{item.label}</option>)}</select>; }
function IconButton({ label, icon, onClick, red }: { label: string; icon: React.ReactNode; onClick: () => void; red?: boolean }) { return <Button size="xs" variant="outline" colorPalette={red ? "red" : "gray"} title={label} onClick={onClick}>{icon}</Button>; }
function ResultBadge({ value }: { value: PolicyResultStatus }) { const color = value === "ERROR" ? "red" : value === "WARNING" ? "orange" : value === "APPROVAL_REQUIRED" ? "purple" : value === "OK" ? "green" : "gray"; return <Badge colorPalette={color}>{value}</Badge>; }

function preset(id: string, title: string, description: string, field: PolicyField, operator: PolicyOperator, comparisonValue: string, action: Exclude<PolicyResultStatus, "NOT_APPLICABLE">, priority: number): PolicyPreset { return { id, title, description, payload: { code: id.replace(/^(TPL|LIB)-/, ""), name: title, description, field, operator, comparisonValue, action, message: description, priority } }; }
function option(value: string) { return { value, label: value.replace(/_/g, " ") }; }
function blank(label: string) { return { value: "", label }; }
function numericField(field: PolicyField) { return field === "AMOUNT" || field === "DAYS"; }
function numericOperator(operator: PolicyOperator) { return ["GREATER_THAN", "GREATER_THAN_OR_EQUAL", "LESS_THAN", "LESS_THAN_OR_EQUAL"].includes(operator); }
function sectionLabel(section: Section) { return section === "CATALOG" ? "Catálogo" : section === "TEMPLATES" ? "Plantillas" : section === "LIBRARY" ? "Biblioteca" : "Simulador"; }
function friendlyCondition(rule: PolicyRule) { return `${option(rule.field).label} ${option(rule.operator).label.toLowerCase()} ${rule.comparisonValue}`; }
function validityInfo(rule: PolicyRule) { const now = Date.now(), from = rule.validFrom ? new Date(rule.validFrom).getTime() : null, to = rule.validTo ? new Date(rule.validTo).getTime() : null; if (from && from > now) return { label: "FUTURA", color: "blue" }; if (to && to < now) return { label: "EXPIRADA", color: "red" }; if (to && to - now <= 7 * 86400000) return { label: "PRÓXIMA A VENCER", color: "orange" }; return { label: "VIGENTE", color: "green" }; }
function formatDate(value?: string | null) { return value ? new Date(value).toLocaleString() : "Sin límite"; }
function toLocalDateTime(value?: string | null) { if (!value) return undefined; const date = new Date(value), offset = date.getTimezoneOffset() * 60000; return new Date(date.getTime() - offset).toISOString().slice(0, 16); }
function toForm(rule: PolicyRule): PolicyRulePayload { return { code: rule.code, name: rule.name, description: rule.description || "", field: rule.field, operator: rule.operator, comparisonValue: rule.comparisonValue, action: rule.action, message: rule.message, priority: rule.priority, companyId: rule.companyId || undefined, expenseType: rule.expenseType || undefined, validFrom: toLocalDateTime(rule.validFrom), validTo: toLocalDateTime(rule.validTo), approvalSteps: rule.approvalSteps?.map(({ order, approverRoleId, approverUserId, required }) => ({ order, approverRoleId, approverUserId, required })) }; }
function normalizePayload(form: PolicyRulePayload): PolicyRulePayload { return { ...form, priority: Number(form.priority), companyId: form.companyId || undefined, expenseType: form.expenseType || undefined, validFrom: form.validFrom ? new Date(form.validFrom).toISOString() : undefined, validTo: form.validTo ? new Date(form.validTo).toISOString() : undefined, approvalSteps: form.action === "APPROVAL_REQUIRED" ? (form.approvalSteps || []).map((step, index) => ({ order: index + 1, approverRoleId: step.approverRoleId || undefined, approverUserId: step.approverUserId || undefined, required: step.required !== false })) : undefined }; }
function validateForm(form: PolicyRulePayload) { if (!form.code.trim() || !form.name.trim() || !form.comparisonValue.trim() || !form.message.trim()) return "Código, nombre, valor y mensaje son obligatorios."; if (Number(form.priority) <= 0) return "La prioridad debe ser mayor que cero."; if (form.validFrom && form.validTo && form.validFrom > form.validTo) return "La fecha inicial no puede ser posterior a la final."; if (form.operator === "IN" && form.comparisonValue.split(",").filter((v) => v.trim()).length < 2) return "El operador IN requiere al menos dos valores."; if (form.action === "APPROVAL_REQUIRED" && !(form.approvalSteps || []).length) return "Configura al menos un nivel de aprobación."; if ((form.approvalSteps || []).some((step) => !step.approverRoleId && !step.approverUserId)) return "Cada nivel debe indicar un rol o usuario aprobador."; return ""; }
function cleanFilters(filters: PolicyFilters): PolicyFilters { return Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== "" && value !== undefined)) as PolicyFilters; }
function apiMessage(error: any, fallback: string) { const message = error.response?.data?.message; return Array.isArray(message) ? message.join("\n") : message || fallback; }
function resultGroupLabel(key: string) { return key === "errors" ? "Errores" : key === "approvalsRequired" ? "Aprobaciones requeridas" : key === "warnings" ? "Advertencias" : key === "ok" ? "Reglas cumplidas" : "Reglas ignoradas"; }
function download(content: string, name: string, type: string) { const blob = new Blob(["\uFEFF", content], { type }), url = URL.createObjectURL(blob), anchor = document.createElement("a"); anchor.href = url; anchor.download = name; anchor.click(); URL.revokeObjectURL(url); }
function exportRows(rules: PolicyRule[]) { const headers = ["Código", "Nombre", "Campo", "Operador", "Valor", "Resultado", "Prioridad", "Empresa", "Tipo", "Estado", "Vigencia desde", "Vigencia hasta", "Mensaje"]; return [headers, ...rules.map((rule) => [rule.code, rule.name, rule.field, rule.operator, rule.comparisonValue, rule.action, rule.priority, rule.company?.code || "TODAS", rule.expenseType || "TODOS", rule.active ? "ACTIVA" : "INACTIVA", rule.validFrom || "", rule.validTo || "", rule.message])]; }
function toCsv(rules: PolicyRule[]) { return exportRows(rules).map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\r\n"); }
function toExcel(rules: PolicyRule[]) { const rows = exportRows(rules).map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(String(cell))}</td>`).join("")}</tr>`).join(""); return `<html><head><meta charset="UTF-8"></head><body><table>${rows}</table></body></html>`; }
function escapeHtml(value: string) { return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
function ApprovalRouteEditor({ form, roles, users, update }: { form: PolicyRulePayload; roles: SecurityRole[]; users: SecurityUser[]; update: <K extends keyof PolicyRulePayload>(key: K, value: PolicyRulePayload[K]) => void }) {
  const steps = form.approvalSteps || [];
  const replace = (index: number, patch: Partial<PolicyApprovalStep>) => update("approvalSteps", steps.map((step, position) => position === index ? { ...step, ...patch } : step));
  const remove = (index: number) => update("approvalSteps", steps.filter((_, position) => position !== index).map((step, position) => ({ ...step, order: position + 1 })));
  const add = () => update("approvalSteps", [...steps, { order: steps.length + 1, required: true }]);
  return <Box mt="5" pt="5" borderTop="1px solid" borderColor="gray.200"><HStack justify="space-between" mb="2"><Box><Heading size="sm">Ruta de aprobación</Heading><Text fontSize="sm" color="gray.500">Define los niveles en el orden en que deben resolverse.</Text></Box><Button size="sm" variant="outline" onClick={add}><Plus size={15}/>Agregar nivel</Button></HStack><VStack align="stretch" gap="3">{steps.map((step, index) => { const roleUsers = step.approverRoleId ? users.filter((user) => user.roles?.some(({ role }) => role.id === step.approverRoleId)) : users; return <Grid key={`${step.order}-${index}`} templateColumns={{ base: "1fr", md: "70px 1fr 1fr auto" }} gap="2" alignItems="end" p="3" rounded="lg" bg="gray.50"><Field label="Nivel"><Input value={index + 1} readOnly/></Field><Field label="Rol aprobador"><Select value={step.approverRoleId || ""} onChange={(value) => replace(index, { approverRoleId: value || undefined, approverUserId: undefined })} options={[blank("Seleccione un rol"), ...roles.map((role) => ({ value: role.id, label: `${role.code} - ${role.name}` }))]}/></Field><Field label="Usuario específico (opcional)"><Select value={step.approverUserId || ""} onChange={(value) => replace(index, { approverUserId: value || undefined })} options={[blank("Asignación automática"), ...roleUsers.map((user) => ({ value: user.id, label: `${user.name} - ${user.email}` }))]}/></Field><IconButton label="Eliminar nivel" icon={<Trash2 size={15}/>} red onClick={() => remove(index)}/></Grid>; })}{!steps.length && <Text fontSize="sm" color="orange.600">La política todavía no tiene una ruta configurada.</Text>}</VStack></Box>;
}
const selectStyle = { width: "100%", minHeight: "40px", padding: "0 10px", border: "1px solid #e2e8f0", borderRadius: "8px", background: "white" };
const textAreaStyle = { ...selectStyle, minHeight: "76px", padding: "8px 10px" };
