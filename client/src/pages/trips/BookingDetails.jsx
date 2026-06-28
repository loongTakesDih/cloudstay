import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getMyTrips } from "../../api/api"; // Reuse this to find the specific booking

function BookingDetails() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch all trips and find the one that matches the bookingId
    getMyTrips().then((trips) => {
      const found = trips.find((t) => t.id === parseInt(bookingId));
      setBooking(found);
      setLoading(false);
    });
  }, [bookingId]);

  if (loading) return <div>Loading booking details...</div>;
  if (!booking) return <div>Booking not found.</div>;

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white rounded-3xl shadow-lg mt-10">
      <h1 className="text-3xl font-bold">Booking Details</h1>
      <div className="mt-6 border-t pt-6 space-y-4">
        <p className="text-lg font-bold">{booking.property?.title}</p>
        <p className="text-slate-600">
          Check-in: {new Date(booking.checkIn).toLocaleDateString()}
        </p>
        <p className="text-slate-600">
          Checkout: {new Date(booking.checkOut).toLocaleDateString()}
        </p>
        <p className="text-xl font-bold text-rose-600">Total: RM {booking.totalPrice}</p>
        <p className="uppercase font-bold text-emerald-600">{booking.status}</p>
      </div>
      <button 
        onClick={() => navigate("/dashboard")}
        className="mt-8 bg-slate-950 text-white px-6 py-2 rounded-full"
      >
        Back to Dashboard
      </button>
    </div>
  );
}

export default BookingDetails;