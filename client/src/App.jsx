import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import HostCapabilityRoute from "./components/HostCapabilityRoute";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./context/useAuth";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Explore from "./pages/properties/Explore";
import HostingDashboard from "./pages/hosting/HostingDashboard";
import BookingHistoryPage from "./pages/hosting/BookingHistoryPage";
import NewListing from "./pages/hosting/NewListing";
import PerformancePage from "./pages/hosting/PerformancePage";
import ViewListing from "./pages/hosting/ViewListing";
import ProfilePage from "./pages/user/ProfilePage";
import PropertyDetails from "./pages/properties/PropertyDetails";
import UserDashboard from "./pages/user/UserDashboard";
import BookingDetails from "./pages/trips/BookingDetails";
import HostOnboarding from "./pages/host/HostOnboarding";
import BookingRequestDetails from "./pages/hosting/BookingRequestDetails";

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
          <Route path="/explore" element={<Explore />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <UserDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/become-host"
            element={
              <ProtectedRoute>
                <HostOnboarding />
              </ProtectedRoute>
            }
          />

          <Route
            path="/properties/:id"
            element={<PropertyDetails />}
          />

          <Route
            path="/trips/:bookingId"
            element={
              <ProtectedRoute>
                <BookingDetails />
              </ProtectedRoute>
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
            path="/hosting/history"
            element={
              <HostCapabilityRoute>
                <BookingHistoryPage />
              </HostCapabilityRoute>
            }
          />

          <Route
            path="/hosting/performance"
            element={
              <HostCapabilityRoute>
                <PerformancePage />
              </HostCapabilityRoute>
            }
          />

          <Route
            path="/hosting/requests/:id"
            element={
              <HostCapabilityRoute>
                <BookingRequestDetails />
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
            path="/hosting/listings/new"
            element={
              <HostCapabilityRoute>
                <NewListing />
              </HostCapabilityRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
