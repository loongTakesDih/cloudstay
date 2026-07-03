import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppHeader from "../../components/AppHeader";
import NotificationBell from "../../components/NotificationBell.jsx";
import { getMyTrips } from "../../api/api.js";
import { useAuth } from "../../context/useAuth";
import { readSavedListings } from "../../utils/localState.js";


function UserDashboard() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [loadingTrips, setLoadingTrips] = useState(false);
  const [savedPlaces, setSavedPlaces] = useState([]);

  useEffect(() => {
    const fetchTrips = async () => {
      setLoadingTrips(true);
      try {
        const data = await getMyTrips();
        setTrips(data);
      } catch (error) {
        console.error("Failed to fetch trips", error);
        setTrips([]);
      } finally {
        setLoadingTrips(false);
      }
    };

    if (user) {
      fetchTrips();
    }
  }, [user]);

  useEffect(() => {
    const loadId = window.setTimeout(() => {
      if (!user) {
        setSavedPlaces([]);
        return;
      }

      try {
        setSavedPlaces(readSavedListings(user.userId));
      } catch (error) {
        console.error("Failed to load saved places", error);
        setSavedPlaces([]);
      }
    }, 0);

    return () => window.clearTimeout(loadId);
  }, [user]);

  return (
    <div className="min-h-screen bg-[#fffaf7] text-slate-950">
      <AppHeader
        title={`Welcome, ${user?.username || "traveler"}`}
        subtitle="Plan stays, review trips, and manage hosting from one place."
        actions={
          <>
            <button
              onClick={() => navigate("/profile")}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            >
              Profile
            </button>
            <button
              onClick={() => navigate("/messages")}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            >
              Messages
            </button>
            <span className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600">
              {user?.isHost ? "Host enabled" : "Guest account"}
            </span>
            <NotificationBell userId={user?.userId} />
            <button
              onClick={logout}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            >
              Logout
            </button>
          </>
        }
      />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-lg bg-slate-950 p-6 text-white shadow-xl shadow-slate-200/80 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-normal text-rose-200">
            Your CloudStay
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-normal">
            Trips, stays, and hosting when you need it.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
            Start with travel. When you are ready, turn on hosting and keep both
            sides of your CloudStay account connected.
          </p>
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-rose-500">Explore</p>
            <h3 className="mt-3 text-xl font-bold tracking-normal text-slate-950">
              Explore stays
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Discover apartments, homes, and weekend escapes.
            </p>
            <button 
              onClick={() => navigate("/explore")}
              className="mt-5 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Browse now
            </button>
          </article>

          <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm flex flex-col max-h-[300px]">
            <p className="text-sm font-semibold text-rose-500">Trips</p>
            <h3 className="mt-3 text-xl font-bold tracking-normal text-slate-950">
              My trips
            </h3>
            
            <div className="mt-4 flex-1 overflow-y-auto pr-2">
              {loadingTrips ? (
                <div className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500 text-center">
                  Loading trips...
                </div>
              ) : trips.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500 text-center">
                  No trips yet
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {trips.map((trip) => (
                    <div 
                      key={trip.id} 
                      onClick={() => navigate(`/trips/${trip.id}`)}
                      className="cursor-pointer rounded-lg border border-slate-100 bg-slate-50 p-3 transition hover:border-rose-200 hover:bg-rose-50"
                    >
                      <p className="text-sm font-bold text-slate-900 truncate">
                        {trip.property?.title || "Property"}
                      </p>
                      <p className="mt-1 text-xs font-medium text-slate-500">
                        {new Date(trip.checkIn).toLocaleDateString()} to {new Date(trip.checkOut).toLocaleDateString()}
                      </p>
                      <p className="mt-2 text-xs font-bold text-emerald-600 uppercase">
                        {trip.status || "Confirmed"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </article>

          <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-rose-500">Saved</p>
            <h3 className="mt-3 text-xl font-bold tracking-normal text-slate-950">
              Saved places
            </h3>
            <div className="mt-5 max-h-[220px] space-y-3 overflow-y-auto pr-1">
              {savedPlaces.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                  No saved places
                </div>
              ) : (
                savedPlaces.map((place) => (
                  <button
                    key={place.id}
                    type="button"
                    onClick={() => navigate(`/properties/${place.id}`)}
                    className="flex w-full items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3 text-left transition hover:border-rose-200 hover:bg-rose-50"
                  >
                    <div className="h-14 w-16 overflow-hidden rounded-md bg-slate-200">
                      {place.imageUrl ? (
                        <img src={place.imageUrl} alt={place.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-slate-500">
                          No Photo
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-900">
                        {place.title}
                      </p>
                      <p className="mt-1 truncate text-xs text-slate-500">
                        {place.location}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </article>

          <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-rose-500">Hosting</p>
            <h3 className="mt-3 text-xl font-bold tracking-normal text-slate-950">
              {user?.isHost ? "Hosting is ready" : "Share your place"}
            </h3>
            {user?.isHost ? (
              <button
                onClick={() => navigate("/hosting/dashboard")}
                className="mt-5 rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-600"
              >
                Switch to Hosting
              </button>
            ) : (
              <button
                onClick={() => navigate("/become-host")}
                className="mt-5 rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-600"
              >
                Become a Host
              </button>
            )}
          </article>
        </section>

      </main>
    </div>
  );
}

export default UserDashboard;
