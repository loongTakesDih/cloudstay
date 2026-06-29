import { useState } from "react";
import { createBookingRequest } from "../api/api.js";

export default function ReviewBookingModal({ listing, checkIn, checkOut, guests, onClose, onSuccess }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate total nights and price
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  const totalPrice = nights * listing.pricePerNight;

const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      // 1. Updated payload to match C# DTO perfectly
      await createBookingRequest({
        propertyId: listing.id,
        checkIn: checkIn,   // Changed from checkInDate
        checkOut: checkOut  // Changed from checkOutDate
        // guestCount removed since your DB schema doesn't have it yet
      });
      onSuccess();
    } catch (error) {
      console.error("Booking failed", error.response?.data || error);
      // 2. Safely grab the error message from the C# controller
      const errorMessage = error.response?.data?.message || "Failed to send booking request. Please try again.";
      alert(errorMessage);
      setIsSubmitting(false);
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <h2 className="text-2xl font-bold text-slate-950">Review Reservation</h2>
        
        <div className="mt-6 space-y-4 rounded-2xl bg-slate-50 p-4 border border-slate-100">
          <div className="flex justify-between border-b border-slate-200 pb-4">
            <div>
              <p className="text-xs font-bold uppercase text-slate-500">Check-in</p>
              <p className="font-semibold text-slate-900">{checkIn}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold uppercase text-slate-500">Checkout</p>
              <p className="font-semibold text-slate-900">{checkOut}</p>
            </div>
          </div>
          
          <div className="flex justify-between pb-2">
            <p className="font-semibold text-slate-700">Guests</p>
            <p className="font-bold text-slate-900">{guests}</p>
          </div>
          
          <div className="flex justify-between pb-2">
            <p className="font-semibold text-slate-700">RM {listing.pricePerNight} x {nights} nights</p>
            <p className="font-bold text-slate-900">RM {totalPrice}</p>
          </div>
          
          <div className="flex justify-between border-t border-slate-200 pt-4 text-lg">
            <p className="font-bold text-slate-900">Total</p>
            <p className="font-bold text-rose-600">RM {totalPrice}</p>
          </div>
        </div>

        <p className="mt-4 text-center text-xs font-semibold text-slate-500">
          You won't be charged yet. The host has 24 hours to accept or decline.
        </p>

        <div className="mt-6 flex gap-3">
          <button 
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full rounded-full border border-slate-200 py-3 font-bold text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button 
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="w-full rounded-full bg-rose-500 py-3 font-bold text-white transition hover:bg-rose-600 disabled:bg-slate-300"
          >
            {isSubmitting ? "Sending..." : "Confirm Request"}
          </button>
        </div>
      </div>
    </div>
  );
}