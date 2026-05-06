export type ExpenseType =
  | "GASTO_VIAJE"
  | "PAGO_PROVEEDOR"
  | "COMPRA_INSUMO"
  | "SERVICIO"
  | "REEMBOLSO";

export type ExpensePriority = "BAJA" | "NORMAL" | "ALTA" | "URGENTE";

export const expenseTypes = [
  {
    value: "GASTO_VIAJE",
    label: "Gasto de viaje / viáticos",
    description: "Alimentación, hospedaje, transporte y gastos por viaje.",
  },
  {
    value: "PAGO_PROVEEDOR",
    label: "Pago a proveedor",
    description: "Pago de facturas, servicios externos o proveedores.",
  },
  {
    value: "COMPRA_INSUMO",
    label: "Compra de insumos",
    description: "Compra de materiales, útiles, equipo menor o suministros.",
  },
  {
    value: "SERVICIO",
    label: "Servicio contratado",
    description: "Contratación de servicios técnicos, profesionales u operativos.",
  },
  {
    value: "REEMBOLSO",
    label: "Reembolso",
    description: "Reintegro de gastos efectuados por un colaborador.",
  },
];

export const priorities = [
  { value: "BAJA", label: "Baja" },
  { value: "NORMAL", label: "Normal" },
  { value: "ALTA", label: "Alta" },
  { value: "URGENTE", label: "Urgente" },
];

export const requesterRoles = [
  {
    value: "Operador",
    label: "Operador",
  },
  {
    value: "Jefe",
    label: "Jefe",
  },
  {
    value: "Gerente",
    label: "Gerente",
  },
  {
    value: "Director",
    label: "Director",
  },
];

export const companies = [
  {
    id: "EMP-001",
    name: "Servicios Compartidos",
  },
  {
    id: "EMP-002",
    name: "Empresa Comercial",
  },
  {
    id: "EMP-003",
    name: "Empresa Operativa",
  },
];

export const costCenters = [
  {
    id: "CC-ADM-001",
    name: "Administración",
    companyId: "EMP-001",
  },
  {
    id: "CC-ADM-003",
    name: "Administración de Servicios",
    companyId: "EMP-001",
  },
  {
    id: "CC-OPS-001",
    name: "Operaciones",
    companyId: "EMP-001",
  },
  {
    id: "CC-TI-001",
    name: "Tecnología",
    companyId: "EMP-001",
  },
  {
    id: "CC-FIN-001",
    name: "Finanzas",
    companyId: "EMP-001",
  },
];

export const budgetAccounts = [
  {
    code: "6101",
    name: "Gastos administrativos",
    expenseTypes: ["GASTO_VIAJE", "COMPRA_INSUMO", "REEMBOLSO"],
  },
  {
    code: "6201",
    name: "Viáticos y gastos de viaje",
    expenseTypes: ["GASTO_VIAJE"],
  },
  {
    code: "6301",
    name: "Pago a proveedores",
    expenseTypes: ["PAGO_PROVEEDOR", "SERVICIO"],
  },
  {
    code: "6401",
    name: "Compra de insumos",
    expenseTypes: ["COMPRA_INSUMO"],
  },
  {
    code: "6501",
    name: "Servicios contratados",
    expenseTypes: ["SERVICIO", "PAGO_PROVEEDOR"],
  },
];

export const providers = [
  {
    id: "PROV-001",
    name: "Claro Guatemala",
    nit: "9929292-1",
    category: "Telecomunicaciones",
  },
  {
    id: "PROV-002",
    name: "Tigo Business",
    nit: "7755112-3",
    category: "Telecomunicaciones",
  },
  {
    id: "PROV-003",
    name: "Office Depot Guatemala",
    nit: "5566778-9",
    category: "Insumos de oficina",
  },
  {
    id: "PROV-004",
    name: "Servicios Técnicos Industriales",
    nit: "4433221-7",
    category: "Mantenimiento",
  },
  {
    id: "PROV-005",
    name: "Microsoft Guatemala",
    nit: "9988776-5",
    category: "Software",
  },
];

export const providerPaymentRubrics = [
  {
    id: "RUB-PROV-001",
    name: "Servicio de internet corporativo",
    budgetAccount: "6301 - Pago a proveedores",
    defaultAmount: 1810,
  },
  {
    id: "RUB-PROV-002",
    name: "Mantenimiento preventivo",
    budgetAccount: "6501 - Servicios contratados",
    defaultAmount: 2500,
  },
  {
    id: "RUB-PROV-003",
    name: "Licenciamiento de software",
    budgetAccount: "6501 - Servicios contratados",
    defaultAmount: 3200,
  },
  {
    id: "RUB-PROV-004",
    name: "Servicio de energía eléctrica",
    budgetAccount: "6301 - Pago a proveedores",
    defaultAmount: 4500,
  },
];

export const supplyItems = [
  {
    code: "INS-001",
    name: "Papel bond carta",
    category: "Papelería",
    unit: "Resma",
    defaultAmount: 42,
  },
  {
    code: "INS-002",
    name: "Tóner para impresora",
    category: "Impresión",
    unit: "Unidad",
    defaultAmount: 650,
  },
  {
    code: "INS-003",
    name: "Mouse óptico",
    category: "Equipo menor",
    unit: "Unidad",
    defaultAmount: 85,
  },
  {
    code: "INS-004",
    name: "Teclado USB",
    category: "Equipo menor",
    unit: "Unidad",
    defaultAmount: 125,
  },
  {
    code: "INS-005",
    name: "Cable de red",
    category: "Tecnología",
    unit: "Unidad",
    defaultAmount: 35,
  },
];

export const travelSuggestedItemsByRole = {
  Operador: [
    {
      name: "Alimentación",
      description: "Q 100.00 por día",
      quantity: 1,
      unitAmount: 100,
    },
    {
      name: "Transporte local",
      description: "Q 75.00 por día",
      quantity: 1,
      unitAmount: 75,
    },
  ],
  Jefe: [
    {
      name: "Alimentación",
      description: "Q 125.00 por día",
      quantity: 1,
      unitAmount: 125,
    },
    {
      name: "Alojamiento estándar",
      description: "Q 450.00 por noche",
      quantity: 1,
      unitAmount: 450,
    },
    {
      name: "Transporte local",
      description: "Q 100.00 por día",
      quantity: 1,
      unitAmount: 100,
    },
  ],
  Gerente: [
    {
      name: "Alimentación",
      description: "Q 160.00 por día",
      quantity: 1,
      unitAmount: 160,
    },
    {
      name: "Alojamiento superior",
      description: "Q 650.00 por noche",
      quantity: 1,
      unitAmount: 650,
    },
    {
      name: "Alquiler de vehículo",
      description: "Q 400.00 por día",
      quantity: 1,
      unitAmount: 400,
    },
  ],
  Director: [
    {
      name: "Alimentación",
      description: "Q 220.00 por día",
      quantity: 1,
      unitAmount: 220,
    },
    {
      name: "Alojamiento ejecutivo",
      description: "Q 900.00 por noche",
      quantity: 1,
      unitAmount: 900,
    },
    {
      name: "Transporte ejecutivo",
      description: "Q 550.00 por día",
      quantity: 1,
      unitAmount: 550,
    },
  ],
};