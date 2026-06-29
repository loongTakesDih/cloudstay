import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppHeader from "../../components/AppHeader";
import { useAuth } from "../../context/useAuth";
import { getBookingRequests, getMyListings } from "../../api/api";
import { formatBookingDate, summarizeHosting } from "../../utils/hostingData.js";

function HostingDashboard() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const [requests, setRequests] = useState([]);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      try {
        const [bookingData, listingData] = await Promise.all([
          getBookingRequests(),
          getMyListings(),
        ]);

        setRequests(bookingData);
        setListings(listingData);
      } catch (err) {
        console.error("Failed to fetch hosting dashboard data", err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const {
    pendingRequests,
    bookingHistory,
    acceptedBookings,
    listedPlaces,
    availablePlaces,
    totalEarnings,
  } = summarizeHosting(requests, listings);

  return (
    <div className="min-h-screen bg-[#fffaf7] text-slate-950">
      <AppHeader
        eyebrow="Hosting mode"
        title={`Hosting dashboard, ${user?.username || "host"}`}
        subtitle="Manage requests, review booking history, and track hosting performance."
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
            See requests, outcomes, and listing performance in one place.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            Pending guest requests stay actionable, while accepted and declined
            bookings stay visible as your host history.
          </p>
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-rose-500">Listing setup</p>
            <h3 className="mt-3 text-xl font-bold tracking-normal text-slate-950">
              Create a listing
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Add photos, pricing, location, and stay details for your next place.
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
              Monitor active places, unpublished drafts, and what is ready to book.
            </p>
            <div className="mt-5 space-y-2 text-sm text-slate-600">
              <p>{listings.length} total listings</p>
              <p>{listedPlaces.length} listed</p>
              <p>{availablePlaces.length} currently available</p>
            </div>
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
              Review pending stays and open guest details from here.
            </p>

            <div className="mt-5 space-y-3">
              {loading ? (
                <div className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500 text-center">
                  Loading requests...
                </div>
              ) : pendingRequests.length > 0 ? (
                pendingRequests.slice(0, 3).map((request) => (
                  <button
                    key={request.id}
                    type="button"
                    onClick={() => navigate(`/hosting/requests/${request.id}`)}
                    className="block w-full rounded-lg border border-slate-200 p-3 text-left text-sm transition hover:border-rose-500"
                  >
                    <p className="font-bold text-slate-950">
                      {request.guest?.username || "Guest"}
                    </p>
                    <p className="mt-1 text-slate-600">
                      {request.property?.title || "Listing"}
                    </p>
                    <p className="mt-1 text-slate-500">
                      {formatBookingDate(request.checkIn)} - {formatBookingDate(request.checkOut)}
                    </p>
                  </button>
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500 text-center">
                  No pending requests
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
              Based on accepted bookings and the current status of your listed places.
            </p>
            <div className="mt-5 text-2xl font-bold tracking-normal text-slate-950">
              RM {totalEarnings.toFixed(2)}
            </div>
            <div className="mt-3 space-y-2 text-sm text-slate-600">
              <p>{acceptedBookings.length} accepted bookings</p>
              <p>{listedPlaces.length} places currently listed</p>
            </div>
            <button
              onClick={() => navigate("/hosting/performance")}
              className="mt-5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Open performance page
            </button>
          </article>
        </section>

        <section className="mt-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-rose-500">Guest details</p>
              <h3 className="mt-2 text-2xl font-bold text-slate-950">
                Booking history
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Accepted and declined requests stay visible here for reference.
              </p>
            </div>
            <button
              onClick={() => navigate("/hosting/history")}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              View all
            </button>
          </div>

          <div className="mt-6 space-y-4">
            {loading ? (
              <div className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500 text-center">
                Loading booking history...
              </div>
            ) : bookingHistory.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500 text-center">
                No accepted or declined requests yet
              </div>
            ) : (
              bookingHistory.slice(0, 4).map((booking) => (
                <button
                  key={booking.id}
                  type="button"
                  onClick={() => navigate(`/hosting/requests/${booking.id}`)}
                  className="flex w-full flex-col gap-3 rounded-lg border border-slate-200 p-4 text-left transition hover:border-rose-300 hover:bg-rose-50/40 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-bold text-slate-950">
                      {booking.guest?.username || "Guest"} at {booking.property?.title || "Listing"}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {formatBookingDate(booking.checkIn)} - {formatBookingDate(booking.checkOut)}
                    </p>
                  </div>
                  <div className="text-sm font-bold text-slate-950">
                    RM {booking.totalPrice}
                  </div>
                </button>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default HostingDashboard;
