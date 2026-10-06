import { createBrowserRouter } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import { LoginPage } from "./modules/auth/pages/LoginPage";
import { MainLayout } from "./layout/MainLayout";

import { ExecutiveDashboardPage } from "./pages/dashboard/ExecutiveDashboardPage";
import { PlanningPage } from "./pages/planning/PlanningPage";
import { WorkflowPage } from "./pages/workflow/WorkflowPage";
import { ReconciliationPage } from "./pages/reconciliation/ReconciliationPage";
import { BudgetControlPage } from "./pages/budget-control/BudgetControlPage";
import { GovernancePage } from "./pages/governance/GovernancePage";
import { UsersAccessPage } from "./pages/users-access/UsersAccessPage";
import { BudgetReportPage } from "./pages/reports/BudgetReportPage";
import { RequestsReportPage } from "./pages/reports/RequestsReportPage";
import { ApprovalsReportPage } from "./pages/reports/ApprovalsReportPage";
import { PoliciesReportPage } from "./pages/reports/PoliciesReportPage";
import { ExecutiveReportPage } from "./pages/reports/ExecutiveReportPage";
import { RoleProtectedRoute } from "./shared/services/RoleProtectedRoute";
import  DocumentsPage  from "./modules/documents/pages/DocumentsPage";
import DocumentDetailPage from "./modules/documents/pages/DocumentDetailPage";
import { LiquidationsPage } from "./pages/reconciliation/LiquidationsPage";
import { NewLiquidationPage } from "./pages/reconciliation/NewLiquidationPage";
import { LiquidationDetailPage } from "./pages/reconciliation/LiquidationDetailPage";
import  NewExpenseRequestPage from "./pages/expense-requests/NewExpenseRequestPage";
import  ExpenseRequestDetailPage  from "./pages/expense-requests/ExpenseRequestDetailPage";
import { FlowMonitorPage } from "./pages/flow-monitor/FlowMonitorPage";
import { AuditEventsPage } from "./pages/audit-events/AuditEventsPage";
import { NotFoundPage } from "./pages/error/NotFoundPage";
import { ModulePlaceholderPage } from "./common/ModulePlaceholderPage";
import { ApprovalsPage } from "./pages/approvals/ApprovalsPage";
import { NotificationsPage } from "./pages/approvals/notifications/NotificationsPage";
import { NotificationDetailPage } from "./pages/approvals/notifications/NotificationDetailPage";
import ExpenseRequestsPage from "./pages/expense-requests/ExpenseRequestsPage";
import SystemMapPage from "./pages/system-map/SystemMapPage";
import AccessMatrixPage from "./pages/security/AccessMatrixPage";
import UsersPage from "./pages/security/UsersPage";
import RolesPage from "./pages/security/RolesPage";
import PermissionsPage from "./pages/security/PermissionsPage";
import { StatusMonitorPage } from "./pages/traceability/StatusMonitorPage";
import { SlaEscalationsPage } from "./pages/traceability/SlaEscalationsPage";
import { EventLogsPage } from "./pages/traceability/EventLogsPage";
import { PoliciesRulesPage } from "./pages/planning/PoliciesRulesPage";
import { BudgetIntegrationPage } from "./pages/budget-integration/BudgetIntegrationPage";
import { CurrenciesExchangeRatesPage } from "./pages/planning/CurrenciesExchangeRatesPage";
import { OcrAnalyticsPage, OcrReportPage } from "./pages/ocr/OcrAnalyticsPage";
import { FiscalCompaniesPage } from "./pages/governance/FiscalCompaniesPage";
import { MyBankAccountsPage } from "./pages/banking/MyBankAccountsPage";
import { TreasuryDisbursementsPage } from "./pages/treasury/TreasuryDisbursementsPage";
import { TreasuryRefundsPage } from "./pages/treasury/TreasuryRefundsPage";
import { BanksCatalogPage } from "./pages/banking/BanksCatalogPage";
import { ForgotPasswordPage } from './pages/security/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/security/ResetPasswordPage';
import { ChangePasswordPage } from './pages/security/ChangePasswordPage';
import { FunctionalTestsPage } from './pages/functional-tests/FunctionalTestsPage';


