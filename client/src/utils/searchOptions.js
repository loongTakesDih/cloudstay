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

export const popularCityLocations = {
  "Kuala Lumpur": {
    state: "Kuala Lumpur",
    country: "Malaysia",
    latitude: 3.139,
    longitude: 101.6869,
  },
  "George Town": {
    state: "Penang",
    country: "Malaysia",
    latitude: 5.4141,
    longitude: 100.3288,
  },
  "Johor Bahru": {
    state: "Johor",
    country: "Malaysia",
    latitude: 1.4927,
    longitude: 103.7414,
  },
  Melaka: {
    state: "Melaka",
    country: "Malaysia",
    latitude: 2.1896,
    longitude: 102.2501,
  },
  "Kota Kinabalu": {
    state: "Sabah",
    country: "Malaysia",
    latitude: 5.9804,
    longitude: 116.0735,
  },
  Kuching: {
    state: "Sarawak",
    country: "Malaysia",
    latitude: 1.5533,
    longitude: 110.3592,
  },
  Ipoh: {
    state: "Perak",
    country: "Malaysia",
    latitude: 4.5975,
    longitude: 101.0901,
  },
  Langkawi: {
    state: "Kedah",
    country: "Malaysia",
    latitude: 6.35,
    longitude: 99.8,
  },
};

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
