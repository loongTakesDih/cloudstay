import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  deleteListing,
  getBookingRequests,
  getMyListings,
  getProperty,
  publishListing,
  unpublishListing,
  updateListing,
} from "../../api/api.js";
import AppHeader from "../../components/AppHeader";
import { MapPicker } from "../../components/PropertyMap";
import {
  formatBookingDate,
  getStatusClasses,
  normalizeBookingStatus,
} from "../../utils/hostingData.js";
import { popularCities } from "../../utils/searchOptions.js";

const workspaceTabs = ["bookings", "listings", "calendar"];
const propertyCategories = [
  "Apartment", "House", "Condominium", "Villa", "Studio", "Townhouse",
  "Cabin", "Guesthouse", "Unique Stay", "Other",
];
const placeTypes = ["Entire place", "A room", "Shared room"];
const cancellationTypes = ["Flexible", "Moderate", "Strict"];
const amenityGroups = [
  {
    id: "unitFeatures",
    label: "Unit features",
    options: ["Wi-Fi", "TV", "Air conditioning", "Kitchen", "Washing machine", "Workspace", "Balcony", "Heating", "Free parking", "Private entrance"],
  },
  {
    id: "propertyFacilities",
    label: "Facilities and entertainment",
    options: ["Swimming pool", "Gym", "BBQ area", "Garden", "Fire pit", "Snooker table", "Cinema room", "Rooftop area", "Lounge", "Playground"],
  },
  {
    id: "safetyFeatures",
    label: "Safety features",
    options: ["CCTV", "Smoke alarm", "Fire extinguisher", "First aid kit", "Carbon monoxide alarm", "Smart lock", "Security guard", "Emergency exit", "Lock on bedroom door"],
  },
];

const splitValues = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return value.split(",").map((item) => item.trim()).filter(Boolean);
};

const toDateValue = (value) => value ? String(value).slice(0, 10) : "";
const localToday = () => {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
};

const buildEditForm = (listing) => ({
  title: listing.title || "",
  description: listing.description || "",
  pricePerNight: listing.pricePerNight || 1,
  propertyCategory: listing.propertyCategory || "Other",
  placeType: listing.placeType || "Entire place",
  addressLine: listing.addressLine || "",
  city: listing.city || "",
  state: listing.state || "",
  postalCode: listing.postalCode || "",
  country: listing.country || "",
  legacyAddress: listing.address || listing.location || "",
  latitude: listing.latitude ?? null,
  longitude: listing.longitude ?? null,
  guestCount: listing.guestCount || 1,
  bedroomCount: listing.bedroomCount || 0,
  bedCount: listing.bedCount || 0,
  bathroomCount: listing.bathroomCount || 0,
  unitFeatures: splitValues(listing.unitFeatures),
  propertyFacilities: splitValues(listing.propertyFacilities),
  safetyFeatures: splitValues(listing.safetyFeatures),
  houseRulesCheckInTime: listing.houseRulesCheckInTime || "",
  houseRulesCheckoutTime: listing.houseRulesCheckoutTime || "",
  houseRulesPetsAllowed: listing.houseRulesPetsAllowed ?? null,
  houseRulesSmokingAllowed: listing.houseRulesSmokingAllowed ?? null,
  houseRulesPartiesAllowed: listing.houseRulesPartiesAllowed ?? null,
  houseRulesQuietHours: listing.houseRulesQuietHours || "",
  houseRulesNotes: listing.houseRulesNotes || "",
  safetySmokeAlarm: listing.safetySmokeAlarm ?? null,
  safetyCarbonMonoxideAlarm: listing.safetyCarbonMonoxideAlarm ?? null,
  safetySecurityCameras: listing.safetySecurityCameras ?? null,
  safetyPropertyWarnings: listing.safetyPropertyWarnings || "",
  safetyNotes: listing.safetyNotes || "",
  cancellationPolicyType: listing.cancellationPolicyType || "",
  cancellationFreeCancellationPeriod: listing.cancellationFreeCancellationPeriod || "",
  cancellationPartialRefundRule: listing.cancellationPartialRefundRule || "",
  cancellationNotes: listing.cancellationNotes || "",
  availableFrom: toDateValue(listing.availableFrom),
  availableTo: toDateValue(listing.availableTo),
  isAvailable: listing.isAvailable ?? true,
  imageUrls: listing.imageUrls?.length
    ? listing.imageUrls
    : listing.imageUrl
      ? [listing.imageUrl]
      : [],
});

