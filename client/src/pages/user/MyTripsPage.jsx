import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppHeader from "../../components/AppHeader";
import {
  createBookingPaymentSession,
  getMyTrips,
} from "../../api/api.js";

const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat("en-MY", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(new Date(value))
    : "Not set";

function MyTripsPage() {
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payingBookingId, setPayingBookingId] = useState(null);

  const loadTrips = useCallback(async () => {
    try {
      setTrips(await getMyTrips());
      setError("");
    } catch (requestError) {
      console.error("Failed to load trips", requestError);
      setError("We could not load your trips right now.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialLoadId = window.setTimeout(loadTrips, 0);
    return () => window.clearTimeout(initialLoadId);
  }, [loadTrips]);

  useEffect(() => {
    const refresh = (event) => {
      if (event.detail?.entity === "booking") loadTrips();
    };
    window.addEventListener("cloudstay:data-changed", refresh);
    return () => window.removeEventListener("cloudstay:data-changed", refresh);
  }, [loadTrips]);

  const handlePayNow = async (bookingId) => {
    setPayingBookingId(bookingId);
    setError("");

    try {
      const paymentSession = await createBookingPaymentSession(bookingId);

      if (!paymentSession.checkoutUrl) {
        throw new Error("The payment session did not include a checkout URL.");
      }

      window.location.href = paymentSession.checkoutUrl;
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          "We could not start payment. Please try again.",
      );
      setPayingBookingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#fffaf7] text-slate-950">
      <AppHeader />
      <main className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6 lg:px-10">
        <p className="text-sm font-bold uppercase tracking-wider text-rose-500">Travel</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight">My trips</h1>
        <p className="mt-3 text-slate-600">Review upcoming, pending, and previous stays.</p>

        {error && <div className="mt-8 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}

        {loading ? (
          <p className="mt-10 text-slate-500">Loading your trips...</p>
        ) : trips.length === 0 ? (
          <section className="mt-10 rounded-[2rem] border border-dashed border-slate-300 bg-white p-12 text-center">
            <h2 className="text-2xl font-bold">No trips booked yet</h2>
            <p className="mt-2 text-slate-500">Your CloudStay journeys will appear here.</p>
            <button type="button" onClick={() => navigate("/")} className="mt-6 rounded-full bg-slate-950 px-6 py-3 text-sm font-bold text-white">
              Explore stays
            </button>
          </section>
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {trips.map((trip) => {
              const isPaid = trip.paymentStatus === "Paid";
              const isRefunded = trip.paymentStatus === "Refunded";
              const canPay =
                ["Pending", "Accepted"].includes(trip.status) &&
                !isPaid &&
                !isRefunded;
              const isStartingPayment = payingBookingId === trip.id;

              return (
                <article
                  key={trip.id}
                  className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <button
                    type="button"
                    onClick={() => navigate(`/trips/${trip.id}`)}
                    className="block w-full text-left"
                  >
                    <div className="h-44 bg-gradient-to-br from-slate-200 to-rose-100">
                      {trip.property?.imageUrl && <img src={trip.property.imageUrl} alt="" className="h-full w-full object-cover" />}
                    </div>
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <h2 className="truncate text-xl font-bold">{trip.property?.title || "CloudStay property"}</h2>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold uppercase text-slate-600">{trip.status || "Pending"}</span>
                      </div>
                      <p className="mt-2 truncate text-sm text-slate-500">{trip.property?.location || "Location unavailable"}</p>
                      <p className="mt-5 text-sm font-semibold text-slate-700">{formatDate(trip.checkIn)} – {formatDate(trip.checkOut)}</p>
                    </div>
                  </button>

                  {(isPaid || isRefunded || canPay) && (
                    <div className="border-t border-slate-100 p-5">
                      {isRefunded ? (
                        <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
                          Booking declined · Payment refunded
                        </p>
                      ) : isPaid ? (
                        <p className={`rounded-2xl px-4 py-3 text-sm font-bold ${
                          trip.status === "Pending"
                            ? "bg-amber-50 text-amber-800"
                            : "bg-emerald-50 text-emerald-700"
                        }`}>
                          {trip.status === "Pending"
                            ? "Payment completed · Waiting for host approval"
                            : "Paid · Booking accepted"}
                        </p>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handlePayNow(trip.id)}
                          disabled={isStartingPayment}
                          className="rounded-full bg-rose-500 px-5 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isStartingPayment ? "Starting payment..." : "Pay Now"}
                        </button>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default MyTripsPage;
