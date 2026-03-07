import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import Login from "./pages/auth/Login";
import ProtectedRoute from "./common/ProtectedRoute";
import Dashboard from "./pages/dashboard/Dashboard";
import Header from "./common/layouts/header/Header";
import { ROLES } from "./common/types/roles.type";
import Renters from "./pages/renters/Renters";
import Unauthorized401 from "./pages/errors/Unauthorized401";
import Branches from "./pages/branches/Branches";
import RoleRedirect from "./common/RoleRedirect";
import Employees from "./pages/employees/Employees";
import Rentals from "./pages/rentals/Rentals";
import VerifyBiometry from "./pages/verify-biometry/VerifyBiometry";
import Customers from "./pages/customers/Customers";
import PendingFeedbacks from "./pages/pending-feedbacks/PendingFeedbacks";

function App() {
  return (
    <div className="min-h-screen">
      <BrowserRouter>
        <Routes>
          <Route path="/verify/:token" element={<VerifyBiometry />} />
          <Route path="/login" element={<Login />}></Route>
          <Route path="/unauthorized" element={<Unauthorized401 />}></Route>

          <Route
            path="/"
            element={
              <ProtectedRoute
                allowedRoles={[ROLES.ADMIN, ROLES.OWNER, ROLES.MANAGER, ROLES.EMPLOYEE]}
              >
                <RoleRedirect />
              </ProtectedRoute>
            }
          />

          <Route
            path="/adm/*"
            element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                <Header />
                <main className="p-4">
                  <Routes>
                    <Route
                      path="/"
                      element={<Navigate to="/adm/dashboard" replace />}
                    />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/renters" element={<Renters />} />
                  </Routes>
                </main>
              </ProtectedRoute>
            }
          />

          <Route
            path="/owner/*"
            element={
              <ProtectedRoute allowedRoles={[ROLES.OWNER]}>
                <Header />
                <main className="p-4">
                  <Routes>
                    <Route
                      path="/"
                      element={<Navigate to="/owner/dashboard" replace />}
                    />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/branches" element={<Branches />} />
                    <Route path="/rentals" element={<Rentals />} />
                    <Route path="/feedbacks" element={<PendingFeedbacks />} />
                    <Route path="/employees" element={<Employees />} />
                    <Route path="/customers" element={<Customers />} />
                    <Route path="/*" element={ <Navigate to="/owner/dashboard" /> } />
                  </Routes>
                </main>
              </ProtectedRoute>
            }
          />

          <Route
            path="/manager/*"
            element={
              <ProtectedRoute allowedRoles={[ROLES.MANAGER]}>
                <Header />
                <main className="p-4">
                  <Routes>
                    <Route
                      path="/"
                      element={<Navigate to="/manager/dashboard" replace />}
                    />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/employees" element={<Employees />} />
                    <Route path="/rentals" element={<Rentals />} />
                    <Route path="/feedbacks" element={<PendingFeedbacks />} />
                    <Route path="/customers" element={<Customers />} />
                    <Route path="/*" element={ <Navigate to="/manager/dashboard" /> } />
                  </Routes>
                </main>
              </ProtectedRoute>
            }
          />

          <Route
            path="/employee/*"
            element={
              <ProtectedRoute allowedRoles={[ROLES.EMPLOYEE]}>
                <Header />
                <main className="p-4">
                  <Routes>
                    <Route
                      path="/"
                      element={<Navigate to="/employee/dashboard" replace />}
                    />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/rentals" element={<Rentals />} />
                    <Route path="/feedbacks" element={<PendingFeedbacks />} />
                    <Route path="/customers" element={<Customers />} />
                    <Route path="/*" element={ <Navigate to="/employee/dashboard" /> } />
                  </Routes>
                </main>
              </ProtectedRoute>
            }
          />

          {/* <Route
            path="/renter/*"
            element={
              <ProtectedRoute
                allowedRoles={[ROLES.OWNER]}
              >
                <Header />
                <main className="p-4">
                  <Routes>
                    <Route
                      path="/"
                      element={<Navigate to="/renter/branches" replace />}
                    />
                    <Route path="/branches" element={<Branches />} />
                  </Routes>
                </main>
              </ProtectedRoute>
            }
          ></Route> */}

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