function YesNoField({ label, value, onChange }) {
  return (
    <fieldset>
      <legend className="mb-2 block text-sm font-bold">{label}</legend>
      <div className="grid grid-cols-2 gap-2">
        {[
          [true, "Yes"],
          [false, "No"],
        ].map(([optionValue, optionLabel]) => (
          <button
            key={optionLabel}
            type="button"
            onClick={() => onChange(optionValue)}
            className={`rounded-2xl border px-4 py-3 text-sm font-bold ${
              value === optionValue
                ? "border-rose-500 bg-rose-50 text-rose-700"
                : "border-slate-200 text-slate-700"
            }`}
          >
            {optionLabel}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function EmptyState({ title, message }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
      <h3 className="text-xl font-bold text-slate-950">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{message}</p>
    </div>
  );
}

function EditorLoadingModal({ title }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl">
        <p className="text-sm font-bold text-slate-950">Loading listing details...</p>
        <p className="mt-2 text-sm text-slate-500">{title || "Preparing the editor."}</p>
      </div>
    </div>
  );
}

function BookingCard({ booking, onOpen }) {
  return (
    <button type="button" onClick={() => onOpen(booking)} className="flex w-full flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 text-left transition hover:border-slate-300 hover:shadow-md sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-bold text-slate-950">{booking.guest?.username || "Guest"}</p>
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${getStatusClasses(booking.status)}`}>{booking.status}</span>
          {booking.paymentStatus && (
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
              {booking.paymentStatus}
            </span>
          )}
        </div>
        <p className="mt-1 truncate text-sm font-semibold text-slate-700">{booking.property?.title || "Listing"}</p>
        <p className="mt-2 text-sm text-slate-500">{formatBookingDate(booking.checkIn)} – {formatBookingDate(booking.checkOut)}</p>
      </div>
      <div className="shrink-0 sm:text-right">
        <p className="font-bold text-slate-950">RM {booking.totalPrice}</p>
        <p className="mt-1 text-xs text-slate-500">{booking.adults + booking.children} guests{booking.infants ? `, ${booking.infants} infants` : ""}</p>
      </div>
    </button>
  );
}

function BookingsTab({ bookings, loading, onOpen, requestedView }) {
  const [view, setView] = useState(
    ["today", "upcoming", "history"].includes(requestedView) ? requestedView : "today",
  );
  const today = localToday();
  const visibleBookings = useMemo(() => {
    if (view === "history") {
      return bookings.filter((booking) => {
        const status = normalizeBookingStatus(booking.status);
        return status === "declined" || status === "completed" || status === "checkedout" || toDateValue(booking.checkOut) < today;
      });
    }

    return bookings.filter((booking) => {
      const status = normalizeBookingStatus(booking.status);
      if (status === "declined" || status === "completed" || status === "checkedout") return false;
      const checkIn = toDateValue(booking.checkIn);
      return view === "today" ? checkIn === today : checkIn > today;
    });
  }, [bookings, today, view]);

  return (
    <section>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bookings</h1>
          <p className="mt-2 text-sm text-slate-500">Manage reservation requests without mixing today’s arrivals with future stays.</p>
        </div>
        <button type="button" onClick={() => setView("history")} className={`text-sm font-bold underline underline-offset-4 ${view === "history" ? "text-rose-600" : "text-slate-700"}`}>
          Booking history
        </button>
      </div>

      <div className="mt-7 inline-flex rounded-full bg-slate-100 p-1">
        {["today", "upcoming"].map((item) => (
          <button key={item} type="button" onClick={() => setView(item)} className={`rounded-full px-5 py-2.5 text-sm font-bold capitalize transition ${view === item ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"}`}>
            {item}
          </button>
        ))}
      </div>

      <div className="mt-7 space-y-3">
        {loading ? (
          <p className="rounded-3xl bg-white p-8 text-sm text-slate-500">Loading bookings...</p>
        ) : visibleBookings.length === 0 ? (
          <EmptyState
            title={view === "today" ? "Nothing starting today" : view === "upcoming" ? "No upcoming bookings" : "No booking history yet"}
            message={view === "today" ? "Reservation requests and accepted stays that start today will appear here." : "Bookings will appear here when they match this section."}
          />
        ) : visibleBookings.map((booking) => <BookingCard key={booking.id} booking={booking} onOpen={onOpen} />)}
      </div>
    </section>
  );
}

function ListingEditorModal({ listing, onClose, onSaved }) {
  const [form, setForm] = useState(() => buildEditForm(listing));
  const [section, setSection] = useState("basics");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const toggleAmenity = (group, amenity) => {
    setForm((current) => ({
      ...current,
      [group]: current[group].includes(amenity)
        ? current[group].filter((item) => item !== amenity)
        : [...current[group], amenity],
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    const thingsToKnowComplete =
      form.houseRulesCheckInTime.trim() &&
      form.houseRulesCheckoutTime.trim() &&
      form.houseRulesPetsAllowed !== null &&
      form.houseRulesSmokingAllowed !== null &&
      form.houseRulesPartiesAllowed !== null &&
      form.safetySmokeAlarm !== null &&
      form.safetyCarbonMonoxideAlarm !== null &&
      form.safetySecurityCameras !== null &&
      form.cancellationPolicyType.trim() &&
      form.cancellationFreeCancellationPeriod.trim() &&
      form.cancellationPartialRefundRule.trim();

    if (!thingsToKnowComplete) {
      setSaving(false);
      setSection("things");
      setError("Complete Things to know before saving this listing.");
      return;
    }

    const {
      legacyAddress,
      ...editableFields
    } = form;
    const hasCompleteStructuredLocation =
      form.addressLine.trim() &&
      form.city.trim() &&
      form.state.trim() &&
      form.country.trim();
    const address = hasCompleteStructuredLocation
      ? [form.addressLine, form.city, form.postalCode, form.state, form.country].filter(Boolean).join(", ")
      : legacyAddress;
    const location = hasCompleteStructuredLocation
      ? [form.city, form.state, form.country].filter(Boolean).join(", ")
      : listing.location || legacyAddress;
    try {
      const updated = await updateListing(listing.id, {
        ...editableFields,
        address,
        location,
        pricePerNight: Number(form.pricePerNight),
        guestCount: Number(form.guestCount),
        bedroomCount: Number(form.bedroomCount),
        bedCount: Number(form.bedCount),
        bathroomCount: Number(form.bathroomCount),
      });
      onSaved(updated);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Could not save these changes.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="mx-auto my-6 w-full max-w-3xl overflow-hidden rounded-[2rem] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-xl font-bold">Edit listing</h2>
            <p className="mt-1 text-sm text-slate-500">Update one section at a time.</p>
          </div>
          <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 text-xl hover:bg-slate-50" aria-label="Close editor">×</button>
        </div>

        <div className="flex gap-1 overflow-x-auto border-b border-slate-200 px-4 py-3">
          {[
            ["basics", "Basics"],
            ["location", "Location"],
            ["details", "Details & amenities"],
            ["availability", "Availability & price"],
            ["things", "Things to know"],
          ].map(([id, label]) => (
            <button key={id} type="button" onClick={() => setSection(id)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${section === id ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-100"}`}>
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="max-h-[65vh] overflow-y-auto p-6">
            {section === "basics" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="sm:col-span-2"><span className="mb-2 block text-sm font-bold">Short title</span><input required value={form.title} onChange={(event) => update("title", event.target.value)} className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-rose-400" /></label>
                <label><span className="mb-2 block text-sm font-bold">Property category</span><select value={form.propertyCategory} onChange={(event) => update("propertyCategory", event.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3">{propertyCategories.map((item) => <option key={item}>{item}</option>)}</select></label>
                <label><span className="mb-2 block text-sm font-bold">Place type</span><select value={form.placeType} onChange={(event) => update("placeType", event.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3">{placeTypes.map((item) => <option key={item}>{item}</option>)}</select></label>
                {[["guestCount", "Guests", 1], ["bedroomCount", "Bedrooms", 0], ["bedCount", "Beds", 0], ["bathroomCount", "Bathrooms", 0]].map(([field, label, min]) => (
                  <label key={field}><span className="mb-2 block text-sm font-bold">{label}</span><input type="number" min={min} value={form[field]} onChange={(event) => update(field, event.target.value)} className="w-full rounded-2xl border border-slate-300 px-4 py-3" /></label>
                ))}
                <div className="sm:col-span-2 rounded-2xl border border-dashed border-slate-300 p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-bold">Photos</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        {form.imageUrls.length
                          ? `${form.imageUrls.length} existing photo${form.imageUrls.length === 1 ? "" : "s"} will be kept.`
                          : "No photos are attached to this listing yet."}
                      </p>
                    </div>
                    <button type="button" onClick={() => setError("Photo upload is not available yet.")} className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-bold">Add photos</button>
                  </div>
                  {form.imageUrls.length > 0 && (
                    <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                      {form.imageUrls.slice(0, 6).map((imageUrl, index) => (
                        <img
                          key={`${imageUrl}-${index}`}
                          src={imageUrl}
                          alt=""
                          className="h-20 w-28 shrink-0 rounded-2xl object-cover"
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {section === "location" && (
              <div className="grid gap-4 sm:grid-cols-2">
                {form.legacyAddress && !form.addressLine && (
                  <div className="rounded-2xl bg-sky-50 p-4 text-sm text-sky-800 sm:col-span-2">
                    <p className="font-bold">Legacy address currently in use</p>
                    <p className="mt-1">{form.legacyAddress}</p>
                    <p className="mt-2 text-xs font-semibold">Complete the fields below only when you want to upgrade this listing to the structured address format.</p>
                  </div>
                )}
                <label className="sm:col-span-2"><span className="mb-2 block text-sm font-bold">Unit and street address</span><input required={!form.legacyAddress} value={form.addressLine} onChange={(event) => update("addressLine", event.target.value)} className="w-full rounded-2xl border border-slate-300 px-4 py-3" /></label>
                <label><span className="mb-2 block text-sm font-bold">City</span><input required={!form.legacyAddress} list="hosting-cities" value={form.city} onChange={(event) => update("city", event.target.value)} className="w-full rounded-2xl border border-slate-300 px-4 py-3" /><datalist id="hosting-cities">{popularCities.map((city) => <option key={city} value={city} />)}</datalist></label>
                <label><span className="mb-2 block text-sm font-bold">State</span><input required={!form.legacyAddress} value={form.state} onChange={(event) => update("state", event.target.value)} className="w-full rounded-2xl border border-slate-300 px-4 py-3" /></label>
                <label><span className="mb-2 block text-sm font-bold">Postal code</span><input value={form.postalCode} onChange={(event) => update("postalCode", event.target.value)} className="w-full rounded-2xl border border-slate-300 px-4 py-3" /></label>
                <label><span className="mb-2 block text-sm font-bold">Country</span><input required={!form.legacyAddress} value={form.country} onChange={(event) => update("country", event.target.value)} className="w-full rounded-2xl border border-slate-300 px-4 py-3" /></label>
                <div className="sm:col-span-2">
                  <MapPicker
                    address={
                      [form.addressLine, form.city, form.postalCode, form.state, form.country]
                        .filter(Boolean)
                        .join(", ") || form.legacyAddress
                    }
                    latitude={form.latitude}
                    longitude={form.longitude}
                    onLocationChange={({ address, latitude, longitude }) =>
                      setForm((current) => ({
                        ...current,
                        legacyAddress: address || current.legacyAddress,
                        latitude,
                        longitude,
                      }))
                    }
                  />
                </div>
              </div>
            )}

            {section === "details" && (
              <div>
                <label><span className="mb-2 block text-sm font-bold">Description</span><textarea required rows="5" value={form.description} onChange={(event) => update("description", event.target.value)} className="w-full resize-none rounded-2xl border border-slate-300 px-4 py-3" /></label>
                <div className="mt-6 space-y-6">
                  {amenityGroups.map((group) => (
                    <fieldset key={group.id}>
                      <legend className="text-sm font-bold">{group.label}</legend>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {group.options.map((option) => (
                          <label key={option} className="flex items-center gap-3 rounded-2xl border border-slate-200 p-3 text-sm font-semibold">
                            <input type="checkbox" checked={form[group.id].includes(option)} onChange={() => toggleAmenity(group.id, option)} className="h-4 w-4 accent-rose-500" />{option}
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  ))}
                </div>
              </div>
            )}

            {section === "things" && (
              <div className="space-y-7">
                <section>
                  <h3 className="font-bold">House rules</h3>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <label><span className="mb-2 block text-sm font-bold">Check-in time</span><input required value={form.houseRulesCheckInTime} onChange={(event) => update("houseRulesCheckInTime", event.target.value)} placeholder="After 3:00 PM" className="w-full rounded-2xl border border-slate-300 px-4 py-3" /></label>
                    <label><span className="mb-2 block text-sm font-bold">Checkout time</span><input required value={form.houseRulesCheckoutTime} onChange={(event) => update("houseRulesCheckoutTime", event.target.value)} placeholder="Before 11:00 AM" className="w-full rounded-2xl border border-slate-300 px-4 py-3" /></label>
                    <YesNoField label="Pets allowed" value={form.houseRulesPetsAllowed} onChange={(value) => update("houseRulesPetsAllowed", value)} />
                    <YesNoField label="Smoking allowed" value={form.houseRulesSmokingAllowed} onChange={(value) => update("houseRulesSmokingAllowed", value)} />
                    <YesNoField label="Parties allowed" value={form.houseRulesPartiesAllowed} onChange={(value) => update("houseRulesPartiesAllowed", value)} />
                    <label><span className="mb-2 block text-sm font-bold">Quiet hours</span><input value={form.houseRulesQuietHours} onChange={(event) => update("houseRulesQuietHours", event.target.value)} placeholder="10:00 PM to 7:00 AM" className="w-full rounded-2xl border border-slate-300 px-4 py-3" /></label>
                    <label className="sm:col-span-2"><span className="mb-2 block text-sm font-bold">Extra house rule notes</span><textarea rows="3" value={form.houseRulesNotes} onChange={(event) => update("houseRulesNotes", event.target.value)} placeholder="Shoes off indoors, shared-space rules, or check-in notes." className="w-full resize-none rounded-2xl border border-slate-300 px-4 py-3" /></label>
                  </div>
                </section>

                <section className="border-t border-slate-200 pt-6">
                  <h3 className="font-bold">Safety and property</h3>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <YesNoField label="Smoke alarm" value={form.safetySmokeAlarm} onChange={(value) => update("safetySmokeAlarm", value)} />
                    <YesNoField label="Carbon monoxide alarm" value={form.safetyCarbonMonoxideAlarm} onChange={(value) => update("safetyCarbonMonoxideAlarm", value)} />
                    <YesNoField label="Exterior/security cameras" value={form.safetySecurityCameras} onChange={(value) => update("safetySecurityCameras", value)} />
                    <label><span className="mb-2 block text-sm font-bold">Property warnings</span><input value={form.safetyPropertyWarnings} onChange={(event) => update("safetyPropertyWarnings", event.target.value)} placeholder="Pool, balcony, stairs, or other warnings" className="w-full rounded-2xl border border-slate-300 px-4 py-3" /></label>
                    <label className="sm:col-span-2"><span className="mb-2 block text-sm font-bold">Extra safety notes</span><textarea rows="3" value={form.safetyNotes} onChange={(event) => update("safetyNotes", event.target.value)} placeholder="Anything guests should know before arrival." className="w-full resize-none rounded-2xl border border-slate-300 px-4 py-3" /></label>
                  </div>
                </section>

                <section className="border-t border-slate-200 pt-6">
                  <h3 className="font-bold">Cancellation policy</h3>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <label><span className="mb-2 block text-sm font-bold">Cancellation type</span><select required value={form.cancellationPolicyType} onChange={(event) => update("cancellationPolicyType", event.target.value)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"><option value="">Choose policy</option>{cancellationTypes.map((item) => <option key={item}>{item}</option>)}</select></label>
                    <label><span className="mb-2 block text-sm font-bold">Free cancellation period</span><input required value={form.cancellationFreeCancellationPeriod} onChange={(event) => update("cancellationFreeCancellationPeriod", event.target.value)} placeholder="Until 48 hours before check-in" className="w-full rounded-2xl border border-slate-300 px-4 py-3" /></label>
                    <label><span className="mb-2 block text-sm font-bold">Partial refund rule</span><input required value={form.cancellationPartialRefundRule} onChange={(event) => update("cancellationPartialRefundRule", event.target.value)} placeholder="50% refund after the free cancellation period" className="w-full rounded-2xl border border-slate-300 px-4 py-3" /></label>
                    <label><span className="mb-2 block text-sm font-bold">Extra cancellation notes</span><input value={form.cancellationNotes} onChange={(event) => update("cancellationNotes", event.target.value)} placeholder="Cleaning fee or special case notes" className="w-full rounded-2xl border border-slate-300 px-4 py-3" /></label>
                  </div>
                </section>
              </div>
            )}

            {section === "availability" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <label><span className="mb-2 block text-sm font-bold">Available from</span><input required type="date" value={form.availableFrom} onChange={(event) => update("availableFrom", event.target.value)} className="w-full rounded-2xl border border-slate-300 px-4 py-3" /></label>
                <label><span className="mb-2 block text-sm font-bold">Available to</span><input required type="date" min={form.availableFrom} value={form.availableTo} onChange={(event) => update("availableTo", event.target.value)} className="w-full rounded-2xl border border-slate-300 px-4 py-3" /></label>
                <label><span className="mb-2 block text-sm font-bold">Price per night (RM)</span><input required type="number" min="1" value={form.pricePerNight} onChange={(event) => update("pricePerNight", event.target.value)} className="w-full rounded-2xl border border-slate-300 px-4 py-3" /></label>
                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4"><input type="checkbox" checked={form.isAvailable} onChange={(event) => update("isAvailable", event.target.checked)} className="h-5 w-5 accent-rose-500" /><span className="font-bold">Available to book</span></label>
              </div>
            )}
            {error && <p className="mt-5 rounded-2xl bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</p>}
          </div>
          <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
            <button type="button" onClick={onClose} className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-bold">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-full bg-rose-500 px-6 py-2.5 text-sm font-bold text-white disabled:opacity-50">{saving ? "Saving..." : "Save changes"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ListingsTab({ listings, loading, onChanged, requestedEditId, onEditOpened }) {
  const navigate = useNavigate();
  const [view, setView] = useState("listed");
  const [editing, setEditing] = useState(null);
  const [editorLoadingTitle, setEditorLoadingTitle] = useState("");
  const [error, setError] = useState("");
  const listedCount = listings.filter((listing) => listing.isListed).length;
  const unlistedCount = listings.length - listedCount;
  const visible = listings.filter((listing) => view === "listed" ? listing.isListed : !listing.isListed);

  const openEditor = useCallback(async (listing) => {
    setError("");
    setEditorLoadingTitle(listing?.title || "Preparing the editor.");

    try {
      const freshListing = await getProperty(listing.id);
      setEditing(freshListing);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Could not load this listing for editing.");
    } finally {
      setEditorLoadingTitle("");
    }
  }, []);

  useEffect(() => {
    if (!requestedEditId || loading) return;
    const requestedListing = listings.find((listing) => listing.id === requestedEditId);
    if (requestedListing) {
      Promise.resolve().then(() => {
        setView(requestedListing.isListed ? "listed" : "unlisted");
        openEditor(requestedListing);
        onEditOpened();
      });
    }
  }, [listings, loading, onEditOpened, openEditor, requestedEditId]);

  const changePublishState = async (listing) => {
    try {
      const nextListing = listing.isListed
        ? await unpublishListing(listing.id)
        : await publishListing(listing.id);
      onChanged(nextListing);
      setView(nextListing.isListed ? "listed" : "unlisted");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Could not update this listing.");
    }
  };

  const getVisibility = (listing) => {
    if (!listing.isListed) {
      return { label: "Draft · unlisted", classes: "bg-slate-100 text-slate-700" };
    }
    if (!listing.isAvailable) {
      return { label: "Hidden · unavailable", classes: "bg-amber-50 text-amber-700" };
    }
    if (listing.availableTo && toDateValue(listing.availableTo) <= localToday()) {
      return { label: "Hidden · availability ended", classes: "bg-amber-50 text-amber-700" };
    }
    return { label: "Visible to guests", classes: "bg-emerald-50 text-emerald-700" };
  };

  const remove = async (listing) => {
    if (!window.confirm(`Delete “${listing.title}”? This cannot be undone.`)) return;
    try {
      await deleteListing(listing.id);
      onChanged(null, listing.id);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Could not delete this listing.");
    }
  };

  return (
    <section>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div><h1 className="text-3xl font-bold tracking-tight">Listings <span className="text-slate-400">({listings.length})</span></h1><p className="mt-2 text-sm text-slate-500">Manage public stays and private drafts separately.</p></div>
        <button type="button" onClick={() => navigate("/hosting/listings/new")} className="rounded-full bg-rose-500 px-5 py-3 text-sm font-bold text-white">Create listing</button>
      </div>
      <div className="mt-7 inline-flex rounded-full bg-slate-100 p-1">
        {["listed", "unlisted"].map((item) => <button key={item} type="button" onClick={() => setView(item)} className={`rounded-full px-5 py-2.5 text-sm font-bold capitalize ${view === item ? "bg-white shadow-sm" : "text-slate-500"}`}>{item} ({item === "listed" ? listedCount : unlistedCount})</button>)}
      </div>
      {error && <p className="mt-5 rounded-2xl bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</p>}
      {loading ? <p className="mt-7 rounded-3xl bg-white p-8 text-sm text-slate-500">Loading listings...</p> : visible.length === 0 ? (
        <div className="mt-7"><EmptyState title={`No ${view} listings`} message={view === "listed" ? "Publish an unlisted stay when it is ready for guests." : "New listing drafts will appear here."} /></div>
      ) : (
        <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((listing) => {
            const visibility = getVisibility(listing);
            return (
            <article key={listing.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
              <button type="button" onClick={() => navigate(`/properties/${listing.id}`)} className="block w-full text-left">
                <div className="relative aspect-[4/3] bg-slate-100">
                  {listing.imageUrl ? <img src={listing.imageUrl} alt={listing.title} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-sm font-bold text-slate-400">Photo placeholder</div>}
                  <span className={`absolute left-3 top-3 rounded-full px-3 py-1 text-[11px] font-bold shadow-sm ${visibility.classes}`}>{visibility.label}</span>
                </div>
                <div className="p-5"><h2 className="truncate font-bold">{listing.title}</h2><p className="mt-1 text-sm text-slate-500">RM {listing.pricePerNight} per night</p><p className="mt-2 text-xs font-semibold text-slate-500">Available until {listing.availableTo ? formatBookingDate(listing.availableTo) : "not set"}</p></div>
              </button>
              <div className="flex flex-wrap gap-2 border-t border-slate-100 p-4">
                <button type="button" onClick={() => openEditor(listing)} className="rounded-full border border-slate-300 px-4 py-2 text-xs font-bold">Edit</button>
                <button type="button" onClick={() => changePublishState(listing)} className="rounded-full bg-slate-950 px-4 py-2 text-xs font-bold text-white">{listing.isListed ? "Unpublish" : "Publish"}</button>
                <button type="button" onClick={() => remove(listing)} className="rounded-full bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700">Delete</button>
              </div>
            </article>
          )})}
        </div>
      )}
      {editorLoadingTitle && <EditorLoadingModal title={editorLoadingTitle} />}
      {editing && <ListingEditorModal listing={editing} onClose={() => setEditing(null)} onSaved={(updated) => { onChanged(updated); setEditing(null); }} />}
    </section>
  );
}

function CalendarTab({ bookings }) {
  const navigate = useNavigate();
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const today = localToday();
  const [selectedDay, setSelectedDay] = useState(today);
  const days = useMemo(() => {
    const start = new Date(month);
    start.setDate(1 - start.getDay());
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const monthValue = String(date.getMonth() + 1).padStart(2, "0");
      const dayValue = String(date.getDate()).padStart(2, "0");
      return { date, value: `${date.getFullYear()}-${monthValue}-${dayValue}` };
    });
  }, [month]);

  const activeBookings = bookings.filter((booking) => ["accepted", "pending"].includes(normalizeBookingStatus(booking.status)));
  const selectedDayBookings = activeBookings.filter(
    (booking) => selectedDay >= toDateValue(booking.checkIn) && selectedDay < toDateValue(booking.checkOut),
  );

  return (
    <section>
      <div><h1 className="text-3xl font-bold tracking-tight">Calendar</h1><p className="mt-2 text-sm text-slate-500">See real dates and occupied stays across your properties.</p></div>
      <div className="mt-7 overflow-hidden rounded-3xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 p-5">
          <button type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="grid h-10 w-10 place-items-center rounded-full border border-slate-200">‹</button>
          <h2 className="font-bold">{month.toLocaleDateString("en-MY", { month: "long", year: "numeric" })}</h2>
          <button type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="grid h-10 w-10 place-items-center rounded-full border border-slate-200">›</button>
        </div>
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-bold text-slate-500">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <div key={day} className="p-3">{day}</div>)}</div>
        <div className="grid grid-cols-7">
          {days.map(({ date, value }) => {
            const occupied = activeBookings.filter((booking) => value >= toDateValue(booking.checkIn) && value < toDateValue(booking.checkOut));
            return (
              <div
                key={value}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedDay(value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") setSelectedDay(value);
                }}
                className={`min-h-28 cursor-pointer border-b border-r border-slate-100 p-2 text-left transition hover:bg-slate-50 ${selectedDay === value ? "bg-rose-50/70 ring-2 ring-inset ring-rose-200" : ""} ${date.getMonth() !== month.getMonth() ? "bg-slate-50/60 text-slate-300" : ""}`}
              >
                <span className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${value === today ? "bg-rose-500 text-white" : ""}`}>{date.getDate()}</span>
                <div className="mt-1 space-y-1">
                  {occupied.slice(0, 2).map((booking) => <div key={booking.id} title={`${booking.guest?.username} · ${booking.property?.title}`} className={`truncate rounded-md px-1.5 py-1 text-[10px] font-bold ${normalizeBookingStatus(booking.status) === "accepted" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>{booking.property?.title} · {booking.guest?.username}</div>)}
                  {occupied.length > 2 && <p className="text-[10px] font-bold text-slate-500">+{occupied.length - 2} more</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-950">
              {new Date(`${selectedDay}T00:00:00`).toLocaleDateString("en-MY", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {selectedDayBookings.length
                ? `${selectedDayBookings.length} booking${selectedDayBookings.length === 1 ? "" : "s"} on this day.`
                : "No bookings on this day."}
            </p>
          </div>
        </div>
        {selectedDayBookings.length > 0 && (
          <div className="mt-5 grid gap-3">
            {selectedDayBookings.map((booking) => (
              <BookingCard key={booking.id} booking={booking} onOpen={() => navigate(`/hosting/requests/${booking.id}`)} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function HostingDashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const activeTab = workspaceTabs.includes(requestedTab) ? requestedTab : "bookings";
  const [bookings, setBookings] = useState([]);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadHostingData = useCallback(() => {
    Promise.allSettled([getBookingRequests(), getMyListings()])
      .then(([bookingResult, listingResult]) => {
        if (bookingResult.status === "fulfilled") {
          setBookings(bookingResult.value);
        }
        if (listingResult.status === "fulfilled") {
          setListings(listingResult.value);
        }
        if (bookingResult.status === "rejected" || listingResult.status === "rejected") {
          const failedRequest =
            listingResult.status === "rejected" ? listingResult.reason : bookingResult.reason;
          setError(failedRequest.response?.data?.message || "Some hosting data could not be loaded.");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadHostingData();
  }, [loadHostingData]);

  useEffect(() => {
    const refresh = (event) => {
      if (["booking", "property"].includes(event.detail?.entity)) {
        loadHostingData();
      }
    };
    window.addEventListener("cloudstay:data-changed", refresh);
    return () => window.removeEventListener("cloudstay:data-changed", refresh);
  }, [loadHostingData]);

  const updateLocalListing = (updated, deletedId) => {
    if (deletedId) {
      setListings((current) => current.filter((listing) => listing.id !== deletedId));
      return;
    }
    setListings((current) => current.map((listing) => listing.id === updated.id ? updated : listing));
  };

  const hostingNavigation = (
    <nav className="flex items-center gap-1" aria-label="Hosting workspace">
      {workspaceTabs.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => setSearchParams({ tab })}
          className={`relative shrink-0 px-2 py-7 text-xs font-bold capitalize lg:px-4 lg:text-sm ${
            activeTab === tab ? "text-slate-950" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          {tab}
          {activeTab === tab && <span className="absolute inset-x-2 bottom-0 h-0.5 bg-slate-950 lg:inset-x-4" />}
        </button>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-[#f7f7f7] text-slate-950">
      <AppHeader
        centerContent={hostingNavigation}
        hostingMode
      />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {error && <p className="mb-6 rounded-2xl bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</p>}
        {activeTab === "bookings" && (
          <BookingsTab
            bookings={bookings}
            loading={loading}
            onOpen={(booking) => navigate(`/hosting/requests/${booking.id}`)}
            requestedView={searchParams.get("view")}
          />
        )}
        {activeTab === "listings" && (
          <ListingsTab
            listings={listings}
            loading={loading}
            onChanged={updateLocalListing}
            requestedEditId={Number(searchParams.get("edit")) || null}
            onEditOpened={() => setSearchParams({ tab: "listings" })}
          />
        )}
        {activeTab === "calendar" && <CalendarTab bookings={bookings} />}
      </main>
    </div>
  );
}

export default HostingDashboard;
