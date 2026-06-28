import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { getMyTrips } from "../../api/api.js";

function GuestDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const data = await getMyTrips();
        setTrips(data);
      } catch (error) {
        console.error("Failed to load trips", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchTrips();
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-[#fffaf7] p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-normal text-slate-950">
              Guest Dashboard
            </h1>
            <p className="mt-2 text-sm font-semibold text-slate-600">
              Welcome back, {user?.username}
            </p>
          </div>
          <button
            onClick={logout}
            className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-bold text-slate-700 transition hover:border-slate-300"
          >
            Logout
          </button>
        </div>

        <section>
          <h2 className="mb-5 text-xl font-bold text-slate-950">My Upcoming Trips</h2>

          {loading ? (
            <p className="text-sm font-semibold text-slate-500">Loading your trips...</p>
          ) : trips.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <p className="text-sm font-semibold text-slate-600">
                You haven't booked any stays yet.
              </p>
              <button
                onClick={() => navigate("/")}
                className="mt-4 rounded-full bg-slate-950 px-6 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                Start exploring
              </button>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {trips.map((trip) => (
                <div
                  key={trip.id}
                  className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div>
                    <h3 className="text-lg font-bold text-slate-950">
                      {trip.property?.title || "CloudStay Property"}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {trip.property?.location || "Location not available"}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3 text-sm font-semibold text-slate-700">
                    <p>In: {new Date(trip.checkIn).toLocaleDateString()}</p>
                    <p className="mt-1">Out: {new Date(trip.checkOut).toLocaleDateString()}</p>
                  </div>

                  <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4">
                    <span className="text-xs font-bold uppercase tracking-wide text-emerald-600">
                      {trip.status || "Confirmed"}
                    </span>
                    <span className="text-lg font-bold text-slate-950">
                      RM {trip.totalPrice}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default GuestDashboard;