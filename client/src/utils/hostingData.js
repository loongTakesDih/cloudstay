export const formatBookingDate = (value) => {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en-MY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
};

export const normalizeBookingStatus = (status) =>
  String(status || "Pending").trim().toLowerCase();

export const getStatusClasses = (status) => {
  switch (normalizeBookingStatus(status)) {
    case "accepted":
      return "bg-emerald-50 text-emerald-700";
    case "declined":
      return "bg-rose-50 text-rose-700";
    default:
      return "bg-amber-50 text-amber-700";
  }
};

export const summarizeHosting = (requests, listings) => {
  const pendingRequests = requests.filter(
    (request) => normalizeBookingStatus(request.status) === "pending",
  );
  const bookingHistory = requests.filter(
    (request) => normalizeBookingStatus(request.status) !== "pending",
  );
  const acceptedBookings = requests.filter(
    (request) => normalizeBookingStatus(request.status) === "accepted",
  );
  const declinedBookings = requests.filter(
    (request) => normalizeBookingStatus(request.status) === "declined",
  );
  const listedPlaces = listings.filter((listing) => listing.isListed);
  const availablePlaces = listings.filter((listing) => listing.isListed && listing.isAvailable);
  const totalEarnings = acceptedBookings.reduce(
    (total, booking) => total + Number(booking.totalPrice || 0),
    0,
  );

  return {
    pendingRequests,
    bookingHistory,
    acceptedBookings,
    declinedBookings,
    listedPlaces,
    availablePlaces,
    totalEarnings,
  };
};
