import { Navigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

function RoleRoute({ allowedRoles, children }) {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return <p className="p-6 text-center">Loading...</p>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default RoleRoute;
