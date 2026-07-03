export const popularCities = [
  "Kuala Lumpur",
  "George Town",
  "Johor Bahru",
  "Melaka",
  "Kota Kinabalu",
  "Kuching",
  "Ipoh",
  "Langkawi",
];

export const emptyGuestSelection = {
  adults: 0,
  children: 0,
  infants: 0,
};

export const getGuestTotal = (guests) =>
  Number(guests.adults || 0) + Number(guests.children || 0);

export const formatGuests = (guests, emptyLabel = "Add guests") => {
  const total = getGuestTotal(guests);
  const infants = Number(guests.infants || 0);

  if (total === 0 && infants === 0) return emptyLabel;

  const parts = [];
  if (total > 0) parts.push(`${total} guest${total === 1 ? "" : "s"}`);
  if (infants > 0) parts.push(`${infants} infant${infants === 1 ? "" : "s"}`);
  return parts.join(", ");
};
