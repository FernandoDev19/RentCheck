import { ROLES, type RolesType } from "../../common/types/roles.type";
import { getUser } from "./helpers/user.helper";
import EmployeeDashboard from "./components/employee-dashboard/EmployeeDashboard";
import ManagementDashboard from "./components/ManagementDashboard";
import AdminDashboard from "./components/AdminDashboard";

export default function Dashboard() {
  const user = getUser();
  const role = user.role as RolesType;

  return (
    <div style={{ position: "relative" }}>
      {role === ROLES.EMPLOYEE && <EmployeeDashboard />}
      {(role === ROLES.OWNER || role === ROLES.MANAGER) && (
        <ManagementDashboard role={role} />
      )}
      {role === ROLES.ADMIN && <AdminDashboard />}
    </div>
  );
}
