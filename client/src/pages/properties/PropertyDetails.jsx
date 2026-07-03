import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getProperty,
  publishListing,
  unpublishListing,
  createBookingRequest 
} from "../../api/api";
import AppHeader from "../../components/AppHeader";
import DateRangePicker from "../../components/DateRangePicker.jsx";
import GuestPicker from "../../components/GuestPicker.jsx";
import { useAuth } from "../../context/useAuth";
import { addNotification, readSavedListings, writeSavedListings } from "../../utils/localState.js";
import { formatGuests, getGuestTotal } from "../../utils/searchOptions.js";

const splitValues = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return value.split(",").map((item) => item.trim()).filter(Boolean);
};

const formatDate = (value) => {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return new Intl.DateTimeFormat("en-MY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const getTodayValue = () => {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
};

const formatMemberSince = (value) => {
  if (!value) return "Recently joined";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently joined";
  return new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
  }).format(date);
};

function PropertyPhotoGallery({ imageUrl, imageUrls = [], title }) {
  const photos = imageUrls.length > 0 ? imageUrls : imageUrl ? [imageUrl] : [];
  const [heroPhoto, ...secondaryPhotos] = photos;

  return (
    <section className="grid gap-2 overflow-hidden rounded-3xl bg-slate-100 md:grid-cols-[2fr_1fr]">
      <div className="aspect-[4/3] bg-slate-100 md:aspect-[16/10]">
        {heroPhoto ? (
          <img
            src={heroPhoto}
            alt={title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-rose-50 via-white to-amber-50 text-sm font-bold text-slate-400">
            Photos coming soon
          </div>
        )}
      </div>
      <div className="hidden grid-rows-2 gap-2 md:grid">
        {[1, 2].map((item) => (
          <div
            key={item}
            className="relative overflow-hidden bg-gradient-to-br from-slate-100 to-rose-50"
          >
            {secondaryPhotos[item - 1] ? (
              <img
                src={secondaryPhotos[item - 1]}
                alt={`${title} ${item + 1}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-slate-400">
                Photo placeholder
              </div>
            )}
          </div>
        ))}
      </div>
      {photos.length > 3 && (
        <div className="grid gap-2 md:col-span-2 md:grid-cols-4">
          {photos.slice(3).map((photo, index) => (
            <div
              key={photo}
              className="aspect-[4/3] overflow-hidden bg-slate-100"
            >
              <img
                src={photo}
                alt={`${title} ${index + 4}`}
                className="h-full w-full object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function HostControlBanner({ listing, onEdit, onPublish, onUnpublish }) { 
  if (!listing.isOwner) return null;
  return (
    <section className={`rounded-3xl border p-5 shadow-sm ${listing.isListed ? "border-emerald-100 bg-emerald-50" : "border-amber-100 bg-amber-50"}`}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-normal text-slate-600">Host preview</p>
          <p className="mt-1 text-sm font-semibold text-slate-700">
            {listing.isListed ? "This listing is live. Guests can view it." : "This listing is currently unlisted. Guests cannot see it yet."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={onEdit} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-slate-300">
            Edit listing
          </button>
          {listing.isListed ? (
            <button type="button" onClick={onUnpublish} className="rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-800">
              Unpublish listing
            </button>
          ) : (
            <button type="button" onClick={onPublish} className="rounded-full bg-rose-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-rose-600">
              Publish listing
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

function PropertySummary({ listing }) { 
  const location = listing.address || listing.location;
  return (
    <section className="border-b border-slate-200 pb-6">
      <h2 className="text-2xl font-bold tracking-normal text-slate-950">
        {listing.placeType || "Stay"} in {location || "CloudStay"}
      </h2>
      <p className="mt-2 text-sm font-semibold text-slate-600">
        {listing.guestCount || 0} guests · {listing.bedroomCount || 0} bedrooms · {listing.bedCount || 0} beds · {listing.bathroomCount || 0} bathrooms
      </p>
    </section>
  );
}

function HostInfoCard({ host }) { 
  return (
    <section className="flex items-center gap-4 border-b border-slate-200 py-6">
      <div className="grid h-14 w-14 place-items-center rounded-full bg-rose-100 text-lg font-bold text-rose-600">
        {(host?.username || "H").slice(0, 1).toUpperCase()}
      </div>
      <div>
        <h3 className="text-base font-bold text-slate-950">Hosted by {host?.username || "CloudStay host"}</h3>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          CloudStay Host · Member since {formatMemberSince(host?.createdAt)}
        </p>
      </div>
    </section>
  );
}

function ListingHighlights({ listing }) { 
  const unitFeatures = splitValues(listing.unitFeatures);
  const safetyFeatures = splitValues(listing.safetyFeatures);
  const highlights = [
    listing.guestCount ? `Great for ${listing.guestCount} guest${listing.guestCount === 1 ? "" : "s"}` : null,
    unitFeatures.includes("Kitchen") ? "Kitchen included" : null,
    unitFeatures.includes("Air conditioning") ? "Air conditioning included" : null,
    safetyFeatures.length > 0 ? "Safety features available" : null,
    listing.placeType === "Entire place" ? "Private entire place" : null,
    listing.availableFrom ? `Available from ${formatDate(listing.availableFrom)}` : null,
  ].filter(Boolean);

  if (highlights.length === 0) return null;
  return (
    <section className="border-b border-slate-200 py-6">
      <div className="grid gap-3 sm:grid-cols-2">
        {highlights.map((highlight) => (
          <div key={highlight} className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm font-bold text-slate-900">{highlight}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function PropertyAmenities({ listing }) { 
  const groups = [
    ["Unit Features", splitValues(listing.unitFeatures)],
    ["Facilities / Entertainment", splitValues(listing.propertyFacilities)],
    ["Safety Features", splitValues(listing.safetyFeatures)],
  ].filter(([, values]) => values.length > 0);

  if (groups.length === 0) {
    return (
      <section className="border-b border-slate-200 py-6">
        <h2 className="text-xl font-bold text-slate-950">What this place offers</h2>
        <p className="mt-3 text-sm text-slate-500">Amenities will appear here soon.</p>
      </section>
    );
  }
  return (
    <section className="border-b border-slate-200 py-6">
      <h2 className="text-xl font-bold text-slate-950">What this place offers</h2>
      <div className="mt-5 grid gap-5">
        {groups.map(([label, values]) => (
          <div key={label}>
            <h3 className="text-sm font-bold uppercase tracking-normal text-slate-500">{label}</h3>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {values.map((value) => (
                <div key={value} className="rounded-2xl border border-slate-100 bg-white p-4 text-sm font-semibold text-slate-700">
                  {value}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function LocationSection({ listing }) { 
  return (
    <section className="border-b border-slate-200 py-6">
      <h2 className="text-xl font-bold text-slate-950">Where you'll be</h2>
      <p className="mt-3 text-sm font-semibold text-slate-600">
        {listing.address || listing.location || "Location coming soon"}
      </p>
      <div className="mt-5 flex h-48 items-center justify-center rounded-3xl bg-gradient-to-br from-rose-50 via-white to-amber-50 text-sm font-bold text-slate-400">
        Map preview coming soon
      </div>
    </section>
  );
}

function ThingsToKnow({ listing }) { 
  const safetyFeatures = splitValues(listing.safetyFeatures);
  return (
    <section className="py-6">
      <h2 className="text-xl font-bold text-slate-950">Things to know</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <div>
          <h3 className="text-sm font-bold text-slate-950">House rules</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Maximum {listing.guestCount || 0} guests. Booking and check-in details coming soon.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-950">Safety</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {safetyFeatures.length > 0 ? safetyFeatures.join(", ") : "Safety details coming soon."}
          </p>
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-950">Cancellation policy</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">Flexible cancellation placeholder.</p>
        </div>
      </div>
    </section>
  );
}

function NotFoundState({ onBack }) { 
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fffaf7] px-4">
      <div className="max-w-md rounded-3xl bg-white p-8 text-center shadow-xl shadow-rose-100/60">
        <h1 className="text-2xl font-bold text-slate-950">Listing unavailable</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">This stay may be unlisted, private, or no longer available.</p>
        <button type="button" onClick={onBack} className="mt-6 rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white">
          Go back
        </button>
      </div>
    </main>
  );
}

// --- REVIEW BOOKING MODAL ---
function ReviewBookingModal({ listing, checkIn, checkOut, guests, onClose, onSuccess }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  const totalPrice = nights * listing.pricePerNight;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      const result = await createBookingRequest({
        propertyId: listing.id,
        checkIn: checkIn,
        checkOut: checkOut,
        adults: guests.adults,
        children: guests.children,
        infants: guests.infants,
      });
      if (listing.hostId && result.bookingId) {
        addNotification(listing.hostId, {
          type: "booking-request",
          audience: "host",
          direction: "incoming",
          title: "New booking request",
          message: `A guest requested ${listing.title} from ${checkIn} to ${checkOut}.`,
          bookingId: result.bookingId,
          propertyId: listing.id,
          propertyTitle: listing.title,
          status: "Pending",
          targetPath: `/hosting/requests/${result.bookingId}`,
        });
      }
      onSuccess();
    } catch (error) {
      console.error("Booking failed", error.response?.data || error);
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
            <p className="font-bold text-slate-900">{formatGuests(guests)}</p>
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


// --- PROPERTY BOOKING CARD ---
function PropertyBookingCard({ listing, user }) {
  const navigate = useNavigate();
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState({ adults: 1, children: 0, infants: 0 });
  const [activePicker, setActivePicker] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  const isValidDates = checkIn && checkOut && new Date(checkIn) < new Date(checkOut);
  const today = getTodayValue();
  const availableFrom = listing.availableFrom?.slice(0, 10);
  const availableTo = listing.availableTo?.slice(0, 10);
  const minimumDate = availableFrom && availableFrom > today ? availableFrom : today;
  const guestCountValid = getGuestTotal(guests) <= Number(listing.guestCount || 0);
  
  if (requestSent) {
    return (
      <aside className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 shadow-xl lg:sticky lg:top-6 text-center">
        <h3 className="text-xl font-bold text-emerald-800">Request Sent!</h3>
        <p className="mt-2 text-sm text-emerald-700">
          The host has received your request. You will be notified when they accept or decline.
        </p>
        <button 
          onClick={() => navigate("/my-trips")}
          className="mt-4 w-full rounded-full bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
        >
          View My Trips
        </button>
      </aside>
    );
  }

  return (
    <>
      <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/70 lg:sticky lg:top-6">
        <p className="text-2xl font-bold text-slate-950">
          RM {listing.pricePerNight} <span className="text-sm font-semibold text-slate-500">night</span>
        </p>
        
        <div className="relative mt-5 grid grid-cols-2 rounded-2xl border border-slate-200">
          <button type="button" onClick={() => setActivePicker(activePicker === "dates" ? "" : "dates")} className="border-r border-slate-200 p-3 text-left">
            <span className="block text-xs font-bold uppercase text-slate-500">Check in</span>
            <span className="mt-1 block text-sm">{checkIn || "Add date"}</span>
          </button>
          <button type="button" onClick={() => setActivePicker(activePicker === "dates" ? "" : "dates")} className="p-3 text-left">
            <span className="block text-xs font-bold uppercase text-slate-500">Checkout</span>
            <span className="mt-1 block text-sm">{checkOut || "Add date"}</span>
          </button>
          <button type="button" onClick={() => setActivePicker(activePicker === "guests" ? "" : "guests")} className="col-span-2 border-t border-slate-200 p-3 text-left">
            <span className="block text-xs font-bold uppercase text-slate-500">Guests</span>
            <span className="mt-1 block text-sm">{formatGuests(guests)}</span>
          </button>
          {activePicker === "dates" && (
            <div className="absolute right-0 top-[calc(100%+0.75rem)] z-20">
              <DateRangePicker
                startDate={checkIn}
                endDate={checkOut}
                minDate={minimumDate}
                maxDate={availableTo}
                onChange={({ startDate, endDate }) => {
                  setCheckIn(startDate);
                  setCheckOut(endDate);
                }}
              />
            </div>
          )}
          {activePicker === "guests" && (
            <div className="absolute right-0 top-[calc(100%+0.75rem)] z-20">
              <GuestPicker
                value={guests}
                onChange={setGuests}
                minAdults={1}
                maxGuests={listing.guestCount || undefined}
              />
            </div>
          )}
        </div>

        {!user ? (
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="mt-5 w-full rounded-full bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
          >
            Log in to book
          </button>
        ) : listing.isOwner ? (
          <button
            type="button"
            disabled
            className="mt-5 w-full rounded-full bg-slate-300 px-5 py-3 text-sm font-bold text-white cursor-not-allowed"
          >
            Preview mode - hosts cannot book
          </button>
        ) : (
          <button
            type="button"
            disabled={!listing.isAvailable || !isValidDates || !guestCountValid}
            onClick={() => setShowModal(true)}
            className="mt-5 w-full rounded-full bg-rose-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:bg-rose-300"
          >
            {listing.isAvailable ? "Request booking" : "Currently unavailable"}
          </button>
        )}

        {user && !listing.isOwner && (!isValidDates || !guestCountValid) && (
          <p className="mt-3 text-center text-xs font-semibold text-slate-500">
            Select valid dates and a guest count within this listing's limit.
          </p>
        )}
      </aside>

      {showModal && (
        <ReviewBookingModal 
          listing={listing}
          checkIn={checkIn}
          checkOut={checkOut}
          guests={guests}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            setRequestSent(true);
          }}
        />
      )}
    </>
  );
}


// --- MAIN COMPONENT ---
function PropertyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [, setSavedRevision] = useState(0);

  useEffect(() => {
    let isActive = true;
    getProperty(id)
      .then((data) => {
        if (isActive) {
          setListing(data);
          setError("");
        }
      })
      .catch((err) => {
        if (isActive) {
          const status = err.response?.status;
          setError(status === 404 || status === 403 ? "unavailable" : "error");
        }
      })
      .finally(() => {
        if (isActive) {
          setLoading(false);
        }
      });
    return () => { isActive = false; };
  }, [id]);

  const isSaved =
    Boolean(listing && user) &&
    readSavedListings(user?.userId).some((saved) => saved.id === listing?.id);

  const handlePublish = async () => setListing(await publishListing(id));
  const handleUnpublish = async () => setListing(await unpublishListing(id));

  const handleToggleSave = () => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (!listing || listing.isOwner) {
      return;
    }

    const savedListings = readSavedListings(user.userId);
    const nextSavedListings = isSaved
      ? savedListings.filter((saved) => saved.id !== listing.id)
      : [
          {
            id: listing.id,
            title: listing.title,
            location: listing.location,
            imageUrl: listing.imageUrl,
            pricePerNight: listing.pricePerNight,
          },
          ...savedListings.filter((saved) => saved.id !== listing.id),
        ];

    writeSavedListings(user.userId, nextSavedListings);
    setSavedRevision((revision) => revision + 1);
  };

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-[#fffaf7] px-4 text-slate-700">Loading listing...</main>;
  if (error || !listing) return <NotFoundState onBack={() => navigate(-1)} />;

  return (
    <div className="min-h-screen bg-[#fffaf7] text-slate-950">
      <AppHeader
        title="CloudStay"
        subtitle={listing.isOwner ? "Host preview" : "Listing details"}
        actions={
          <>
            {!listing.isOwner && (
              <button
                type="button"
                onClick={() => navigate("/explore")}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-slate-300"
              >
                Back to Explore
              </button>
            )}
            {user && (
              <button
                type="button"
                onClick={() => navigate(user.isHost ? "/hosting/listings" : "/dashboard")}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-slate-300"
              >
                {user.isHost ? "My listings" : "Back to Dashboard"}
              </button>
            )}
            {user ? (
              <button
                type="button"
                onClick={logout}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-slate-300"
              >
                Logout
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="rounded-full bg-rose-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-rose-600"
              >
                Login
              </button>
            )}
          </>
        }
      />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-5">
          <HostControlBanner
            listing={listing}
            onEdit={() => navigate(`/hosting/dashboard?tab=listings&edit=${listing.id}`)}
            onPublish={handlePublish}
            onUnpublish={handleUnpublish}
          />

          <section>
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <h1 className="text-3xl font-bold tracking-normal text-slate-950">{listing.title}</h1>
              </div>
              <div className="flex flex-wrap gap-2">
                {listing.isOwner && (
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${listing.isListed ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                    {listing.isListed ? "Listed" : "Unlisted"}
                  </span>
                )}
                {!listing.isOwner && (
                  <button
                    type="button"
                    onClick={handleToggleSave}
                    className={`rounded-full border px-3 py-1 text-xs font-bold transition ${
                      isSaved
                        ? "border-rose-200 bg-rose-50 text-rose-700"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <svg viewBox="0 0 24 24" className={`mr-1 inline h-4 w-4 ${isSaved ? "fill-rose-500 stroke-rose-500" : "fill-none stroke-current"}`} strokeWidth="2">
                      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
                    </svg>
                    {isSaved ? "Saved" : "Save"}
                  </button>
                )}
              </div>
            </div>
          </section>

          <PropertyPhotoGallery
            imageUrl={listing.imageUrl}
            imageUrls={listing.imageUrls}
            title={listing.title}
          />

          <section className="grid gap-8 lg:grid-cols-[1fr_340px]">
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <PropertySummary listing={listing} />
              <HostInfoCard host={listing.host} />
              <ListingHighlights listing={listing} />

              <section className="border-b border-slate-200 py-6">
                <h2 className="text-xl font-bold text-slate-950">About this place</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">{listing.description}</p>
              </section>

              <PropertyAmenities listing={listing} />

              <section className="border-b border-slate-200 py-6">
                <h2 className="text-xl font-bold text-slate-950">Availability</h2>
                <p className="mt-3 text-sm font-semibold text-slate-600">
                  Available from {formatDate(listing.availableFrom)} to {formatDate(listing.availableTo)}.
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-500">
                  {listing.isAvailable ? "Currently available to book." : "Currently unavailable."}
                </p>
              </section>

              <LocationSection listing={listing} />

              <section className="border-b border-slate-200 py-6">
                <h2 className="text-xl font-bold text-slate-950">Meet your host</h2>
                <p className="mt-3 text-sm font-semibold text-slate-600">
                  {listing.host?.username || "CloudStay host"} · CloudStay Host · Member since {formatMemberSince(listing.host?.createdAt)}
                </p>
                <button className="mt-4 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700">
                  Message Host
                </button>
              </section>

              <ThingsToKnow listing={listing} />
            </div>

            <PropertyBookingCard listing={listing} user={user} />
          </section>
        </div>
      </main>
    </div>
  );
}

export default PropertyDetails;
