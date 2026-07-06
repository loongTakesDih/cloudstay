import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  checkoutBooking,
  getMyTrips,
  getOrCreateConversation,
} from "../../api/api.js";
import AppHeader from "../../components/AppHeader";
import ReviewForm from "../../components/ReviewForm";
import { addNotification } from "../../utils/localState.js";

const formatDate = (value) => {
  if (!value) return "Not set";
  const date = new Date(value);
  return new Intl.DateTimeFormat("en-MY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const getStatusClasses = (status) => {
  switch (status) {
    case "Accepted":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
    case "Pending":
      return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
    case "Declined":
      return "bg-rose-50 text-rose-700 ring-1 ring-rose-200";
    case "Completed":
      return "bg-sky-50 text-sky-700 ring-1 ring-sky-200";
    case "CheckedOut":
      return "bg-violet-50 text-violet-700 ring-1 ring-violet-200";
    default:
      return "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
  }
};

function BookingDetails() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openingChat, setOpeningChat] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [chatError, setChatError] = useState("");

  const fetchBooking = useCallback(async () => {
    try {
      const trips = await getMyTrips();
      const found = trips.find((t) => t.id === parseInt(bookingId, 10));
      setBooking(found ?? null);
    } catch (error) {
      console.error("Failed to load booking details", error);
      setBooking(null);
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    const initialLoadId = window.setTimeout(fetchBooking, 0);
    return () => window.clearTimeout(initialLoadId);
  }, [fetchBooking]);

  useEffect(() => {
    const refresh = (event) => {
      if (
        event.detail?.entity === "booking" &&
        (!event.detail?.bookingId ||
          Number(event.detail.bookingId) === Number(bookingId))
      ) {
        fetchBooking();
      }
    };
    window.addEventListener("cloudstay:data-changed", refresh);
    return () => window.removeEventListener("cloudstay:data-changed", refresh);
  }, [bookingId, fetchBooking]);

  const handleMessageHost = async () => {
    setOpeningChat(true);
    setChatError("");

    try {
      const conversation = await getOrCreateConversation(booking.id);
      navigate(`/messages/${conversation.id}`);
    } catch (error) {
      setChatError(
        error?.response?.data?.message || "Could not open the conversation.",
      );
      setOpeningChat(false);
    }
  };

  const handleCheckout = async () => {
    if (!window.confirm("Check out now? The host will need to inspect and relist the property before it becomes available again.")) {
      return;
    }

    setCheckingOut(true);
    setCheckoutError("");
    try {
      const result = await checkoutBooking(booking.id);
      setBooking((current) => ({ ...current, status: result.status }));

      const hostId = booking.property?.hostId;
      if (hostId) {
        addNotification(hostId, {
          eventId: `host-booking-${booking.id}-CheckedOut`,
          type: "booking-status",
          audience: "host",
          direction: "incoming",
          title: "Guest checked out",
          message: `${booking.property?.title || "Your property"} is ready for inspection and preparation.`,
          bookingId: booking.id,
          propertyId: booking.propertyId,
          propertyTitle: booking.property?.title || "CloudStay property",
          status: "CheckedOut",
          targetPath: "/hosting/dashboard?tab=listings",
        });
      }
    } catch (error) {
      setCheckoutError(error?.response?.data?.message || "Could not check out right now.");
    } finally {
      setCheckingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[linear-gradient(135deg,#fffaf7_0%,#fff1ec_52%,#f8fafc_100%)] text-slate-950">
        <AppHeader
          eyebrow="Your Trip"
          title="Booking Details"
          subtitle="Review the stay details while your plans come together."
          actions={
            <button
              onClick={() => navigate("/dashboard")}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:border-slate-300"
            >
              Back to Dashboard
            </button>
          }
        />
        <main className="mx-auto max-w-4xl px-4 py-8">
          <section className="rounded-3xl border border-white/80 bg-white/80 p-8 shadow-xl shadow-rose-100/50">
            <p className="text-sm font-semibold text-slate-500">Loading booking details...</p>
          </section>
        </main>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-[linear-gradient(135deg,#fffaf7_0%,#fff1ec_52%,#f8fafc_100%)] text-slate-950">
        <AppHeader
          eyebrow="Your Trip"
          title="Booking Details"
          subtitle="Review the stay details while your plans come together."
          actions={
            <button
              onClick={() => navigate("/dashboard")}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:border-slate-300"
            >
              Back to Dashboard
            </button>
          }
        />
        <main className="mx-auto max-w-4xl px-4 py-8">
          <section className="rounded-3xl border border-white/80 bg-white/80 p-8 shadow-xl shadow-rose-100/50">
            <p className="text-sm font-semibold text-slate-500">Booking not found.</p>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#fffaf7_0%,#fff1ec_52%,#f8fafc_100%)] text-slate-950">
      <AppHeader
        eyebrow="Your Trip"
        title="Booking Details"
        subtitle="Review the stay details while your plans come together."
        actions={
          <button
            onClick={() => navigate("/dashboard")}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:border-slate-300"
          >
            Back to Dashboard
          </button>
        }
      />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <section className="rounded-3xl border border-white/80 bg-white/80 p-8 shadow-xl shadow-rose-100/50">
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-normal text-slate-950">
                {booking.property?.title || "CloudStay Property"}
              </h2>
              <p className="mt-2 text-sm font-medium text-slate-500">
                {booking.property?.location || "Location not available"}
              </p>
            </div>
            <span className={`inline-flex rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide ${getStatusClasses(booking.status)}`}>
              {booking.status || "Confirmed"}
            </span>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Check-in
              </p>
              <p className="mt-2 text-lg font-bold text-slate-950">
                {formatDate(booking.checkIn)}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Check-out
              </p>
              <p className="mt-2 text-lg font-bold text-slate-950">
                {formatDate(booking.checkOut)}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Total price
              </p>
              <p className="mt-2 text-lg font-bold text-rose-600">
                RM {booking.totalPrice}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Booking reference
              </p>
              <p className="mt-2 text-lg font-bold text-slate-950">
                #{booking.id}
              </p>
            </div>
          </div>

          {booking.status === "Pending" && booking.paymentStatus === "Paid" && (
            <p className="mt-6 rounded-2xl bg-amber-50 p-4 text-sm font-bold text-amber-800">
              Payment completed. This booking is waiting for host approval.
            </p>
          )}
          {booking.status === "Accepted" && booking.paymentStatus === "Paid" && (
            <p className="mt-6 rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-800">
              Booking accepted. Your payment is complete and these dates are confirmed.
            </p>
          )}
          {booking.status === "Declined" && booking.paymentStatus === "Refunded" && (
            <p className="mt-6 rounded-2xl bg-rose-50 p-4 text-sm font-bold text-rose-800">
              Booking declined. Your Stripe payment has been refunded.
            </p>
          )}

          <div className="mt-8 border-t border-slate-200 pt-6">
            {(chatError || checkoutError) && (
              <p role="alert" className="mb-3 text-sm font-semibold text-rose-600">
                {chatError || checkoutError}
              </p>
            )}
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleMessageHost}
                disabled={openingChat}
                className="rounded-xl bg-rose-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {openingChat ? "Opening chat..." : "Message host"}
              </button>
              {booking.status === "Accepted" && (
                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={checkingOut}
                  className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {checkingOut ? "Checking out..." : "Check out now"}
                </button>
              )}
            </div>
            {booking.status === "CheckedOut" && (
              <p className="mt-4 rounded-2xl bg-violet-50 p-4 text-sm font-semibold text-violet-800">
                You are checked out. This listing will stay offline until the host has inspected, prepared, and relisted it.
              </p>
            )}
          </div>

          {["Accepted", "CheckedOut", "Completed"].includes(booking.status) && (
            <ReviewForm bookingId={booking.id} />
          )}
        </section>
      </main>
    </div>
  );
}

export default BookingDetails;