export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  { path: '/olvide-contrasena', element: <ForgotPasswordPage /> },
  { path: '/restablecer-contrasena', element: <ResetPasswordPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/",
        element: <MainLayout />,
        children: [
          {
            index: true,
            element: <ExecutiveDashboardPage />,
          },
          { path: 'mi-perfil/seguridad', element: <ChangePasswordPage /> },
          { path: 'pruebas-funcionales', element: <FunctionalTestsPage /> },
           {
          path: "security/access-matrix",
          element: <AccessMatrixPage />,
          },
          {
            path: "security/users",
            element: <UsersPage />,
          },
          {
            path: "security/roles",
            element: <RolesPage />,
          },
          {
            path: "security/permissions",
            element: <PermissionsPage />,
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
            path: "/politicas-reglas",
            element: <PoliciesRulesPage />,
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
            path: "/trazabilidad-flujos/monitor-estados",
            element: <StatusMonitorPage />,
            },                           
          {
            path: "trazabilidad-flujos/escalamientos-sla",
            element: <SlaEscalationsPage />,
          },

          {
            path: "trazabilidad-flujos/bitacora-eventos",
            element: <EventLogsPage />,
            },
          {
            path: "rendicion-conciliacion",
            element: <ReconciliationPage />,
          },
          {
            path: "rendicion-conciliacion/liquidaciones",
            element: <LiquidationsPage />,
          },
          { path: "mis-cuentas-bancarias", element: <MyBankAccountsPage /> },
          { path: "configuracion/bancos", element: <RoleProtectedRoute roles={["ADMIN"]}><BanksCatalogPage /></RoleProtectedRoute> },
          { path: "tesoreria/desembolsos", element: <RoleProtectedRoute roles={["ADMIN", "FINANZAS", "TESORERIA"]}><TreasuryDisbursementsPage /></RoleProtectedRoute> },
          { path: "tesoreria/devoluciones", element: <RoleProtectedRoute roles={["ADMIN", "FINANZAS", "TESORERIA"]}><TreasuryRefundsPage /></RoleProtectedRoute> },
            {
              path: "rendicion-conciliacion/liquidaciones/nueva",
              element: <NewLiquidationPage />,
              },
              {
              path: "notificaciones",
              element: <NotificationsPage />,
            },
            {
              path: "mapa-sitio",
              element: <SystemMapPage />,
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
          { path: "rendicion-conciliacion/ocr/dashboard", element: <OcrAnalyticsPage /> },
          { path: "rendicion-conciliacion/ocr/reportes", element: <OcrReportPage /> },
          { path: "configuracion/empresas-fiscales", element: <FiscalCompaniesPage /> },
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
            path: "integracion-presupuestaria",
            element: <BudgetIntegrationPage />,
          },
          {
            path: "configuracion/monedas-tasas",
            element: <RoleProtectedRoute roles={["ADMIN", "FINANZAS"]}><CurrenciesExchangeRatesPage /></RoleProtectedRoute>,
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
            element: <RoleProtectedRoute roles={["ADMIN", "FINANZAS", "GERENTE"]}><ExecutiveReportPage /></RoleProtectedRoute>,
          },
          {
            path: "reportes/presupuesto",
            element: <RoleProtectedRoute roles={["ADMIN", "FINANZAS", "GERENTE"]}><BudgetReportPage /></RoleProtectedRoute>,
          },
          {
            path: "reportes/solicitudes",
            element: <RoleProtectedRoute roles={["ADMIN", "FINANZAS", "GERENTE"]}><RequestsReportPage /></RoleProtectedRoute>,
          },
          {
            path: "reportes/aprobaciones",
            element: <RoleProtectedRoute roles={["ADMIN", "FINANZAS", "GERENTE"]}><ApprovalsReportPage /></RoleProtectedRoute>,
          },
          {
            path: "reportes/politicas",
            element: <RoleProtectedRoute roles={["ADMIN", "FINANZAS", "GERENTE"]}><PoliciesReportPage /></RoleProtectedRoute>,
          },
          {
            path: "reportes/ejecutivo",
            element: <RoleProtectedRoute roles={["ADMIN", "FINANZAS", "GERENTE"]}><ExecutiveReportPage /></RoleProtectedRoute>,
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
  path: "notificaciones/:id",
  element: <NotificationDetailPage />,
},       


],
      },
    ],
  },
]);
