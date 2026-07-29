import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getProperty,
  getPropertyAvailability,
  getHostProfile,
  getOrCreatePropertyConversation,
  publishListing,
  unpublishListing,
  createBookingRequest 
} from "../../api/api";
import AppHeader from "../../components/AppHeader";
import AvailabilityCalendar from "../../components/AvailabilityCalendar";
import PropertyReviews from "../../components/PropertyReviews";
import { PropertyLocationMap } from "../../components/PropertyMap";
import DateRangePicker from "../../components/DateRangePicker.jsx";
import GuestPicker from "../../components/GuestPicker.jsx";
import { useAuth } from "../../context/useAuth";
import { readSavedListings, writeSavedListings } from "../../utils/localState.js";
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

const formatMemberSince = (value) => {
  if (!value) return "Recently joined";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently joined";
  return new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
  }).format(date);
};

const yesNo = (value, yesLabel, noLabel, fallback = "Ask the host for details") => {
  if (value === true) return yesLabel;
  if (value === false) return noLabel;
  return fallback;
};

const compactList = (items) =>
  items
    .map(([label, value]) => ({ label, value }))
    .filter((item) => item.value !== null && item.value !== undefined && String(item.value).trim() !== "");

const formatRating = (value) => {
  const rating = Number(value);
  return Number.isFinite(rating) ? rating.toFixed(1) : null;
};

const hostInitial = (host) => (host?.username || "H").slice(0, 1).toUpperCase();

const getHostDuration = (hostSince) => {
  if (!hostSince) return "New host";
  const started = new Date(hostSince);
  if (Number.isNaN(started.getTime())) return "New host";

  const diffMs = Date.now() - started.getTime();
  if (diffMs < 24 * 60 * 60 * 1000) return "Less than a day";

  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  return `${days} day${days === 1 ? "" : "s"}`;
};

const renderStars = (rating) =>
  "*".repeat(Math.max(0, Math.min(5, Math.round(Number(rating) || 0))));

