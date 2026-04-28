import { createBrowserRouter } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import { LoginPage } from "./modules/auth/pages/LoginPage";
import { MainLayout } from "./layout/MainLayout";
import { DashboardPage } from "./pages/dashboard/DashboardPage";
import DocumentsPage from "./modules/documents/pages/DocumentsPage";
import DocumentDetailPage from "./modules/documents/pages/DocumentDetailPage";
import { PlanningPage } from "./pages/planning/PlanningPage";
import { WorkflowPage } from "./pages/workflow/WorkflowPage";
import { BudgetControlPage } from "./pages/budget-control/BudgetControlPage";
import { GovernancePage } from "./pages/governance/GovernancePage";
import { UsersAccessPage } from "./pages/users-access/UsersAccessPage";
import { ReportsAnalyticsPage } from "./pages/reports/ReportsAnalyticsPage";
import { ReconciliationPage } from "./pages/reconciliation/ReconciliationPage";

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
                    path: "dashboard",
                    element: <DashboardPage />,
                    },
                    {
                    path: "planificacion-normativa",
                    element: <PlanningPage />,
                    },
                    {
                    path: "trazabilidad-flujos",
                    element: <WorkflowPage />,
                    },
                    {
                    path: "rendicion-conciliacion",
                    element: <ReconciliationPage />,
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
                    path: "documents",
                    element: <DocumentsPage />,
                    },
                    {
                    path: "documents/:id",
                    element: <DocumentDetailPage />,
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
                    path: "usuarios-accesos",
                    element: <UsersAccessPage />,
                    },
                    {
                    path: "reportes-analitica",
                    element: <ReportsAnalyticsPage />,
                    },
        ],
      },
    ],
  },
]);