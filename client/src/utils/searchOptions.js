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

const postcodeStateRanges = {
  johor: [[79, 86]],
  kedah: [[5, 9]],
  kelantan: [[15, 18]],
  "kuala lumpur": [[50, 60]],
  labuan: [[87, 87]],
  melaka: [[75, 78]],
  "negeri sembilan": [[70, 73]],
  pahang: [[25, 28], [39, 39], [49, 49], [69, 69]],
  penang: [[10, 14]],
  perak: [[30, 36]],
  perlis: [[1, 2]],
  putrajaya: [[62, 62]],
  sabah: [[88, 91]],
  sarawak: [[93, 98]],
  selangor: [[40, 48], [63, 64], [68, 68]],
  terengganu: [[20, 24]],
};

const normalizeStateName = (state) =>
  state.trim().toLowerCase().replace(/\s+/g, " ");

export const validateMalaysiaPostalCode = (postalCode, state) => {
  const cleanPostalCode = String(postalCode || "").trim();
  const cleanState = String(state || "").trim();

  if (!cleanPostalCode) {
    return "";
  }

  if (!/^\d{5}$/.test(cleanPostalCode)) {
    return "Postal code must be exactly 5 digits.";
  }

  if (!cleanState) {
    return "";
  }

  const ranges = postcodeStateRanges[normalizeStateName(cleanState)];

  if (!ranges) {
    return "";
  }

  const prefix = Number(cleanPostalCode.slice(0, 2));
  const matchesState = ranges.some(
    ([start, end]) => prefix >= start && prefix <= end,
  );

  return matchesState
    ? ""
    : `Postal code does not match ${cleanState}.`;
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
