import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { email, loading } = useAuth();

  if (loading) return <p className="admin-loading">Loading…</p>;
  if (!email) return <Navigate to="/admin/login" replace />;

  return <>{children}</>;
}
