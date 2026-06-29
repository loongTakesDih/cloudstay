import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppHeader from "../../components/AppHeader";
import NotificationBell from "../../components/NotificationBell.jsx";
import { getMyListings, getMyTrips } from "../../api/api.js";
import { useAuth } from "../../context/useAuth";
import { readNotifications, readSavedListings } from "../../utils/localState.js";

const sections = [
  { id: "overview", label: "Overview" },
  { id: "travel", label: "Travel" },
  { id: "hosting", label: "Hosting" },
  { id: "notifications", label: "Notifications" },
];

const formatMemberSince = (createdAt) => {
  if (!createdAt) return "Recently joined";

  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return "Recently joined";

  return new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
  }).format(date);
};

const formatDate = (value) => {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en-MY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
};

function ProfileSidebar({ activeSection, onSectionChange }) {
  return (
    <aside className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
      <nav className="flex gap-2 md:flex-col" aria-label="Profile sections">
        {sections.map((section) => {
          const isActive = activeSection === section.id;

          return (
            <button
              key={section.id}
              type="button"
              onClick={() => onSectionChange(section.id)}
              className={`w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${
                isActive
                  ? "bg-slate-950 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
              }`}
            >
              {section.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

function StatCard({ label, value, tone = "default" }) {
  const toneClass =
    tone === "rose"
      ? "border-rose-100 bg-rose-50"
      : tone === "emerald"
        ? "border-emerald-100 bg-emerald-50"
        : "border-slate-200 bg-white";

  return (
    <div className={`rounded-3xl border p-5 shadow-sm ${toneClass}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-3 text-2xl font-bold text-slate-950">{value}</p>
    </div>
  );
}

function ProfileHero({ user, tripCount, listingCount, notificationCount, savedCount }) {
  return (
    <section className="rounded-[2rem] bg-[linear-gradient(135deg,#0f172a_0%,#111827_55%,#1e293b_100%)] p-6 text-white shadow-xl sm:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="grid h-20 w-20 place-items-center rounded-full bg-rose-500 text-3xl font-bold">
            {(user?.username || "C").slice(0, 1).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-rose-200">
              CloudStay account
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-normal">
              {user?.username || "Traveler"}
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              {user?.email || "No email available"} · Member since {formatMemberSince(user?.createdAt)}
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Trips" value={tripCount} tone="default" />
          <StatCard label="Saved" value={savedCount} tone="default" />
          <StatCard label="Updates" value={notificationCount} tone="rose" />
          <StatCard label="Listings" value={listingCount} tone="emerald" />
        </div>
      </div>
    </section>
  );
}

function OverviewSection({ user, trips, savedPlaces, notifications, listings }) {
  const acceptedTrips = trips.filter((trip) => trip.status === "Accepted").length;
  const pendingTrips = trips.filter((trip) => trip.status === "Pending").length;
  const acceptedHosting = listings.filter((listing) => listing.isListed).length;

  return (
    <section className="space-y-6">
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Account type" value={user?.isHost ? "Guest + Host" : "Guest"} />
        <StatCard label="Accepted trips" value={acceptedTrips} tone="emerald" />
        <StatCard label="Pending trips" value={pendingTrips} tone="rose" />
        <StatCard label="Listed places" value={acceptedHosting} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-rose-500">
            Account summary
          </p>
          <h3 className="mt-2 text-2xl font-bold text-slate-950">
            Guest and host details connected in one profile
          </h3>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Username</p>
              <p className="mt-2 font-bold text-slate-950">{user?.username || "CloudStay user"}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</p>
              <p className="mt-2 font-bold text-slate-950">{user?.email || "Not available"}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Member since</p>
              <p className="mt-2 font-bold text-slate-950">{formatMemberSince(user?.createdAt)}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Host access</p>
              <p className="mt-2 font-bold text-slate-950">{user?.isHost ? "Enabled" : "Not enabled yet"}</p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-rose-500">
            Right now
          </p>
          <div className="mt-4 space-y-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-500">Saved places</p>
              <p className="mt-2 text-lg font-bold text-slate-950">{savedPlaces.length}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-500">Notifications</p>
              <p className="mt-2 text-lg font-bold text-slate-950">{notifications.length}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-500">Total trips requested</p>
              <p className="mt-2 text-lg font-bold text-slate-950">{trips.length}</p>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}

function TravelSection({ trips, savedPlaces, navigate }) {
  return (
    <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-rose-500">
          My trips
        </p>
        <h3 className="mt-2 text-2xl font-bold text-slate-950">Travel activity</h3>
        <div className="mt-6 space-y-3">
          {trips.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
              No trips yet
            </div>
          ) : (
            trips.map((trip) => (
              <button
                key={trip.id}
                type="button"
                onClick={() => navigate(`/trips/${trip.id}`)}
                className="block w-full rounded-2xl border border-slate-100 bg-slate-50 p-4 text-left transition hover:border-rose-200 hover:bg-rose-50"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-bold text-slate-950">{trip.property?.title || "Property"}</p>
                  <span className="text-xs font-bold uppercase text-slate-500">{trip.status}</span>
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  {formatDate(trip.checkIn)} - {formatDate(trip.checkOut)}
                </p>
              </button>
            ))
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-rose-500">
          Saved stays
        </p>
        <h3 className="mt-2 text-2xl font-bold text-slate-950">Places to revisit</h3>
        <div className="mt-6 space-y-3">
          {savedPlaces.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
              No saved places yet
            </div>
          ) : (
            savedPlaces.map((place) => (
              <button
                key={place.id}
                type="button"
                onClick={() => navigate(`/properties/${place.id}`)}
                className="flex w-full items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-left transition hover:border-rose-200 hover:bg-rose-50"
              >
                <div className="h-16 w-20 overflow-hidden rounded-xl bg-slate-200">
                  {place.imageUrl ? (
                    <img src={place.imageUrl} alt={place.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-slate-500">
                      No Photo
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-bold text-slate-950">{place.title}</p>
                  <p className="mt-1 truncate text-sm text-slate-500">{place.location}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </section>
    </section>
  );
}

function HostingSection({ user, listings, navigate }) {
  if (!user?.isHost) {
    return (
      <section className="rounded-3xl border border-rose-100 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-rose-500">
          Hosting
        </p>
        <h3 className="mt-2 text-2xl font-bold text-slate-950">Host tools are waiting</h3>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          Turn on hosting to manage listings, review booking requests, and track performance.
        </p>
        <button
          type="button"
          onClick={() => navigate("/become-host")}
          className="mt-5 rounded-2xl bg-rose-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-600"
        >
          Become a Host
        </button>
      </section>
    );
  }

  const listedCount = listings.filter((listing) => listing.isListed).length;
  const availableCount = listings.filter((listing) => listing.isListed && listing.isAvailable).length;

  return (
    <section className="space-y-6">
      <div className="grid gap-5 md:grid-cols-3">
        <StatCard label="Total listings" value={listings.length} />
        <StatCard label="Listed" value={listedCount} tone="emerald" />
        <StatCard label="Available" value={availableCount} tone="rose" />
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-rose-500">
              Host profile
            </p>
            <h3 className="mt-2 text-2xl font-bold text-slate-950">
              Listing visibility and readiness
            </h3>
          </div>
          <button
            type="button"
            onClick={() => navigate("/hosting/listings")}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
          >
            Manage listings
          </button>
        </div>

        <div className="mt-6 space-y-3">
          {listings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
              No listings yet
            </div>
          ) : (
            listings.map((listing) => (
              <button
                key={listing.id}
                type="button"
                onClick={() => navigate(`/properties/${listing.id}`)}
                className="block w-full rounded-2xl border border-slate-100 bg-slate-50 p-4 text-left transition hover:border-rose-200 hover:bg-rose-50"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-950">{listing.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{listing.location}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-950">RM {listing.pricePerNight}</p>
                    <p className="mt-1 text-xs font-semibold uppercase text-slate-500">
                      {listing.isListed ? (listing.isAvailable ? "Listed · Available" : "Listed · Unavailable") : "Draft"}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </section>
    </section>
  );
}

function NotificationsSection({ notifications, navigate }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wide text-rose-500">
        Notifications
      </p>
      <h3 className="mt-2 text-2xl font-bold text-slate-950">Booking updates</h3>
      <div className="mt-6 space-y-3">
        {notifications.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
            No notifications yet
          </div>
        ) : (
          notifications.map((notification) => (
            <button
              key={notification.id}
              type="button"
              onClick={() => {
                if (notification.bookingId) {
                  navigate(`/trips/${notification.bookingId}`);
                }
              }}
              className="block w-full rounded-2xl border border-slate-100 bg-slate-50 p-4 text-left transition hover:border-rose-200 hover:bg-rose-50"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-bold text-slate-950">{notification.title}</p>
                <span className="text-xs font-semibold uppercase text-slate-500">
                  {notification.status || "Update"}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-600">{notification.message}</p>
              <p className="mt-2 text-xs text-slate-500">
                {new Date(notification.createdAt).toLocaleString()}
              </p>
            </button>
          ))
        )}
      </div>
    </section>
  );
}

function ProfilePage() {
  const navigate = useNavigate();
  const { loading, logout, user } = useAuth();
  const [activeSection, setActiveSection] = useState("overview");
  const [trips, setTrips] = useState([]);
  const [listings, setListings] = useState([]);
  const [savedPlaces, setSavedPlaces] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!user) return;

    const loadProfileData = async () => {
      try {
        const tripData = await getMyTrips();
        setTrips(tripData);
      } catch (error) {
        console.error("Failed to load trips for profile", error);
        setTrips([]);
      }

      if (user.isHost) {
        try {
          const listingData = await getMyListings();
          setListings(listingData);
        } catch (error) {
          console.error("Failed to load listings for profile", error);
          setListings([]);
        }
      } else {
        setListings([]);
      }

      setSavedPlaces(readSavedListings(user.userId));
      setNotifications(readNotifications(user.userId));
    };

    loadProfileData();
  }, [user]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fffaf7] px-4 text-slate-700">
        Loading profile...
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#fffaf7] text-slate-950">
      <AppHeader
        title="Your Profile"
        subtitle="Review travel activity, saved stays, hosting readiness, and booking updates."
        actions={
          <>
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            >
              Dashboard
            </button>
            <NotificationBell userId={user?.userId} />
            <button
              type="button"
              onClick={logout}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            >
              Logout
            </button>
          </>
        }
      />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <ProfileHero
          user={user}
          tripCount={trips.length}
          listingCount={listings.length}
          notificationCount={notifications.length}
          savedCount={savedPlaces.length}
        />

        <div className="mt-8 grid gap-6 lg:grid-cols-[260px_1fr]">
          <ProfileSidebar
            activeSection={activeSection}
            onSectionChange={setActiveSection}
          />

          <div>
            {activeSection === "overview" && (
              <OverviewSection
                user={user}
                trips={trips}
                savedPlaces={savedPlaces}
                notifications={notifications}
                listings={listings}
              />
            )}
            {activeSection === "travel" && (
              <TravelSection
                trips={trips}
                savedPlaces={savedPlaces}
                navigate={navigate}
              />
            )}
            {activeSection === "hosting" && (
              <HostingSection
                user={user}
                listings={listings}
                navigate={navigate}
              />
            )}
            {activeSection === "notifications" && (
              <NotificationsSection
                notifications={notifications}
                navigate={navigate}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default ProfilePage;
