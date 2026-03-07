import { Navigate } from "react-router";
import { authService } from "../services/auth.service";
import { useEffect, useState } from "react";
import type { RolesType } from "./types/roles.type";

type Props = {
  allowedRoles: RolesType[];
  children: React.ReactNode;
};

export default function ProtectedRoute({ allowedRoles, children }: Props) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    authService.isAuthenticated().then(setIsAuthenticated);
  }, []);

  if (isAuthenticated === null) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const userRole = (() => {
    try {
      const raw = localStorage.getItem("user");
      if (!raw) return "";
      const parsed = JSON.parse(raw);
      return typeof parsed?.role === "string" ? parsed.role : "";
    } catch {
      return "";
    }
  })();

  if (
    userRole === "" ||
    !allowedRoles.includes(
      userRole
    )
  ) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
