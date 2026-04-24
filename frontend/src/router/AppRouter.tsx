import { Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from '../modules/auth/pages/LoginPage'
import DocumentsPage from '../modules/documents/pages/DocumentsPage'
import DocumentDetailPage from '../modules/documents/pages/DocumentDetailPage'

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/documents" element={<DocumentsPage />} />
      <Route path="/documents/:id" element={<DocumentDetailPage />} />
    </Routes>
  )
}
