import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { useEffect } from "react";
import Login from "./pages/auth/Login";
import ProtectedRoute from "./core/ProtectedRoute";
import Unauthorized401 from "./pages/errors/Unauthorized401";
import RoleRedirect from "./core/RoleRedirect";
import VerifyBiometry from "./pages/verify-biometry/VerifyBiometry";
import Loader from "./shared/components/GlobalLoader";
import { useLoading } from "./core/context/loading-context/hooks/useLoading";
import { setupLoadingInterceptor } from "./core/api/api";
import { ROLES } from "./shared/types/role.type";

// Modular Routes
import AdminRoutes from "./core/routes/AdminRoutes";
import OwnerRoutes from "./core/routes/OwnerRoutes";
import ManagerRoutes from "./core/routes/ManagerRoutes";
import EmployeeRoutes from "./core/routes/EmployeeRoutes";

function App() {
  const { setLoading } = useLoading();
  useEffect(() => setupLoadingInterceptor(setLoading), [setLoading]);

  return (
    <div className="min-h-screen">
      <Loader />
      <BrowserRouter>
        <Routes>
          {/* Public and Common Routes */}
          <Route path="/verify/:token" element={<VerifyBiometry />} />
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized401 />} />

          <Route
            path="/"
            element={
              <ProtectedRoute
                allowedRoles={[
                  ROLES.ADMIN,
                  ROLES.OWNER,
                  ROLES.MANAGER,
                  ROLES.EMPLOYEE,
                ]}
              >
                <RoleRedirect />
              </ProtectedRoute>
            }
          />

          {/* Routes */}
          <Route path="/adm/*" element={<AdminRoutes />} />
          <Route path="/owner/*" element={<OwnerRoutes />} />
          <Route path="/manager/*" element={<ManagerRoutes />} />
          <Route path="/employee/*" element={<EmployeeRoutes />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
