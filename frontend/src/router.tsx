import { createBrowserRouter } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import { LoginPage } from "./modules/auth/pages/LoginPage";
import { MainLayout } from "./layout/MainLayout";

import { DashboardPage } from "./pages/dashboard/DashboardPage";
import { PlanningPage } from "./pages/planning/PlanningPage";
import { WorkflowPage } from "./pages/workflow/WorkflowPage";
import { ReconciliationPage } from "./pages/reconciliation/ReconciliationPage";
import { BudgetControlPage } from "./pages/budget-control/BudgetControlPage";
import { GovernancePage } from "./pages/governance/GovernancePage";
import { UsersAccessPage } from "./pages/users-access/UsersAccessPage";
import { ReportsAnalyticsPage } from "./pages/reports/ReportsAnalyticsPage";
import  DocumentsPage  from "./modules/documents/pages/DocumentsPage";
import DocumentDetailPage from "./modules/documents/pages/DocumentDetailPage";
import { LiquidationsPage } from "./pages/reconciliation/LiquidationsPage";
import { NewLiquidationPage } from "./pages/reconciliation/NewLiquidationPage";
import { LiquidationDetailPage } from "./pages/reconciliation/LiquidationDetailPage";
import { ExpenseRequestsPage } from "./pages/expense-requests/ExpenseRequestsPage";
import { NewExpenseRequestPage } from "./pages/expense-requests/NewExpenseRequestPage";
import { ExpenseRequestDetailPage } from "./pages/expense-requests/ExpenseRequestDetailPage";
import { AuthorizationsCenterPage } from "./pages/authorizations/AuthorizationsCenterPage";
import { FlowMonitorPage } from "./pages/flow-monitor/FlowMonitorPage";
import { AuditEventsPage } from "./pages/audit-events/AuditEventsPage";
import { NotFoundPage } from "./pages/error/NotFoundPage";
import { ModulePlaceholderPage } from "./common/ModulePlaceholderPage";
import { ApprovalsPage } from "./pages/approvals/ApprovalsPage";
import { NotificationsPage } from "./pages/approvals/notifications/NotificationsPage";
import { NotificationDetailPage } from "./pages/approvals/notifications/NotificationDetailPage";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/",
        element: <MainLayout />,
        children: [
          {
            index: true,
            element: <DashboardPage />,
          },
          {
            path: "planificacion-normativa",
            element: <PlanningPage />,
          },
          {
            path: "solicitudes-gastos",
            element: <ExpenseRequestsPage />,
            },
            {
            path: "solicitudes-gastos/nueva",
            element: <NewExpenseRequestPage />,
            },
            {
            path: "solicitudes-gastos/:id",
            element: <ExpenseRequestDetailPage />,
            },

           {
            path: "autorizaciones",
            element: <AuthorizationsCenterPage />,
            }, 

            {
              path: "autorizaciones",
              element: <ApprovalsPage />,
            },

            {
            path: "trazabilidad-flujos/autorizaciones",
            element: <ApprovalsPage />,
          },
         {
            path: "monitor-estados",
            element: <FlowMonitorPage />,
            },                           
          {
            path: "trazabilidad-flujos",
            element: <WorkflowPage />,
          },

          {
            path: "bitacora-eventos",
            element: <AuditEventsPage />,
            },
          {
            path: "rendicion-conciliacion",
            element: <ReconciliationPage />,
          },
          {
            path: "rendicion-conciliacion/liquidaciones",
            element: <LiquidationsPage />,
            },
            {
              path: "rendicion-conciliacion/liquidaciones/nueva",
              element: <NewLiquidationPage />,
              },
              {
              path: "notificaciones",
              element: <NotificationsPage />,
            },
{
  path: "simulador-gastos",
  element: (
    <ModulePlaceholderPage
      title="Simulador de gastos"
      moduleName="MPN"
      description="Pantalla destinada a calcular de forma anticipada el costo estimado de una solicitud de gasto según tipo de gasto, duración, rol, destino, política vigente y presupuesto disponible."
    />
  ),
},
{
  path: "politicas-reglas",
  element: (
    <ModulePlaceholderPage
      title="Políticas y reglas"
      moduleName="MPN"
      description="Visualizador de normativas vigentes, límites permitidos, reglas por empresa, área, centro de costo, tipo de gasto y jerarquía del solicitante."
    />
  ),
},
{
  path: "verificador-presupuestario",
  element: (
    <ModulePlaceholderPage
      title="Verificador presupuestario"
      moduleName="MPN"
      description="Pantalla para validar disponibilidad presupuestaria antes de crear, aprobar o ejecutar una solicitud de gasto."
    />
  ),
},
{
  path: "escalamientos-sla",
  element: (
    <ModulePlaceholderPage
      title="Escalamientos SLA"
      moduleName="MOTF"
      description="Gestión de solicitudes atrasadas, tiempos máximos de aprobación, responsables actuales y reglas de reasignación automática o manual."
    />
  ),
},
{
  path: "rendicion-conciliacion/anticipos",
  element: (
    <ModulePlaceholderPage
      title="Conciliación de anticipos"
      moduleName="MRCF"
      description="Pantalla para calcular diferencias entre anticipos entregados y gastos ejecutados, determinando saldo a favor, reintegro o cierre equilibrado."
    />
  ),
},
{
  path: "rendicion-conciliacion/cierres-certificados",
  element: (
    <ModulePlaceholderPage
      title="Cierres certificados"
      moduleName="MRCF"
      description="Generación y consulta de expedientes digitales certificados para auditoría, incluyendo documentos OCR, liquidaciones, aprobaciones y evidencia de cierre."
    />
  ),
},
{
  path: "ejecucion-presupuestaria",
  element: (
    <ModulePlaceholderPage
      title="Ejecución presupuestaria"
      moduleName="MCPIN"
      description="Dashboard para consultar el presupuesto ejecutado por empresa, área, centro de costo, cuenta contable, período y tipo de gasto."
    />
  ),
},
{
  path: "actual-vs-proyectado",
  element: (
    <ModulePlaceholderPage
      title="Actual vs proyectado"
      moduleName="MCPIN"
      description="Vista comparativa entre presupuesto proyectado, presupuesto ejecutado, saldo disponible y desviaciones por período."
    />
  ),
},
{
  path: "interoperabilidad-api",
  element: (
    <ModulePlaceholderPage
      title="Interoperabilidad API"
      moduleName="MCPIN"
      description="Panel de control para monitorear integraciones con sistemas externos de pagos, proveedores, presupuesto y herramientas financieras."
    />
  ),
},
{
  path: "proyeccion-desvios",
  element: (
    <ModulePlaceholderPage
      title="Proyección de desvíos"
      moduleName="MCPIN"
      description="Pantalla orientada a detectar posibles desviaciones presupuestarias según el ritmo de ejecución del gasto."
    />
  ),
},
{
  path: "empresas-unidades",
  element: (
    <ModulePlaceholderPage
      title="Empresas y unidades"
      moduleName="MGCE"
      description="Administración de empresas, unidades de negocio, áreas organizacionales y estructuras asociadas al control presupuestario."
    />
  ),
},
{
  path: "centros-costo",
  element: (
    <ModulePlaceholderPage
      title="Centros de costo"
      moduleName="MGCE"
      description="Configuración de centros de costo y su relación con presupuestos, departamentos, unidades de negocio y responsables."
    />
  ),
},
{
  path: "matriz-roles",
  element: (
    <ModulePlaceholderPage
      title="Matriz de roles"
      moduleName="MGCE"
      description="Definición de atribuciones, niveles de autorización, permisos por rol y reglas de acceso funcional."
    />
  ),
},
{
  path: "auditoria-sistema",
  element: (
    <ModulePlaceholderPage
      title="Auditoría del sistema"
      moduleName="MGCE"
      description="Consulta de modificaciones realizadas sobre parámetros críticos, reglas, usuarios, estructuras y configuraciones del sistema."
    />
  ),
},
{
  path: "roles-permisos",
  element: (
    <ModulePlaceholderPage
      title="Roles y permisos"
      moduleName="Seguridad"
      description="Administración de roles, permisos funcionales, accesos por módulo y restricciones por área o unidad de negocio."
    />
  ),
},
{
  path: "delegaciones-temporales",
  element: (
    <ModulePlaceholderPage
      title="Delegaciones temporales"
      moduleName="Seguridad"
      description="Configuración de delegaciones de aprobación o revisión durante ausencias, vacaciones o asignaciones temporales."
    />
  ),
},
{
  path: "bitacora-accesos",
  element: (
    <ModulePlaceholderPage
      title="Bitácora de accesos"
      moduleName="Seguridad"
      description="Registro de inicios de sesión, accesos al sistema, intentos fallidos y actividad general por usuario."
    />
  ),
      },
      {
        path: "kpis-ejecutivos",
        element: (
          <ModulePlaceholderPage
            title="KPIs ejecutivos"
            moduleName="Reportes"
            description="Indicadores clave sobre gastos, aprobaciones, liquidaciones, ejecución presupuestaria, tiempos promedio y cumplimiento de políticas."
          />
        ),
      },
      {
        path: "reportes-auditoria",
        element: (
          <ModulePlaceholderPage
            title="Reportes de auditoría"
            moduleName="Reportes"
            description="Reportes preparados para auditoría interna y externa, con trazabilidad de aprobaciones, documentos, cambios y cierres financieros."
          />
        ),
      },
      {
        path: "exportaciones",
        element: (
          <ModulePlaceholderPage
            title="Exportaciones"
            moduleName="Reportes"
            description="Exportación de información a Excel, PDF u otros formatos para análisis financiero, auditoría y control corporativo."
          />
        ),
      },
                {


            path: "rendicion-conciliacion/liquidaciones/:id",
            element: <LiquidationDetailPage />,
            },
                        {
            path: "rendicion-conciliacion/ocr/documentos",
            element: <DocumentsPage />,
          },
          {
            path: "rendicion-conciliacion/ocr/documentos/:id",
            element: <DocumentDetailPage />,
          },
          {
            path: "documents",
            element: <DocumentsPage />,
          },
          {
            path: "documents/:id",
            element: <DocumentDetailPage />,
          },
          {
            path: "control-presupuestario",
            element: <BudgetControlPage />,
          },
          {
            path: "gobernanza-configuracion",
            element: <GovernancePage />,
          },
          {
            path: "usuarios-accesos",
            element: <UsersAccessPage />,
          },
          {
            path: "reportes-analitica",
            element: <ReportsAnalyticsPage />,
          },
          {
            path: "*",
            element: <NotFoundPage />,
            },

                  {
          path: "planificacion-normativa",
          element: <PlanningPage />,
        }, 
      {
  path: "notificaciones",
  element: <NotificationsPage />,
},
{
  path: "notificaciones/:id",
  element: <NotificationDetailPage />,
},        ],
      },
    ],
  },
]);