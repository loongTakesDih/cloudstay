import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import HostCapabilityRoute from "./components/HostCapabilityRoute";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Explore from "./pages/properties/Explore";
import HostingDashboard from "./pages/hosting/HostingDashboard";
import NewListing from "./pages/hosting/NewListing";
import PerformancePage from "./pages/hosting/PerformancePage";
import ProfilePage from "./pages/user/ProfilePage";
import MyTripsPage from "./pages/user/MyTripsPage";
import SavedPlacesPage from "./pages/user/SavedPlacesPage";
import NotificationsPage from "./pages/user/NotificationsPage";
import PropertyDetails from "./pages/properties/PropertyDetails";
import BookingDetails from "./pages/trips/BookingDetails";
import HostOnboarding from "./pages/host/HostOnboarding";
import BookingRequestDetails from "./pages/hosting/BookingRequestDetails";
import MessagesPage from "./pages/chat/MessagesPage";
import MessageNotifications from "./components/MessageNotifications";
import RealtimeUpdates from "./components/RealtimeUpdates";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <MessageNotifications />
        <RealtimeUpdates />
        <Routes>
          <Route path="/" element={<Explore />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/explore" element={<Explore />} />

          <Route path="/dashboard" element={<Navigate to="/" replace />} />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/:section"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/my-trips"
            element={
              <ProtectedRoute>
                <MyTripsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/saved-places"
            element={
              <ProtectedRoute>
                <SavedPlacesPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <NotificationsPage />
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
            path="/messages"
            element={
              <ProtectedRoute>
                <MessagesPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/messages/:conversationId"
            element={
              <ProtectedRoute>
                <MessagesPage />
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
                <Navigate to="/hosting/dashboard?tab=bookings" replace />
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
                <Navigate to="/hosting/dashboard?tab=listings" replace />
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
