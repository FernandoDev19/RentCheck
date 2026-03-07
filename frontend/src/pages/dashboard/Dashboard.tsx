import { useNavigate } from "react-router";
import { authService } from "../../services/auth.service";
import { ROLES, type RolesType } from "../../common/types/roles.type";
import { getUser } from "./helpers/user.helper";
import EmployeeDashboard from "./components/EmployeeDashboard";
import ManagementDashboard from "./components/ManagementDashboard";
import AdminDashboard from "./components/AdminDashboard";

export default function Dashboard() {
  const navigate = useNavigate();
  const user = getUser();
  const role = user.role as RolesType;

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
  };

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={handleLogout}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 50,
          padding: "8px 18px",
          borderRadius: 9999,
          background: "#fff",
          border: "1px solid #e2e8f0",
          color: "#64748b",
          fontSize: 13,
          fontWeight: 500,
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          cursor: "pointer",
          transition: "all 0.15s ease",
          fontFamily: "'DM Sans', sans-serif",
        }}
        onMouseEnter={(e) => {
          (e.target as HTMLElement).style.background = "#fef2f2";
          (e.target as HTMLElement).style.color = "#dc2626";
          (e.target as HTMLElement).style.borderColor = "#fecaca";
        }}
        onMouseLeave={(e) => {
          (e.target as HTMLElement).style.background = "#fff";
          (e.target as HTMLElement).style.color = "#64748b";
          (e.target as HTMLElement).style.borderColor = "#e2e8f0";
        }}
      >
        Cerrar sesión
      </button>

      {role === ROLES.EMPLOYEE && <EmployeeDashboard />}
      {(role === ROLES.OWNER || role === ROLES.MANAGER) && (
        <ManagementDashboard role={role} />
      )}
      {role === ROLES.ADMIN && <AdminDashboard />}
    </div>
  );
}
