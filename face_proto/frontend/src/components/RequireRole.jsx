import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function RequireRole({ role, redirectTo }) {
  const { user } = useAuth();

  if (!user) return null; // RequireAuth handles the redirect above this
  if (user.role !== role) return <Navigate to={redirectTo || "/"} replace />;

  return <Outlet />;
}
