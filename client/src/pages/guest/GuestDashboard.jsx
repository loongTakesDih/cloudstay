import { useAuth } from "../../context/useAuth";

function GuestDashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Guest Dashboard</h1>
      <p className="mt-2 text-gray-600">Welcome, {user?.username}</p>
      <p className="text-gray-600">Role: {user?.role}</p>

      <button
        onClick={logout}
        className="mt-4 rounded-xl bg-gray-900 text-white px-4 py-2"
      >
        Logout
      </button>
    </div>
  );
}

export default GuestDashboard;