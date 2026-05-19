import { Navigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

function HostCapabilityRoute({ children }) {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return <p className="p-6 text-center">Loading...</p>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user?.isHost) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default HostCapabilityRoute;
