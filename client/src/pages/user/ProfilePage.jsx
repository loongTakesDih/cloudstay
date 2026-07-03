import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppHeader from "../../components/AppHeader";
import { getMyTrips } from "../../api/api.js";
import { useAuth } from "../../context/useAuth";

const formatMemberSince = (createdAt) => {
  if (!createdAt) return "Recently joined";
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return "Recently joined";
  return new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(date);
};

const formatDate = (value) => {
  if (!value) return "Date unavailable";
  return new Intl.DateTimeFormat("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
};

function ProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pastTrips, setPastTrips] = useState([]);
  const [loadingTrips, setLoadingTrips] = useState(true);

  useEffect(() => {
    const loadPastTrips = async () => {
      try {
        const trips = await getMyTrips();
        const now = new Date();
        setPastTrips(
          trips
            .filter((trip) => trip.checkOut && new Date(trip.checkOut) < now)
            .sort((a, b) => new Date(b.checkOut) - new Date(a.checkOut)),
        );
      } catch (error) {
        console.error("Failed to load past trips for profile", error);
        setPastTrips([]);
      } finally {
        setLoadingTrips(false);
      }
    };

    loadPastTrips();
  }, []);

  return (
    <div className="min-h-screen bg-[#fffaf7] text-slate-950">
      <AppHeader />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[320px_1fr]">
          <aside>
            <section className="rounded-[2rem] border border-slate-200 bg-white p-7 text-center shadow-lg shadow-slate-200/50">
              <div className="mx-auto grid h-28 w-28 place-items-center rounded-full bg-slate-950 text-4xl font-bold text-white">
                {(user?.username || "C").slice(0, 1).toUpperCase()}
              </div>
              <h1 className="mt-5 text-3xl font-bold tracking-tight">
                {user?.username || "Traveler"}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {user?.isHost ? "Guest and host" : "CloudStay guest"}
              </p>
              <div className="mt-6 border-t border-slate-200 pt-5 text-left">
                <p className="text-sm font-semibold text-slate-950">
                  Member since {formatMemberSince(user?.createdAt)}
                </p>
                <p className="mt-2 truncate text-sm text-slate-500">{user?.email}</p>
              </div>
            </section>
          </aside>

          <div className="space-y-10">
            <section>
              <p className="text-sm font-bold uppercase tracking-wider text-rose-500">Profile</p>
              <h2 className="mt-2 text-4xl font-bold tracking-tight text-slate-950">
                About me
              </h2>
              <div className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <p className="text-lg leading-8 text-slate-700">
                  Hi, I’m {user?.username || "a CloudStay traveler"}. I use CloudStay to
                  discover memorable places and plan stays with confidence.
                </p>
                <div className="mt-7 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 p-5">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Lives in</p>
                    <p className="mt-2 font-semibold text-slate-900">Not added yet</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-5">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Speaks</p>
                    <p className="mt-2 font-semibold text-slate-900">Not added yet</p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight text-slate-950">Past trips</h2>
                  <p className="mt-2 text-sm text-slate-500">Places you have previously stayed.</p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/my-trips")}
                  className="shrink-0 text-sm font-bold text-slate-900 underline decoration-slate-300 underline-offset-4"
                >
                  View all trips
                </button>
              </div>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                {loadingTrips ? (
                  <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
                    Loading past trips...
                  </div>
                ) : pastTrips.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 sm:col-span-2">
                    <p className="font-bold text-slate-950">No past trips yet</p>
                    <p className="mt-2 text-sm text-slate-500">Completed stays will appear here.</p>
                  </div>
                ) : (
                  pastTrips.slice(0, 4).map((trip) => (
                    <button
                      key={trip.id}
                      type="button"
                      onClick={() => navigate(`/trips/${trip.id}`)}
                      className="rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <p className="truncate text-lg font-bold text-slate-950">
                        {trip.property?.title || "CloudStay property"}
                      </p>
                      <p className="mt-1 truncate text-sm text-slate-500">
                        {trip.property?.location || "Location unavailable"}
                      </p>
                      <p className="mt-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                        Checked out {formatDate(trip.checkOut)}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </section>

            <section>
              <h2 className="text-3xl font-bold tracking-tight text-slate-950">Connections</h2>
              <div className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-rose-50 text-rose-500">
                  <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
                    <path d="M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m7-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm13 10v-2a4 4 0 0 0-3-3.87M16 2.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </div>
                <h3 className="mt-5 text-xl font-bold">No connections to show yet</h3>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                  Connections with hosts and fellow travelers will appear here when this feature becomes available.
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ProfilePage;