function PropertyPhotoGallery({ imageUrl, imageUrls = [], title }) {
  const photos = imageUrls.length > 0 ? imageUrls : imageUrl ? [imageUrl] : [];
  const [selectedIndex, setSelectedIndex] = useState(null);
  const visiblePhotos = photos.slice(0, 5);
  const remainingCount = Math.max(0, photos.length - visiblePhotos.length);
  const selectedPhoto = selectedIndex === null ? null : photos[selectedIndex];
  const closeGallery = useCallback(() => setSelectedIndex(null), []);
  const showPreviousPhoto = useCallback(() => {
    setSelectedIndex((index) =>
      index === null ? 0 : (index + photos.length - 1) % photos.length,
    );
  }, [photos.length]);
  const showNextPhoto = useCallback(() => {
    setSelectedIndex((index) =>
      index === null ? 0 : (index + 1) % photos.length,
    );
  }, [photos.length]);

  useEffect(() => {
    if (selectedIndex === null) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") closeGallery();
      if (event.key === "ArrowLeft") showPreviousPhoto();
      if (event.key === "ArrowRight") showNextPhoto();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeGallery, selectedIndex, showNextPhoto, showPreviousPhoto]);

  if (photos.length === 0) {
    return (
      <section className="flex aspect-[16/9] min-h-72 items-center justify-center rounded-3xl bg-gradient-to-br from-rose-50 via-white to-amber-50 text-sm font-bold text-slate-400">
        Photos coming soon
      </section>
    );
  }

  return (
    <>
      <section className="grid gap-2 overflow-hidden rounded-3xl bg-slate-100 md:grid-cols-4 md:grid-rows-2">
        {visiblePhotos.map((photo, index) => {
          const isHero = index === 0;
          const showMore = index === 4 && remainingCount > 0;

          return (
            <button
              key={`${photo}-${index}`}
              type="button"
              onClick={() => setSelectedIndex(index)}
              className={`group relative overflow-hidden bg-slate-100 text-left ${
                isHero
                  ? "aspect-[16/10] md:col-span-2 md:row-span-2 md:aspect-auto"
                  : "aspect-[4/3]"
              }`}
              aria-label={`View photo ${index + 1} of ${photos.length}`}
            >
              <img
                src={photo}
                alt={`${title} photo ${index + 1}`}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
              {showMore && (
                <span className="absolute inset-0 grid place-items-center bg-slate-950/60 text-3xl font-bold text-white">
                  +{remainingCount}
                </span>
              )}
            </button>
          );
        })}
      </section>

      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/95 p-4 text-white"
          role="dialog"
          aria-modal="true"
          aria-label="Listing photo gallery"
        >
          <div className="mx-auto flex h-full max-w-6xl flex-col">
            <div className="flex items-center justify-between gap-3 py-2">
              <p className="text-sm font-bold">
                {selectedIndex + 1} / {photos.length}
              </p>
              <button
                type="button"
                onClick={closeGallery}
                className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold transition hover:bg-white/20"
              >
                Close
              </button>
            </div>

            <div className="relative grid min-h-0 flex-1 place-items-center">
              {photos.length > 1 && (
                <button
                  type="button"
                  onClick={showPreviousPhoto}
                  className="absolute left-0 z-10 rounded-full bg-white/10 px-4 py-3 text-2xl font-bold transition hover:bg-white/20"
                  aria-label="Previous photo"
                >
                  ‹
                </button>
              )}
              <img
                src={selectedPhoto}
                alt={`${title} photo ${selectedIndex + 1}`}
                className="max-h-full max-w-full rounded-2xl object-contain"
              />
              {photos.length > 1 && (
                <button
                  type="button"
                  onClick={showNextPhoto}
                  className="absolute right-0 z-10 rounded-full bg-white/10 px-4 py-3 text-2xl font-bold transition hover:bg-white/20"
                  aria-label="Next photo"
                >
                  ›
                </button>
              )}
            </div>

            {photos.length > 1 && (
              <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                {photos.map((photo, index) => (
                  <button
                    key={`${photo}-thumbnail-${index}`}
                    type="button"
                    onClick={() => setSelectedIndex(index)}
                    className={`h-16 w-24 shrink-0 overflow-hidden rounded-xl border-2 ${
                      index === selectedIndex ? "border-white" : "border-transparent opacity-60"
                    }`}
                    aria-label={`View photo ${index + 1}`}
                  >
                    <img
                      src={photo}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
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

function HostAvatar({ host, sizeClass = "h-16 w-16", textClass = "text-xl" }) {
  if (host?.profilePictureUrl) {
    return (
      <img
        src={host.profilePictureUrl}
        alt={host.username || "CloudStay host"}
        className={`${sizeClass} rounded-full object-cover`}
      />
    );
  }

  return (
    <div className={`grid ${sizeClass} place-items-center rounded-full bg-rose-100 font-bold text-rose-600 ${textClass}`}>
      {hostInitial(host)}
    </div>
  );
}

function HostReviewCard({ review }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-slate-950">{review.guestName || "Guest"}</h3>
          <p className="mt-1 text-xs font-semibold text-slate-500">{formatDate(review.createdAt)}</p>
        </div>
        <span className="shrink-0 text-sm font-bold text-amber-500">{renderStars(review.rating)}</span>
      </div>
      <p className="mt-4 text-sm leading-7 text-slate-600">
        {review.comment || "No written host review."}
      </p>
      <p className="mt-4 truncate text-xs font-bold uppercase tracking-wide text-slate-400">
        {review.propertyTitle || "CloudStay property"}
      </p>
    </article>
  );
}

function HostListingCard({ listing, onOpen }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="overflow-hidden rounded-3xl border border-slate-200 bg-white text-left transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="relative h-40 bg-gradient-to-br from-slate-100 to-rose-50">
        {listing.imageUrl ? (
          <img src={listing.imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full place-items-center text-sm font-bold text-slate-400">No photo</div>
        )}
        <span className={`absolute left-3 top-3 rounded-full px-3 py-1 text-[11px] font-bold shadow-sm ${
          listing.isListed ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-700"
        }`}>
          {listing.isListed ? "Listed" : "Unlisted"}
        </span>
      </div>
      <div className="p-5">
        <h3 className="truncate text-lg font-bold">{listing.title || "CloudStay listing"}</h3>
        <p className="mt-1 truncate text-sm text-slate-500">{listing.location || "Location unavailable"}</p>
        <p className="mt-4 text-sm font-bold text-slate-950">
          RM {listing.pricePerNight} <span className="font-normal text-slate-500">night</span>
        </p>
      </div>
    </button>
  );
}

function HostProfileShowcase({ hostProfile, onListingOpen }) {
  const reviews = hostProfile?.hostReviews || [];
  const listings = hostProfile?.listings || [];
  const visibleReviews = reviews.slice(0, 3);
  const profileDetails = hostProfile?.profileDetails || [];

  return (
    <div className="space-y-12">
      <section>
        <div className="grid overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm md:grid-cols-[1fr_240px]">
          <div className="p-8 sm:p-10">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <HostAvatar
                host={hostProfile}
                sizeClass="h-32 w-32"
                textClass="text-5xl"
              />
              <div>
                <h2 className="text-3xl font-bold">{hostProfile?.username || "CloudStay host"}</h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">CloudStay host</p>
                {hostProfile?.livesIn && (
                  <p className="mt-3 text-sm font-semibold text-slate-700">{hostProfile.livesIn}</p>
                )}
              </div>
            </div>

            {hostProfile?.aboutMe ? (
              <p className="mt-8 max-w-3xl text-base leading-8 text-slate-700">{hostProfile.aboutMe}</p>
            ) : (
              <div className="mt-8 rounded-2xl border border-dashed border-slate-300 p-5">
                <p className="font-bold text-slate-800">No host intro yet</p>
                <p className="mt-1 text-sm text-slate-500">This host has not added an about section yet.</p>
              </div>
            )}

            {profileDetails.length > 0 && (
              <div className="mt-8 border-t border-slate-200 pt-8">
                <div className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
                  {profileDetails.map((item) => (
                    <div key={item.label}>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{item.label}</p>
                      <p className="mt-1 text-base font-semibold leading-7 text-slate-800">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 px-7 py-5 md:border-l md:border-t-0">
            {[
              [hostProfile?.hostReviewCount || 0, "reviews received"],
              [hostProfile?.hostReviewCount ? formatRating(hostProfile.averageHostRating) : "No ratings yet", "average host rating"],
              [getHostDuration(hostProfile?.hostSince), "as host on CloudStay"],
            ].map(([value, label], index) => (
              <div key={label} className={index > 0 ? "border-t border-slate-200 py-5" : "pb-5"}>
                <p className="text-xl font-extrabold text-slate-950">{value}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 pt-10">
        <h2 className="text-3xl font-bold tracking-tight">Reviews written for this host</h2>
        {reviews.length === 0 ? (
          <div className="mt-6 rounded-[2rem] border border-dashed border-slate-300 bg-white p-10">
            <p className="font-bold">No host reviews yet.</p>
            <p className="mt-2 text-sm text-slate-500">Guest feedback about this host will appear here after reviewed stays.</p>
          </div>
        ) : (
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {visibleReviews.map((review) => (
              <HostReviewCard key={review.id} review={review} />
            ))}
          </div>
        )}
      </section>

      <section className="border-t border-slate-200 pt-10">
        <h2 className="text-3xl font-bold tracking-tight">Listings</h2>
        {listings.length === 0 ? (
          <div className="mt-6 rounded-[2rem] border border-dashed border-slate-300 bg-white p-10">
            <p className="font-bold">No public listings yet</p>
            <p className="mt-2 text-sm text-slate-500">This host does not have other public stays right now.</p>
          </div>
        ) : (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <HostListingCard
                key={listing.id}
                listing={listing}
                onOpen={() => onListingOpen(listing.id)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function HostProfileModal({ host, onClose, onListingOpen }) {
  const [hostProfile, setHostProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  useEffect(() => {
    let active = true;
    const hostId = host?.hostId || host?.id;

    const loadId = window.setTimeout(async () => {
      if (!hostId) {
        setLoading(false);
        setError("Host profile is unavailable.");
        return;
      }

      try {
        const data = await getHostProfile(hostId);
        if (active) {
          setHostProfile(data);
          setError("");
        }
      } catch (requestError) {
        if (active) {
          setError(requestError.response?.data?.message || "Could not load host profile.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(loadId);
    };
  }, [host]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Host profile"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-6xl overflow-hidden rounded-[2rem] bg-[#fffaf7] shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-950">Host Profile</h2>
            <p className="mt-1 text-sm text-slate-500">
              {host?.username || "CloudStay host"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-slate-200 text-xl text-slate-600 transition hover:bg-slate-50"
            aria-label="Close host profile"
          >
            x
          </button>
        </div>

        <div className="max-h-[82vh] overflow-y-auto p-6">
          {loading ? (
            <p className="rounded-[2rem] bg-white p-8 text-sm text-slate-500">Loading host profile...</p>
          ) : error ? (
            <div className="rounded-[2rem] border border-rose-100 bg-rose-50 p-8">
              <p className="font-bold text-rose-700">Host profile unavailable</p>
              <p className="mt-2 text-sm text-rose-600">{error}</p>
            </div>
          ) : (
            <HostProfileShowcase
              hostProfile={hostProfile}
              onListingOpen={onListingOpen}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function MeetHostSection({
  host,
  isOwner,
  user,
  openingChat,
  chatError,
  onMessageHost,
  onListingOpen,
}) {
  const [showProfile, setShowProfile] = useState(false);
  const rating = formatRating(host?.averageRating);
  const hostDuration = getHostDuration(host?.hostSince);

  return (
    <>
      <section className="border-b border-slate-200 py-8">
        <h2 className="text-xl font-bold text-slate-950">Meet your host</h2>
        <div className="mt-5 grid gap-5 md:grid-cols-[minmax(20rem,0.95fr)_minmax(0,1.05fr)] md:items-stretch">
          <button
            type="button"
            onClick={() => setShowProfile(true)}
            className="grid gap-5 rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md sm:grid-cols-[minmax(8rem,0.9fr)_minmax(9rem,1fr)]"
          >
            <div className="flex min-w-0 flex-col items-center justify-center text-center">
              <HostAvatar host={host} sizeClass="h-20 w-20" textClass="text-2xl" />
              <h3 className="mt-4 max-w-full break-words text-lg font-bold leading-6 text-slate-950">
                {host?.username || "CloudStay host"}
              </h3>
              <p className="mt-1 text-sm font-semibold text-slate-500">CloudStay host</p>
            </div>
            <div className="grid content-center divide-y divide-slate-100 text-sm">
              <div className="py-3 first:pt-0">
                <p className="text-xl font-extrabold text-slate-950">{host?.reviewCount || 0}</p>
                <p className="text-xs font-semibold text-slate-500">Reviews</p>
              </div>
              <div className="py-3">
                <p className="text-xl font-extrabold text-slate-950">{rating || "New"}</p>
                <p className="text-xs font-semibold text-slate-500">Rating</p>
              </div>
              <div className="py-3 last:pb-0">
                <p className="text-xl font-extrabold text-slate-950">{hostDuration}</p>
                <p className="text-xs font-semibold text-slate-500">as host on CloudStay</p>
              </div>
            </div>
          </button>

          <div className="p-1 md:p-5">
            <h3 className="text-base font-bold text-slate-950">About {host?.username || "this host"}</h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              {host?.aboutMe || "This host has not added an about section yet."}
            </p>
            {chatError && (
              <p role="alert" className="mt-4 text-sm font-semibold text-rose-600">
                {chatError}
              </p>
            )}
            <button
              type="button"
              onClick={onMessageHost}
              disabled={openingChat || isOwner}
              className="mt-5 rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {!user
                ? "Log in to message host"
                : openingChat
                  ? "Opening chat..."
                  : "Message your host"}
            </button>
          </div>
        </div>
      </section>

      {showProfile && (
        <HostProfileModal
          host={host}
          onClose={() => setShowProfile(false)}
          onListingOpen={(listingId) => {
            setShowProfile(false);
            window.scrollTo({ top: 0 });
            onListingOpen(listingId);
          }}
        />
      )}
    </>
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
      <div className="mt-5">
        <PropertyLocationMap
          address={listing.address || listing.location}
          latitude={listing.latitude}
          longitude={listing.longitude}
        />
      </div>
    </section>
  );
}

function ThingsToKnow({ listing }) { 
  const [expanded, setExpanded] = useState(false);
  const safetyFeatures = splitValues(listing.safetyFeatures);
  const houseRules = compactList([
    ["Check-in", listing.houseRulesCheckInTime || "Ask the host for the check-in time"],
    ["Checkout", listing.houseRulesCheckoutTime || "Ask the host for the checkout time"],
    ["Pets", yesNo(listing.houseRulesPetsAllowed, "Pets allowed", "No pets")],
    ["Smoking", yesNo(listing.houseRulesSmokingAllowed, "Smoking allowed", "No smoking")],
    ["Parties", yesNo(listing.houseRulesPartiesAllowed, "Parties allowed", "No parties or events")],
    ["Quiet hours", listing.houseRulesQuietHours],
    ["Notes", listing.houseRulesNotes],
  ]);
  const safety = compactList([
    ["Smoke alarm", yesNo(listing.safetySmokeAlarm, "Smoke alarm installed", "No smoke alarm reported")],
    ["Carbon monoxide alarm", yesNo(listing.safetyCarbonMonoxideAlarm, "Carbon monoxide alarm installed", "No carbon monoxide alarm reported")],
    ["Cameras", yesNo(listing.safetySecurityCameras, "Exterior/security cameras present", "No cameras reported")],
    ["Warnings", listing.safetyPropertyWarnings],
    ["Safety notes", listing.safetyNotes],
    ["Listed safety features", safetyFeatures.join(", ")],
  ]);
  const cancellation = compactList([
    ["Policy", listing.cancellationPolicyType || "Ask the host for cancellation terms"],
    ["Free cancellation", listing.cancellationFreeCancellationPeriod],
    ["Partial refund", listing.cancellationPartialRefundRule],
    ["Notes", listing.cancellationNotes],
  ]);
  const visibleCount = expanded ? 7 : 4;
  const groups = [
    ["House rules", houseRules],
    ["Safety and property", safety],
    ["Cancellation policy", cancellation],
  ];
  const hasHiddenRows = groups.some(([, values]) => values.length > visibleCount);

  return (
    <section className="py-8">
      <h2 className="text-xl font-bold text-slate-950">Things to know</h2>
      <div className="mt-5 grid gap-8 md:grid-cols-3">
        {groups.map(([title, values]) => (
          <div key={title}>
            <h3 className="text-sm font-bold text-slate-950">{title}</h3>
            <div className="mt-3 space-y-3">
              {values.slice(0, visibleCount).map((item) => (
                <div key={`${title}-${item.label}`}>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{item.label}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-700">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {hasHiddenRows && (
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="mt-6 text-sm font-bold text-slate-950 underline underline-offset-4"
        >
          {expanded ? "Show less" : "Learn more"}
        </button>
      )}
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
function ReviewBookingModal({ listing, checkIn, checkOut, guests, onClose }) {
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
      if (!result.checkoutUrl) {
        throw new Error("The payment session did not include a checkout URL.");
      }
      window.location.href = result.checkoutUrl;
    } catch (error) {
      console.error("Booking failed", error.response?.data || error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to start payment. Please try again.";
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
          You will pay securely now. The host will review your booking after payment.
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
            {isSubmitting ? "Opening checkout..." : "Continue to Payment"}
          </button>
        </div>
      </div>
    </div>
  );
}


// --- PROPERTY BOOKING CARD ---
function PropertyBookingCard({ listing, user }) {
  const navigate = useNavigate();
  const pickerControlsRef = useRef(null);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState({ adults: 1, children: 0, infants: 0 });
  const [activePicker, setActivePicker] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [availability, setAvailability] = useState(null);
  const [dateConflictMessage, setDateConflictMessage] = useState("");

  useEffect(() => {
    let active = true;
    const loadId = window.setTimeout(async () => {
      try {
        const data = await getPropertyAvailability(listing.id);
        if (active) setAvailability(data);
      } catch {
        if (active) setAvailability(null);
      }
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(loadId);
    };
  }, [listing.id]);

  useEffect(() => {
    if (!activePicker) return undefined;

    const closeOnClickAway = (event) => {
      if (
        pickerControlsRef.current &&
        !pickerControlsRef.current.contains(event.target)
      ) {
        setActivePicker("");
      }
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setActivePicker("");
    };

    document.addEventListener("pointerdown", closeOnClickAway);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnClickAway);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [activePicker]);

  const today = new Date();
  const todayValue = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const availableFrom = listing.availableFrom?.slice(0, 10);
  const availableTo = listing.availableTo?.slice(0, 10);
  const minimumDate =
    availableFrom && availableFrom > todayValue ? availableFrom : todayValue;
  const baseDatesValid =
    checkIn && checkOut && new Date(checkIn) < new Date(checkOut);
  const overlapsBlockedDates =
    baseDatesValid &&
    availability?.blockedRanges?.some(
      (range) =>
        range.checkIn.slice(0, 10) < checkOut &&
        range.checkOut.slice(0, 10) > checkIn,
    );
  const isValidDates = baseDatesValid && !overlapsBlockedDates;
  const guestCountValid = getGuestTotal(guests) <= Number(listing.guestCount || 0);
  const dateValidationMessage = overlapsBlockedDates
    ? "Those dates include an unavailable night."
    : dateConflictMessage;
  
  return (
    <>
      <aside className="h-fit self-start rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/70 lg:sticky lg:top-6">
        <p className="text-2xl font-bold text-slate-950">
          RM {listing.pricePerNight} <span className="text-sm font-semibold text-slate-500">night</span>
        </p>
        
        <div ref={pickerControlsRef} className="relative mt-5 grid grid-cols-2 rounded-2xl border border-slate-200">
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
                disabledRanges={availability?.blockedRanges || []}
                onBlockedSelection={() =>
                  setDateConflictMessage("Those dates include an unavailable night.")
                }
                onChange={({ startDate, endDate }) => {
                  setDateConflictMessage("");
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
            {listing.isAvailable ? "Reserve and pay" : "Currently unavailable"}
          </button>
        )}

        {user && !listing.isOwner && (!isValidDates || !guestCountValid || dateConflictMessage) && (
          <p className="mt-3 text-center text-xs font-semibold text-slate-500">
            {dateValidationMessage
              ? dateValidationMessage
              : "Select valid dates and a guest count within this listing's limit."}
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
        />
      )}
    </>
  );
}


// --- MAIN COMPONENT ---
function PropertyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openingChat, setOpeningChat] = useState(false);
  const [chatError, setChatError] = useState("");
  const [, setSavedRevision] = useState(0);

  const loadListing = useCallback((isActive = () => true) =>
    getProperty(id)
      .then((data) => {
        if (isActive()) {
          setListing(data);
          setError("");
        }
      })
      .catch((err) => {
        if (isActive()) {
          const status = err.response?.status;
          setError(status === 404 || status === 403 ? "unavailable" : "error");
        }
      })
      .finally(() => {
        if (isActive()) {
          setLoading(false);
        }
      }), [id]);

  useEffect(() => {
    let active = true;
    loadListing(() => active);
    return () => { active = false; };
  }, [loadListing]);

  useEffect(() => {
    const refresh = (event) => {
      const affectsListing =
        ["booking", "property"].includes(event.detail?.entity) &&
        (!event.detail?.propertyId || Number(event.detail.propertyId) === Number(id));
      if (affectsListing) loadListing();
    };
    window.addEventListener("cloudstay:data-changed", refresh);
    return () => window.removeEventListener("cloudstay:data-changed", refresh);
  }, [id, loadListing]);

  const isSaved =
    Boolean(listing && user) &&
    readSavedListings(user?.userId).some((saved) => saved.id === listing?.id);

  const handlePublish = async () => setListing(await publishListing(id));
  const handleUnpublish = async () => setListing(await unpublishListing(id));

  const handleMessageHost = async () => {
    if (!user) {
      navigate(`/login?returnTo=${encodeURIComponent(`/properties/${listing?.id || id}`)}`);
      return;
    }

    if (!listing || listing.isOwner || openingChat) return;

    setOpeningChat(true);
    setChatError("");

    try {
      const conversation = await getOrCreatePropertyConversation(listing.id);
      navigate(`/messages/${conversation.id}`);
    } catch (requestError) {
      setChatError(
        requestError?.response?.data?.message || "Could not open the conversation.",
      );
      setOpeningChat(false);
    }
  };

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
          !listing.isOwner ? (
            <button
              type="button"
              onClick={() => navigate("/explore")}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-slate-300"
            >
              Back to Explore
            </button>
          ) : null
        }
      />

      <main className="mx-auto w-full max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8">
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

          <section className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="min-w-0">
              <PropertySummary listing={listing} />
              <HostInfoCard host={listing.host} />
              <ListingHighlights listing={listing} />

              <section className="border-b border-slate-200 py-6">
                <h2 className="text-xl font-bold text-slate-950">About this place</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">{listing.description}</p>
              </section>

              <PropertyAmenities listing={listing} />

              <AvailabilityCalendar propertyId={listing.id} />

              <LocationSection listing={listing} />

              <PropertyReviews propertyId={listing.id} />

              <MeetHostSection
                host={listing.host}
                isOwner={listing.isOwner}
                user={user}
                openingChat={openingChat}
                chatError={chatError}
                onMessageHost={handleMessageHost}
                onListingOpen={(listingId) => navigate(`/properties/${listingId}`)}
              />

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
