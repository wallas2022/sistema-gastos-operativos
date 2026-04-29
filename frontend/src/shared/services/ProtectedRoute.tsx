import { Navigate, Outlet } from "react-router-dom";

export function ProtectedRoute() {
  const token = localStorage.getItem("access_token");
  console.log("TOKEN ENVIADO AL BACKEND protected:", token);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}