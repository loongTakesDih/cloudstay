const REVERSE_GEOCODER_URL =
  import.meta.env.VITE_REVERSE_GEOCODER_URL ||
  "https://nominatim.openstreetmap.org/reverse";

const SEARCH_GEOCODER_URL =
  import.meta.env.VITE_SEARCH_GEOCODER_URL ||
  REVERSE_GEOCODER_URL.replace(/\/reverse\/?$/, "/search");

const cityFields = [
  "city",
  "town",
  "village",
  "municipality",
  "city_district",
  "suburb",
  "neighbourhood",
];

const streetFields = [
  "road",
  "pedestrian",
  "footway",
  "residential",
  "neighbourhood",
  "suburb",
  "quarter",
];

const getAddressValue = (address, fields) =>
  fields.map((field) => address?.[field]).find(Boolean) || "";

const getDisplayParts = (result) =>
  String(result?.display_name || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

const malaysiaStates = new Set([
  "johor",
  "kedah",
  "kelantan",
  "kuala lumpur",
  "labuan",
  "melaka",
  "malacca",
  "negeri sembilan",
  "pahang",
  "penang",
  "perak",
  "perlis",
  "putrajaya",
  "sabah",
  "sarawak",
  "selangor",
  "terengganu",
]);

const normalizeText = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

const isMalaysiaState = (value) => malaysiaStates.has(normalizeText(value));

const cleanAdminLabel = (value) =>
  String(value || "")
    .replace(/\s+district$/i, "")
    .replace(/\s+division$/i, "")
    .trim();

const getMalaysiaState = (address) => {
  const stateCandidates = [
    address?.state,
    address?.region,
    address?.state_district,
    address?.county,
  ];

  return (
    stateCandidates.find((candidate) => isMalaysiaState(candidate)) ||
    address?.state ||
    address?.region ||
    ""
  );
};

const getMalaysiaCity = (address, state) => {
  const directCity = getAddressValue(address, cityFields);

  if (directCity && normalizeText(directCity) !== normalizeText(state)) {
    return directCity;
  }

  const fallbackCity = [address?.district, address?.county, address?.state_district]
    .map(cleanAdminLabel)
    .find(
      (candidate) =>
        candidate &&
        normalizeText(candidate) !== normalizeText(state) &&
        !isMalaysiaState(candidate),
    );

  return directCity || fallbackCity || "";
};

const getMalaysiaPostcode = (postcode) => {
  const value = String(postcode || "").trim();
  const match = value.match(/\b\d{5}\b/);
  return match ? match[0] : value;
};

const findPostcodeFromParts = (parts) =>
  parts.find((part) => /\b\d{5}\b/.test(part))?.match(/\b\d{5}\b/)?.[0] || "";

const findStateFromParts = (parts) =>
  parts.find((part) => isMalaysiaState(part)) || "";

const findCityFromParts = (parts, state, postcode) => {
  const stateIndex = parts.findIndex(
    (part) => normalizeText(part) === normalizeText(state),
  );
  const postcodeIndex = parts.findIndex((part) => part.includes(postcode));
  const stopIndex =
    stateIndex >= 0 ? stateIndex : postcodeIndex >= 0 ? postcodeIndex : parts.length;

  for (let index = stopIndex - 1; index >= 0; index -= 1) {
    const candidate = parts[index];

    if (
      candidate &&
      !isMalaysiaState(candidate) &&
      normalizeText(candidate) !== normalizeText(state) &&
      !/\b\d{5}\b/.test(candidate)
    ) {
      return candidate;
    }
  }

  return "";
};

const deriveAddressLine = (
  result,
  parsedCity,
  parsedState,
  parsedPostcode,
  displayParts,
) => {
  const address = result?.address || {};
  const street = getAddressValue(address, streetFields);
  const houseNumber = address.house_number || "";
  const namedPlace = result?.name && result.name !== parsedCity ? result.name : "";
  const streetLine = [houseNumber, street].filter(Boolean).join(" ");

  const stopValues = new Set(
    [parsedCity, parsedState, parsedPostcode, address.country]
      .filter(Boolean)
      .map((item) => item.toLowerCase()),
  );
  const leadingParts = [];

  for (const part of displayParts) {
    if (stopValues.has(part.toLowerCase())) break;
    leadingParts.push(part);
    if (leadingParts.length >= 2) break;
  }

  const displayStreetLine = leadingParts.join(", ");

  if (displayStreetLine) return displayStreetLine;
  if (streetLine) return streetLine;
  if (namedPlace) return namedPlace;

  return "";
};

export const parseOsmLocation = (result) => {
  const address = result?.address || {};
  const displayParts = getDisplayParts(result);
  const postalCode =
    getMalaysiaPostcode(address.postcode) || findPostcodeFromParts(displayParts);
  const stateFromFields = getMalaysiaState(address);
  const stateFromParts = findStateFromParts(displayParts);
  const state = isMalaysiaState(stateFromFields)
    ? stateFromFields
    : stateFromParts || stateFromFields;
  const cityFromParts = findCityFromParts(displayParts, state, postalCode);
  const cityFromFields = getMalaysiaCity(address, state);
  const city =
    cityFromParts ||
    (normalizeText(cityFromFields) !== normalizeText(state) ? cityFromFields : "");
  const country = address.country || "Malaysia";
  const addressLine = deriveAddressLine(
    result,
    city,
    state,
    postalCode,
    displayParts,
  );

  return {
    address: result?.display_name || "",
    addressLine,
    city,
    state,
    postalCode,
    country,
    latitude: result?.lat !== undefined ? Number(result.lat) : null,
    longitude: result?.lon !== undefined ? Number(result.lon) : null,
  };
};

export const searchLocationSuggestions = async (
  query,
  { city, state, country = "Malaysia", signal } = {},
) => {
  const cleanQuery = String(query || "").trim();

  if (cleanQuery.length < 3) {
    return [];
  }

  const fullQuery = [cleanQuery, city, state, country]
    .filter(Boolean)
    .join(", ");
  const params = new URLSearchParams({
    format: "jsonv2",
    q: fullQuery,
    addressdetails: "1",
    limit: "5",
    "accept-language": "en",
  });

  if (String(country || "").toLowerCase() === "malaysia") {
    params.set("countrycodes", "my");
  }

  const response = await fetch(`${SEARCH_GEOCODER_URL}?${params}`, {
    headers: { Accept: "application/json" },
    signal,
  });

  if (!response.ok) {
    throw new Error("Address search failed");
  }

  return response.json();
};
