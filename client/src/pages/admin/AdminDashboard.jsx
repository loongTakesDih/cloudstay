import AppHeader from "../../components/AppHeader";
import { useAuth } from "../../context/useAuth";

function AdminDashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#fffaf7] text-slate-950">
      <AppHeader
        eyebrow="Internal"
        title="Admin Dashboard"
        subtitle={`Signed in as ${user?.username || "admin"}`}
        actions={
          <button
            onClick={logout}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
          >
            Logout
          </button>
        }
      />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-normal text-rose-500">
            System management
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-normal text-slate-950">
            Internal tools placeholder
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            Admin-only management views can be added here without exposing them
            to the public registration flow.
          </p>
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-3">
          <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold tracking-normal text-slate-950">
              Users
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Review user and host accounts later.
            </p>
          </article>
          <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold tracking-normal text-slate-950">
              Listings
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Monitor property content when moderation tools are built.
            </p>
          </article>
          <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold tracking-normal text-slate-950">
              Bookings
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Keep operational booking oversight in one internal area.
            </p>
          </article>
        </section>
      </main>
    </div>
  );
}

export default AdminDashboard;
