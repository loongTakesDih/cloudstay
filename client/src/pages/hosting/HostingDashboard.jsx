import { useNavigate } from "react-router-dom";
import AppHeader from "../../components/AppHeader";
import { useAuth } from "../../context/useAuth";
import { getBookingRequests } from "../../api/api";
import { useEffect, useState } from "react";

function HostingDashboard() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const [requests, setRequests] = useState([]);

  useEffect(() => {
    getBookingRequests()
    .then((data) => setRequests(data))
    .catch((err) => console.error("Failed to fetch requests", err));
    }, []);

  return (
    <div className="min-h-screen bg-[#fffaf7] text-slate-950">
      <AppHeader
        eyebrow="Hosting mode"
        title={`Hosting dashboard, ${user?.username || "host"}`}
        subtitle="Manage future listings, requests, and hosting performance."
        actions={
          <>
            <button
              onClick={() => navigate("/profile")}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            >
              Profile
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-600"
            >
              User Dashboard
            </button>
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
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-normal text-rose-500">
            Host workspace
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-normal text-slate-950">
            Build a thoughtful stay experience.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            This area is ready for listing creation, guest requests, and host
            performance tools as the product grows.
          </p>
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-rose-500">Listing setup</p>
            <h3 className="mt-3 text-xl font-bold tracking-normal text-slate-950">
              Create a listing
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Add photos, pricing, location, and stay details when listing tools
              are connected.
            </p>
            <button
              onClick={() => navigate("/hosting/listings/new")}
              className="mt-5 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Create listing
            </button>
          </article>

          <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-rose-500">Inventory</p>
            <h3 className="mt-3 text-xl font-bold tracking-normal text-slate-950">
              My listings
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Any active, draft, and paused properties will be grouped accordingly here.
            </p>
            <button
              onClick={() => navigate("/hosting/listings")}
              className="mt-5 rounded-lg border border-rose-500 bg-rose-500 p-2 text-left text-sm font-semibold text-white transition hover:bg-rose-600"
            >
              View my listings
            </button>
          </article>
          <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-rose-500">Guests</p>
            <h3 className="mt-3 text-xl font-bold tracking-normal text-slate-950">
              Booking requests
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Review pending stays, guest details, and booking decisions here.
            </p>
            
            <div className="mt-5 space-y-3">
              {requests.length > 0 ? (
              <div className="mt-5 space-y-3">
                {requests.length > 0 ? (
                  requests.map((req) => ( // <--- Ensure 'req' is defined here
                    <div 
                      key={req.id} 
                      onClick={() => navigate(`/hosting/requests/${req.id}`)}
                      className="rounded-lg border border-slate-200 p-3 text-sm cursor-pointer hover:border-rose-500 transition"
                    >
                      <p className="font-bold">{req.guest?.username}</p>
                      <p className="text-slate-600">
                        {new Date(req.checkIn).toLocaleDateString()} - {new Date(req.checkOut).toLocaleDateString()}
                      </p>
                      <p className="font-semibold text-rose-600">RM {req.totalPrice}</p>
                    </div>
                  ))
                ) : (
                  <p>No requests found.</p>
                )}
              </div>

              ) : (
                <div className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500 text-center">
                  No requests
                </div>
              )}
            </div>
          </article>



          <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-rose-500">Performance</p>
            <h3 className="mt-3 text-xl font-bold tracking-normal text-slate-950">
              Earnings overview
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Track revenue, occupancy, and payout summaries as hosting data
              arrives.
            </p>
            <div className="mt-5 text-2xl font-bold tracking-normal text-slate-950">
              $0
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}

export default HostingDashboard;
