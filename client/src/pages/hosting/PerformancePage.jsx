import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppHeader from "../../components/AppHeader";
import { getBookingRequests, getMyListings } from "../../api/api.js";
import { summarizeHosting } from "../../utils/hostingData.js";

function PerformancePage() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPerformance = async () => {
      setLoading(true);
      try {
        const [bookingData, listingData] = await Promise.all([
          getBookingRequests(),
          getMyListings(),
        ]);

        setRequests(bookingData);
        setListings(listingData);
      } catch (error) {
        console.error("Failed to load hosting performance", error);
      } finally {
        setLoading(false);
      }
    };

    loadPerformance();
  }, []);

  const {
    acceptedBookings,
    declinedBookings,
    pendingRequests,
    listedPlaces,
    availablePlaces,
    totalEarnings,
  } = summarizeHosting(requests, listings);

  const occupancySignal =
    listedPlaces.length === 0
      ? "0%"
      : `${Math.round((acceptedBookings.length / listedPlaces.length) * 100)}%`;

  return (
    <div className="min-h-screen bg-[#fffaf7] text-slate-950">
      <AppHeader
        eyebrow="Hosting performance"
        title="Performance"
        subtitle="Track earnings, booking outcomes, and listing availability."
        actions={
          <button
            onClick={() => navigate("/hosting/dashboard")}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
          >
            Back to Dashboard
          </button>
        }
      />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-rose-500">Earnings</p>
            <p className="mt-3 text-3xl font-bold text-slate-950">RM {totalEarnings.toFixed(2)}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-rose-500">Accepted bookings</p>
            <p className="mt-3 text-3xl font-bold text-slate-950">{acceptedBookings.length}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-rose-500">Listed places</p>
            <p className="mt-3 text-3xl font-bold text-slate-950">{listedPlaces.length}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-rose-500">Occupancy signal</p>
            <p className="mt-3 text-3xl font-bold text-slate-950">{occupancySignal}</p>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-950">Booking outcomes</h2>
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-500">Accepted</p>
                <p className="mt-2 text-2xl font-bold text-slate-950">{acceptedBookings.length}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-500">Declined</p>
                <p className="mt-2 text-2xl font-bold text-slate-950">{declinedBookings.length}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-500">Pending</p>
                <p className="mt-2 text-2xl font-bold text-slate-950">{pendingRequests.length}</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-950">Listing monitoring</h2>
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-500">Total listings</p>
                <p className="mt-2 text-2xl font-bold text-slate-950">{listings.length}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-500">Currently listed</p>
                <p className="mt-2 text-2xl font-bold text-slate-950">{listedPlaces.length}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-500">Currently available</p>
                <p className="mt-2 text-2xl font-bold text-slate-950">{availablePlaces.length}</p>
              </div>
            </div>
          </div>
        </section>

        {loading && (
          <div className="mt-8 rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500 text-center">
            Loading performance data...
          </div>
        )}
      </main>
    </div>
  );
}

export default PerformancePage;
