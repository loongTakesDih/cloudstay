import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import HostCapabilityRoute from "./components/HostCapabilityRoute";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleRoute from "./components/RoleRoute";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./context/useAuth";
import AdminDashboard from "./pages/admin/AdminDashboard";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import HostingDashboard from "./pages/hosting/HostingDashboard";
import NewListing from "./pages/hosting/NewListing";
import ViewListing from "./pages/hosting/ViewListing";
import UserDashboard from "./pages/user/UserDashboard";

function HomeRedirect() {
  const { getRedirectPath, loading, user } = useAuth();

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fffaf7] px-4 text-slate-700">
        Loading CloudStay...
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={getRedirectPath(user)} replace />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <UserDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hosting/listings/new"
            element={
              <HostCapabilityRoute>
                <NewListing />
              </HostCapabilityRoute>
            }
          />
          <Route
            path="/hosting/listings"
            element={
              <HostCapabilityRoute>
                <ViewListing />
              </HostCapabilityRoute>
            }
          />
          <Route
            path="/hosting/dashboard"
            element={
              <HostCapabilityRoute>
                <HostingDashboard />
              </HostCapabilityRoute>
            }
          />

          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={["Admin"]}>
                  <AdminDashboard />
                </RoleRoute>
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
