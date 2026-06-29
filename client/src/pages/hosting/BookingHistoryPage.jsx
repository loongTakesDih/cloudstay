import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppHeader from "../../components/AppHeader";
import { getBookingRequests } from "../../api/api.js";
import { formatBookingDate, getStatusClasses, summarizeHosting } from "../../utils/hostingData.js";

function BookingHistoryPage() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);
      try {
        const data = await getBookingRequests();
        setRequests(data);
      } catch (error) {
        console.error("Failed to load booking history", error);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, []);

  const { bookingHistory, acceptedBookings, declinedBookings, pendingRequests } =
    summarizeHosting(requests, []);

  return (
    <div className="min-h-screen bg-[#fffaf7] text-slate-950">
      <AppHeader
        eyebrow="Hosting history"
        title="Booking History"
        subtitle="Review accepted, declined, and pending bookings across your listings."
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
        <section className="grid gap-5 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-rose-500">Accepted</p>
            <p className="mt-3 text-3xl font-bold text-slate-950">{acceptedBookings.length}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-rose-500">Declined</p>
            <p className="mt-3 text-3xl font-bold text-slate-950">{declinedBookings.length}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-rose-500">Pending</p>
            <p className="mt-3 text-3xl font-bold text-slate-950">{pendingRequests.length}</p>
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-950">Accepted and declined</h2>
          <div className="mt-6 space-y-4">
            {loading ? (
              <div className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500 text-center">
                Loading history...
              </div>
            ) : bookingHistory.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500 text-center">
                No accepted or declined bookings yet
              </div>
            ) : (
              bookingHistory.map((booking) => (
                <button
                  key={booking.id}
                  type="button"
                  onClick={() => navigate(`/hosting/requests/${booking.id}`)}
                  className="flex w-full flex-col gap-3 rounded-2xl border border-slate-200 p-4 text-left transition hover:border-rose-300 hover:bg-rose-50/40 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-bold text-slate-950">
                      {booking.guest?.username || "Guest"} at {booking.property?.title || "Listing"}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {formatBookingDate(booking.checkIn)} - {formatBookingDate(booking.checkOut)}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      RM {booking.totalPrice}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusClasses(booking.status)}`}>
                    {booking.status}
                  </span>
                </button>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default BookingHistoryPage;
