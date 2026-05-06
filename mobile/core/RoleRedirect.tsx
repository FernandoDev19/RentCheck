import { Navigate } from "react-router";
import { ROLES } from "../shared/types/role.type";

export default function RoleRedirect() {
  const role = (() => {
    try {
      const raw = localStorage.getItem("user");
      if (!raw) return "";
      const parsed = JSON.parse(raw);
      return typeof parsed?.role === "string" ? parsed.role : "";
    } catch {
      return "";
    }
  })();

  if (role === ROLES.ADMIN) return <Navigate to="/adm/dashboard" replace />;
  if (role === ROLES.OWNER) return <Navigate to="/owner/dashboard" replace />;
  if (role === ROLES.MANAGER) return <Navigate to="/manager/dashboard" replace />;
  if (role === ROLES.EMPLOYEE) return <Navigate to="/employee/dashboard" replace />;

  return <Navigate to="/unauthorized" replace />;
}
