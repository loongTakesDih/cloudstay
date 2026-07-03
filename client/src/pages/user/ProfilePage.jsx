import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppHeader from "../../components/AppHeader";
import { getMyReviews, getMyTrips } from "../../api/api.js";
import { useAuth } from "../../context/useAuth";

const sections = [
  { id: "about-me", label: "About me" },
  { id: "past-trips", label: "Past trips" },
  { id: "connections", label: "Connections" },
];

const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat("en-MY", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(new Date(value))
    : "Date unavailable";

const getTimeOnCloudStay = (createdAt) => {
  if (!createdAt) return "Recently joined";
  const joined = new Date(createdAt);
  if (Number.isNaN(joined.getTime())) return "Recently joined";

  const months = Math.max(
    0,
    (new Date().getFullYear() - joined.getFullYear()) * 12 +
      new Date().getMonth() -
      joined.getMonth(),
  );
  if (months < 1) return "Less than a month";
  if (months < 12) return `${months} month${months === 1 ? "" : "s"}`;
  const years = Math.floor(months / 12);
  return `${years} year${years === 1 ? "" : "s"}`;
};

const isPastTrip = (trip) => {
  const status = String(trip.status || "").toLowerCase();
  return (
    status === "checkedout" ||
    status === "completed" ||
    (trip.checkOut && new Date(trip.checkOut) < new Date())
  );
};

function TripCard({ trip, onOpen }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="overflow-hidden rounded-3xl border border-slate-200 bg-white text-left transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="h-36 bg-gradient-to-br from-rose-100 to-slate-200">
        {trip.property?.imageUrl && (
          <img
            src={trip.property.imageUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        )}
      </div>
      <div className="p-5">
        <h3 className="truncate text-lg font-bold">
          {trip.property?.title || "CloudStay property"}
        </h3>
        <p className="mt-1 truncate text-sm text-slate-500">
          {trip.property?.location || "Location unavailable"}
        </p>
        <p className="mt-4 text-xs font-bold uppercase tracking-wide text-slate-500">
          {formatDate(trip.checkIn)} – {formatDate(trip.checkOut)}
        </p>
      </div>
    </button>
  );
}

function AboutMe({ user, pastTrips, reviews }) {
  return (
    <div className="space-y-12">
      <section>
        <h1 className="text-4xl font-bold tracking-tight">About me</h1>
        <div className="mt-7 grid overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm md:grid-cols-[1fr_210px]">
          <div className="flex flex-col items-center justify-center p-10 text-center">
            <div className="grid h-32 w-32 place-items-center rounded-full bg-slate-950 text-5xl font-bold text-white">
              {(user?.username || "C").slice(0, 1).toUpperCase()}
            </div>
            <h2 className="mt-5 text-3xl font-bold">{user?.username || "Traveler"}</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              {user?.isHost ? "Guest and host" : "CloudStay guest"}
            </p>
          </div>

          <div className="border-t border-slate-200 px-7 py-5 md:border-l md:border-t-0">
            {[
              [pastTrips.length, pastTrips.length === 1 ? "trip" : "trips"],
              [reviews.length, reviews.length === 1 ? "review" : "reviews"],
              [getTimeOnCloudStay(user?.createdAt), "on CloudStay"],
            ].map(([value, label], index) => (
              <div
                key={label}
                className={index > 0 ? "border-t border-slate-200 py-5" : "pb-5"}
              >
                <p className="text-xl font-extrabold text-slate-950">{value}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 pt-10">
        <h2 className="text-3xl font-bold tracking-tight">Where I’ve been</h2>
        <div className="mt-6 rounded-[2rem] border border-dashed border-slate-300 bg-white p-10">
          <p className="font-bold text-slate-900">Your travel map is coming soon</p>
          <p className="mt-2 text-sm text-slate-500">
            Places from completed CloudStay trips will appear here.
          </p>
        </div>
      </section>

      <section className="border-t border-slate-200 pt-10">
        <h2 className="text-3xl font-bold tracking-tight">Reviews I’ve written</h2>
        {reviews.length === 0 ? (
          <div className="mt-6 rounded-[2rem] border border-dashed border-slate-300 bg-white p-10">
            <p className="font-bold">No reviews written yet</p>
            <p className="mt-2 text-sm text-slate-500">
              Reviews you leave after a stay will be collected here.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {reviews.map((review) => (
              <article
                key={review.id}
                className="rounded-3xl border border-slate-200 bg-white p-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-bold">{review.propertyTitle}</h3>
                  <span className="text-sm font-bold text-amber-500">
                    {"★".repeat(Math.round(review.overallRating))}
                  </span>
                </div>
                <p className="mt-3 leading-7 text-slate-600">{review.comment}</p>
                <p className="mt-4 text-xs font-semibold text-slate-400">
                  {formatDate(review.createdAt)}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function PastTrips({ trips, loading, onOpen }) {
  return (
    <section>
      <h1 className="text-4xl font-bold tracking-tight">Past trips</h1>
      <p className="mt-3 text-slate-500">
        Open a previous booking to revisit its dates, price, messages, and review.
      </p>
      {loading ? (
        <p className="mt-8 text-sm text-slate-500">Loading past trips...</p>
      ) : trips.length === 0 ? (
        <div className="mt-8 rounded-[2rem] border border-dashed border-slate-300 bg-white p-10">
          <p className="font-bold">No past trips yet</p>
          <p className="mt-2 text-sm text-slate-500">Completed stays will appear here.</p>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {trips.map((trip) => (
            <TripCard key={trip.id} trip={trip} onOpen={() => onOpen(trip.id)} />
          ))}
        </div>
      )}
    </section>
  );
}

function Connections({ connections }) {
  return (
    <section>
      <h1 className="text-4xl font-bold tracking-tight">Connections</h1>
      <p className="mt-3 text-slate-500">Hosts you’ve stayed with through CloudStay.</p>
      {connections.length === 0 ? (
        <div className="mt-8 rounded-[2rem] border border-dashed border-slate-300 bg-white p-10">
          <p className="font-bold">No host connections yet</p>
          <p className="mt-2 text-sm text-slate-500">
            Hosts from your completed bookings will appear here.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {connections.map((host) => (
            <article
              key={host.id}
              className="flex items-center gap-4 rounded-3xl border border-slate-200 bg-white p-5"
            >
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-slate-950 text-xl font-bold text-white">
                {(host.username || "H").slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-lg font-bold">{host.username || "CloudStay host"}</h2>
                <p className="mt-1 text-sm text-slate-500">Previous host</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function ProfilePage() {
  const navigate = useNavigate();
  const { section = "about-me" } = useParams();
  const { user } = useAuth();
  const activeSection = sections.some((item) => item.id === section)
    ? section
    : "about-me";
  const [trips, setTrips] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadProfileData = useCallback(() => {
    Promise.allSettled([getMyTrips(), getMyReviews()])
      .then(([tripResult, reviewResult]) => {
        setTrips(tripResult.status === "fulfilled" ? tripResult.value : []);
        setReviews(reviewResult.status === "fulfilled" ? reviewResult.value : []);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  useEffect(() => {
    const refresh = (event) => {
      if (["booking", "review"].includes(event.detail?.entity)) {
        loadProfileData();
      }
    };
    window.addEventListener("cloudstay:data-changed", refresh);
    return () => window.removeEventListener("cloudstay:data-changed", refresh);
  }, [loadProfileData]);

  const pastTrips = useMemo(
    () =>
      trips
        .filter(isPastTrip)
        .sort((a, b) => new Date(b.checkOut) - new Date(a.checkOut)),
    [trips],
  );

  const connections = useMemo(() => {
    const uniqueHosts = new Map();
    pastTrips.forEach((trip) => {
      const host = trip.property?.host;
      if (host?.id && !uniqueHosts.has(host.id)) uniqueHosts.set(host.id, host);
    });
    return [...uniqueHosts.values()];
  }, [pastTrips]);

  return (
    <div className="min-h-screen bg-[#fffaf7] text-slate-950">
      <AppHeader />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[260px_1fr]">
          <aside className="lg:border-r lg:border-slate-300 lg:pr-8">
            <h1 className="text-4xl font-bold tracking-tight">Profile</h1>
            <nav className="mt-8 flex gap-2 overflow-x-auto lg:flex-col" aria-label="Profile sections">
              {sections.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate(`/profile/${item.id}`)}
                  className={`shrink-0 rounded-xl px-4 py-3 text-left text-sm font-bold transition ${
                    activeSection === item.id
                      ? "bg-slate-950 text-white"
                      : "text-slate-600 hover:bg-white hover:text-slate-950"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </aside>

          <div className="min-w-0 lg:pl-4">
            {activeSection === "about-me" && (
              <AboutMe user={user} pastTrips={pastTrips} reviews={reviews} />
            )}
            {activeSection === "past-trips" && (
              <PastTrips
                trips={pastTrips}
                loading={loading}
                onOpen={(bookingId) => navigate(`/trips/${bookingId}`)}
              />
            )}
            {activeSection === "connections" && (
              <Connections connections={connections} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default ProfilePage;
