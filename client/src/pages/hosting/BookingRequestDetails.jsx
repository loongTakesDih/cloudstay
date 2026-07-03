import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getBookingById,
  getOrCreateConversation,
  updateBookingStatus,
} from "../../api/api.js";
import AppHeader from "../../components/AppHeader";
import { useAuth } from "../../context/useAuth";
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

function BookingRequestDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openingChat, setOpeningChat] = useState(false);

  useEffect(() => {
    if (user !== null && !user.isHost) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!id) return;
    getBookingById(id)
      .then((data) => setBooking(data))
      .catch((err) => console.error("Failed to fetch booking", err))
      .finally(() => setLoading(false));
  }, [id]);

  const handleStatusChange = async (status) => {
    try {
      await updateBookingStatus(id, status);
      const guestId = booking?.guest?.id ?? booking?.guest?.userId;
      if (guestId) {
        addNotification(guestId, {
          type: "booking-status",
          audience: "guest",
          direction: "outgoing",
          title: status === "Accepted" ? "Booking accepted" : status === "Completed" ? "Checkout completed" : "Booking declined",
          message:
            status === "Accepted"
              ? `${booking.property?.title || "Your stay"} has been accepted by the host.`
              : status === "Completed"
                ? `${booking.property?.title || "Your stay"} has been checked out successfully.`
                : `${booking.property?.title || "Your stay"} was declined by the host.`,
          bookingId: booking.id,
          propertyId: booking.property?.id ?? booking.propertyId,
          propertyTitle: booking.property?.title || "CloudStay stay",
          status,
          targetPath: `/trips/${booking.id}`,
        });
      }
      navigate("/hosting/dashboard");
    } catch (requestError) {
      alert(requestError.response?.data?.message || "Failed to update status.");
    }
  };

  const handleMessageGuest = async () => {
    setOpeningChat(true);

    try {
      const conversation = await getOrCreateConversation(booking.id);
      navigate(`/messages/${conversation.id}`);
    } catch (error) {
      alert(error?.response?.data?.message || "Failed to open the conversation.");
      setOpeningChat(false);
    }
  };

  if (loading) return <main className="p-8">Loading details...</main>;
  if (!booking) return <main className="p-8">Booking not found.</main>;

  const isPending = booking.status === "Pending";
  const isAccepted = booking.status === "Accepted";
  const canCompleteCheckout =
    isAccepted && new Date(booking.checkOut).setHours(0, 0, 0, 0) <= new Date().setHours(0, 0, 0, 0);

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#fffaf7_0%,#fff1ec_52%,#f8fafc_100%)] text-slate-950">
      <AppHeader
        eyebrow={isPending ? "Review Request" : "Booking History"}
        title="Booking Details"
        actions={
          <button
            onClick={() => navigate("/hosting/dashboard")}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:border-slate-300"
          >
            Back to Dashboard
          </button>
        }
      />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <section className="rounded-3xl border border-white/80 bg-white/80 p-8 shadow-xl shadow-rose-100/50">
          <h2 className="text-2xl font-bold tracking-normal text-slate-950">
            Reservation for {booking.property?.title}
          </h2>
          <div className="mt-8 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase text-slate-500">Guest</p>
                <p className="mt-1 font-bold">{booking.guest?.username}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase text-slate-500">Total Price</p>
                <p className="mt-1 font-bold text-rose-600">RM {booking.totalPrice}</p>
              </div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-500">Booking Status</p>
              <p className="mt-1 font-bold">{booking.status}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-500">Stay Dates</p>
              <p className="mt-1 font-bold">
                {formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}
              </p>
            </div>
            <button
              type="button"
              onClick={handleMessageGuest}
              disabled={openingChat}
              className="w-full rounded-full bg-slate-950 py-3 font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {openingChat ? "Opening chat..." : "Message guest"}
            </button>
            {isPending ? (
              <div className="flex gap-4 pt-6">
                <button
                  onClick={() => handleStatusChange("Declined")}
                  className="w-full rounded-full border border-slate-200 py-3 font-bold text-slate-700 transition hover:bg-slate-100"
                >
                  Decline
                </button>
                <button
                  onClick={() => handleStatusChange("Accepted")}
                  className="w-full rounded-full bg-rose-500 py-3 font-bold text-white transition hover:bg-rose-600"
                >
                  Accept Booking
                </button>
              </div>
            ) : canCompleteCheckout ? (
              <div className="pt-6">
                <button
                  onClick={() => handleStatusChange("Completed")}
                  className="w-full rounded-full bg-emerald-600 py-3 font-bold text-white transition hover:bg-emerald-700"
                >
                  Confirm successful checkout
                </button>
                <p className="mt-3 text-center text-xs font-semibold text-slate-500">
                  This returns the property to the homepage for new reservations.
                </p>
              </div>
            ) : (
              <div className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-600">
                {isAccepted
                  ? `This stay is accepted. Checkout can be confirmed on ${formatDate(booking.checkOut)}.`
                  : `This booking is marked as ${booking.status.toLowerCase()} and is part of your booking history.`}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default BookingRequestDetails;
