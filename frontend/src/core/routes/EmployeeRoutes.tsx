import { Navigate, Route, Routes } from "react-router";
import ProtectedRoute from "../ProtectedRoute";
import Header from "../layouts/header/Header";
import { ROLES } from "../../shared/types/role.type";
import Dashboard from "../../pages/dashboard/Dashboard";
import Rentals from "../../pages/rentals/Rentals";
import PendingFeedbacks from "../../pages/pending-feedbacks/PendingFeedbacks";
import Customers from "../../pages/customers/Customers";
import Vehicles from "../../pages/vehicles/Vehicles";
import Settings from "../../pages/settings/Settings";

export default function EmployeeRoutes() {
  return (
    <ProtectedRoute allowedRoles={[ROLES.EMPLOYEE]}>
      <Header />
      <main className="p-4">
        <Routes>
          <Route path="/" element={<Navigate to="/employee/dashboard" replace />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/rentals" element={<Rentals />} />
          <Route path="/feedbacks" element={<PendingFeedbacks />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/vehicles" element={<Vehicles />} />
          <Route path="/*" element={<Navigate to="/employee/dashboard" />} />
        </Routes>
      </main>
    </ProtectedRoute>
  );
}
