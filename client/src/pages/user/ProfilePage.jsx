import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppHeader from "../../components/AppHeader";
import { useAuth } from "../../context/useAuth";

const sections = [
  { id: "about", label: "About Me" },
  { id: "trips", label: "Past Trips" },
  { id: "connections", label: "Connections" },
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

function ProfileSidebar({ activeSection, onSectionChange }) {
  return (
    <aside className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <nav className="flex gap-2 md:flex-col" aria-label="Profile sections">
        {sections.map((section) => {
          const isActive = activeSection === section.id;

          return (
            <button
              key={section.id}
              type="button"
              onClick={() => onSectionChange(section.id)}
              className={`w-full rounded-lg px-4 py-3 text-left text-sm font-semibold transition ${
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

function DetailGrid({ items }) {
  return (
    <dl className="grid gap-4 sm:grid-cols-2">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-lg border border-slate-200 bg-slate-50 p-4"
        >
          <dt className="text-xs font-semibold uppercase tracking-normal text-slate-500">
            {item.label}
          </dt>
          <dd className="mt-2 text-sm font-semibold text-slate-950">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function ViewToggle({ activeView, canUseHostView, onViewChange }) {
  return (
    <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
      <button
        type="button"
        onClick={() => onViewChange("guest")}
        className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
          activeView === "guest"
            ? "bg-white text-slate-950 shadow-sm"
            : "text-slate-600 hover:text-slate-950"
        }`}
      >
        Guest View
      </button>
      <button
        type="button"
        disabled={!canUseHostView}
        onClick={() => onViewChange("host")}
        className={`rounded-md px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:text-slate-400 ${
          activeView === "host"
            ? "bg-white text-slate-950 shadow-sm"
            : "text-slate-600 hover:text-slate-950"
        }`}
      >
        Host View
      </button>
    </div>
  );
}

function AboutMeSection({ user }) {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState("guest");
  const canUseHostView = Boolean(user?.isHost);

  const handleViewChange = (nextView) => {
    if (nextView === "host" && !canUseHostView) return;
    setActiveView(nextView);
  };

  const guestItems = [
    { label: "Username", value: user?.username || "CloudStay traveler" },
    { label: "Email", value: user?.email || "Not available" },
    { label: "Account type", value: "Guest" },
    { label: "Member since", value: formatMemberSince(user?.createdAt) },
    { label: "Trips completed", value: "0 / Coming soon" },
    { label: "Reviews from hosts", value: "Coming soon" },
    { label: "Verification status", value: "Email verified placeholder" },
  ];

  const hostItems = [
    { label: "Username", value: user?.username || "CloudStay host" },
    { label: "Email", value: user?.email || "Not available" },
    { label: "Account type", value: "Host" },
    { label: "Host status", value: "Active host" },
    { label: "Active listings", value: "Coming soon" },
    { label: "Total listings", value: "Coming soon" },
    { label: "Reviews from guests", value: "Coming soon" },
    { label: "Response rate", value: "Coming soon" },
    { label: "Verification status", value: "Host profile active" },
  ];

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-normal text-rose-500">
            About Me
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-normal text-slate-950">
            {activeView === "host" ? "Host profile" : "Guest profile"}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Your CloudStay profile keeps guest and host details connected in one
            account.
          </p>
        </div>

        <ViewToggle
          activeView={activeView}
          canUseHostView={canUseHostView}
          onViewChange={handleViewChange}
        />
      </div>

      {!canUseHostView && (
        <div className="mt-6 rounded-lg border border-rose-100 bg-rose-50 p-4 sm:flex sm:items-center sm:justify-between sm:gap-4">
          <p className="text-sm font-medium text-rose-900">
            Become a host to unlock your host profile.
          </p>
          <button
            type="button"
            onClick={() => navigate("/become-host")}
            className="mt-3 rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-600 sm:mt-0"
          >
            Become a Host
          </button>
        </div>
      )}

      <div className="mt-6">
        <DetailGrid items={activeView === "host" ? hostItems : guestItems} />
      </div>
    </section>
  );
}

function PastTripsSection() {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <p className="text-sm font-semibold uppercase tracking-normal text-rose-500">
        Coming soon
      </p>
      <h2 className="mt-2 text-2xl font-bold tracking-normal text-slate-950">
        Past Trips
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Your completed stays will appear here.
      </p>

      <div className="mt-6 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
        <h3 className="text-lg font-bold tracking-normal text-slate-950">
          No completed stays yet
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
          Placeholder trip history and stay summaries will be connected after
          bookings are available.
        </p>
      </div>
    </section>
  );
}

function ConnectionsSection() {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <p className="text-sm font-semibold uppercase tracking-normal text-rose-500">
        Coming soon
      </p>
      <h2 className="mt-2 text-2xl font-bold tracking-normal text-slate-950">
        Connections
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        People you complete stays with will appear here.
      </p>

      <div className="mt-6 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
        <h3 className="text-lg font-bold tracking-normal text-slate-950">
          No connections yet.
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
          Future guest and host connections will be grouped here after completed
          stays.
        </p>
      </div>
    </section>
  );
}

function ProfilePage() {
  const navigate = useNavigate();
  const { loading, logout, user } = useAuth();
  const [activeSection, setActiveSection] = useState("about");

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
        title="Profile Page"
        subtitle="Review your guest profile, hosting details, trips, and connections."
        actions={
          <>
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            >
              Dashboard
            </button>
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

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[260px_1fr] lg:px-8">
        <ProfileSidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />

        <div>
          {activeSection === "about" && <AboutMeSection user={user} />}
          {activeSection === "trips" && <PastTripsSection />}
          {activeSection === "connections" && <ConnectionsSection />}
        </div>
      </main>
    </div>
  );
}

export default ProfilePage;
