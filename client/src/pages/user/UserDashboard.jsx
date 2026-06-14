import { useNavigate } from "react-router-dom";
import AppHeader from "../../components/AppHeader";
import { useAuth } from "../../context/useAuth";

function UserDashboard() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

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
            <span className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600">
              {user?.isHost ? "Host enabled" : "Guest account"}
            </span>
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
              Discover apartments, homes, and weekend escapes once listings are
              connected.
            </p>
            <button className="mt-5 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
              Browse soon
            </button>
          </article>

          <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-rose-500">Trips</p>
            <h3 className="mt-3 text-xl font-bold tracking-normal text-slate-950">
              My trips
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Upcoming and past bookings will appear here as the booking flow
              grows.
            </p>
            <div className="mt-5 rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">
              No trips yet
            </div>
          </article>

          <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-rose-500">Saved</p>
            <h3 className="mt-3 text-xl font-bold tracking-normal text-slate-950">
              Saved places
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Keep favorite stays ready for later once search and listing pages
              are available.
            </p>
            <div className="mt-5 rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">
              No saved places
            </div>
          </article>

          <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-rose-500">Hosting</p>
            <h3 className="mt-3 text-xl font-bold tracking-normal text-slate-950">
              {user?.isHost ? "Hosting is ready" : "Share your place"}
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {user?.isHost
                ? "Switch to hosting to manage listings, requests, and earnings."
                : "Become a host when you are ready to list a stay on CloudStay."}
            </p>
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

        <section className="mt-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold tracking-normal text-slate-950">
            Account details
          </h3>
          <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="font-semibold text-slate-500">Email</dt>
              <dd className="mt-1 text-slate-800">{user?.email}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500">Role</dt>
              <dd className="mt-1 text-slate-800">{user?.role}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500">Hosting</dt>
              <dd className="mt-1 text-slate-800">
                {user?.isHost ? "Enabled" : "Not enabled"}
              </dd>
            </div>
          </dl>
        </section>
      </main>
    </div>
  );
}

export default UserDashboard;
