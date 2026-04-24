import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./modules/auth/pages/LoginPage";
import ProtectedRoute from "./shared/services/ProtectedRoute";
import DocumentsPage from "./modules/documents/pages/DocumentsPage";
import DocumentDetailPage from "./modules/documents/pages/DocumentDetailPage";



export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/documents/:id" element={<DocumentDetailPage />} />
      </Route>
    </Routes>
  );
}