import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getBookingById, updateBookingStatus } from "../../api/api.js";
import AppHeader from "../../components/AppHeader";
import { useAuth } from "../../context/useAuth";

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
  const { user } = useAuth(); // DEFINED HERE
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  // Use the 'user' variable safely inside this useEffect
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
      navigate("/hosting/dashboard");
    } catch (err) {
      alert("Failed to update status.");
    }
  };

  if (loading) return <main className="p-8">Loading details...</main>;
  if (!booking) return <main className="p-8">Booking not found.</main>;

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#fffaf7_0%,#fff1ec_52%,#f8fafc_100%)] text-slate-950">
      <AppHeader
        eyebrow="Review Request"
        title="Booking Details"
        actions={
          <button onClick={() => navigate("/hosting/dashboard")} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:border-slate-300">
            Back to Dashboard
          </button>
        }
      />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <section className="rounded-3xl border border-white/80 bg-white/80 p-8 shadow-xl shadow-rose-100/50">
          <h2 className="text-2xl font-bold tracking-normal text-slate-950">Reservation for {booking.property?.title}</h2>
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
              <p className="text-xs font-bold uppercase text-slate-500">Stay Dates</p>
              <p className="mt-1 font-bold">{formatDate(booking.checkIn)} — {formatDate(booking.checkOut)}</p>
            </div>
            <div className="flex gap-4 pt-6">
              <button onClick={() => handleStatusChange("Declined")} className="w-full rounded-full border border-slate-200 py-3 font-bold text-slate-700 transition hover:bg-slate-100">Decline</button>
              <button onClick={() => handleStatusChange("Accepted")} className="w-full rounded-full bg-rose-500 py-3 font-bold text-white transition hover:bg-rose-600">Accept Booking</button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default BookingRequestDetails;