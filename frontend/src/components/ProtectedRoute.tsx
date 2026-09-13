import { Navigate } from "react-router-dom";
import type { JSX } from "react";
import { useAuth } from "../context/useAuth";

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { token, loading } = useAuth();

  if (loading) {
    return <p className="text-slate-400">Cargando…</p>;
  }
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
