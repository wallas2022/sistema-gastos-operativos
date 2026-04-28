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
        ],
      },
    ],
  },
]);