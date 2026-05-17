import { Navigate, Route, Routes } from "react-router";
import ProtectedRoute from "../ProtectedRoute";
import Header from "../layouts/header/Header";
import { ROLES } from "../../shared/types/role.type";
import Dashboard from "../../pages/dashboard/Dashboard";
import Branches from "../../pages/branches/Branches";
import Customers from "../../pages/customers/Customers";
import Employees from "../../pages/employees/Employees";
import Vehicles from "../../pages/vehicles/Vehicles";
import Renters from "../../pages/renters/Renters";
import Rentals from "../../pages/rentals/Rentals";
import PendingFeedbacks from "../../pages/pending-feedbacks/PendingFeedbacks";
import Users from "../../pages/users/Users";
import Plans from "../../pages/plans/Plans";

export default function AdminRoutes() {
  return (
    <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
      <Header />
      <main className="p-4">
        <Routes>
          <Route path="/" element={<Navigate to="/adm/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/branches" element={<Branches />} />
          <Route path="/branches/:renterId" element={<Branches />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/employees" element={<Employees />} />
          <Route path="/vehicles" element={<Vehicles />} />
          <Route path="/renters" element={<Renters />} />
          <Route path="/rentals" element={<Rentals />} />
          <Route path="/feedbacks" element={<PendingFeedbacks />} />
          <Route path="/users" element={<Users />} />
          <Route path="/plans" element={<Plans />} />
          <Route path="/*" element={<Navigate to="/adm/dashboard" />} />
        </Routes>
      </main>
    </ProtectedRoute>
  );
}
