import { createBrowserRouter } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import { LoginPage } from "./modules/auth/pages/LoginPage";
import { MainLayout } from "./layout/MainLayout";
import { DashboardPage } from "./pages/dashboard/DashboardPage";
import DocumentsPage from "./modules/documents/pages/DocumentsPage";
import DocumentDetailPage from "./modules/documents/pages/DocumentDetailPage";
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
            path: "documents",
            element: <DocumentsPage />,
          },
          {
            path: "documents/:id",
            element: <DocumentDetailPage />,
          },
          {
            path: "rendicion-conciliacion",
            element: <ReconciliationPage />,
          },
          {
            path: "rendicion-conciliacion/ocr/documentos",
            element: <DocumentsPage />,
          },
          {
            path: "rendicion-conciliacion/ocr/documentos/:id",
            element: <DocumentDetailPage />,
          },
        ],
      },
    ],
  },
]);