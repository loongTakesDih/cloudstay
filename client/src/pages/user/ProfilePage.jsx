import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppHeader from "../../components/AppHeader";
import UserProfileModal from "../../components/UserProfileModal";
import { getMyHostProfile, getMyReviews, getMyTrips, updateMyProfile } from "../../api/api.js";
import { useAuth } from "../../context/useAuth";

const sections = [
  { id: "about-me", label: "About me" },
  { id: "past-trips", label: "Past trips" },
  { id: "connections", label: "Connections" },
];

const validSections = [...sections.map((item) => item.id), "edit-profile"];

const profileFields = [
  ["dreamDestination", "Where I've always wanted to go", "Kyoto in spring"],
  ["work", "My work", "Product designer, teacher, founder"],
  ["uselessSkill", "My most useless skill", "Remembering movie release years"],
  ["pets", "Pets", "One tabby cat named Milo"],
  ["birthDecade", "Decade I was born", "1990s"],
  ["school", "Where I went to school", "University of Malaya"],
  ["spendTooMuchTime", "I spend too much time", "Planning weekend cafes"],
  ["funFact", "My fun fact", "I once learned to make pasta in Rome"],
  ["favoriteHighSchoolSong", "My favorite song in high school", "A song that still makes me smile"],
  ["biographyTitle", "My biography title would be", "Always Checking In"],
  ["obsessedWith", "I'm obsessed with", "Good coffee and quiet streets"],
  ["languages", "Languages I speak", "English, Malay, Mandarin"],
  ["livesIn", "Where I live", "Kuala Lumpur, Malaysia"],
];

const profileFieldIcons = {
  dreamDestination: "pin",
  work: "briefcase",
  uselessSkill: "star",
  pets: "heart",
  birthDecade: "calendar",
  school: "book",
  spendTooMuchTime: "clock",
  funFact: "star",
  favoriteHighSchoolSong: "music",
  biographyTitle: "book",
  obsessedWith: "heart",
  languages: "language",
  livesIn: "home",
  aboutMe: "user",
  interests: "tag",
};

const interestOptions = [
  "Travel",
  "Food",
  "Music",
  "Movies",
  "Gaming",
  "Reading",
  "Sports",
  "Photography",
  "Hiking",
  "Fitness",
  "Pets",
  "Art",
  "Fashion",
  "Technology",
  "Cooking",
  "Nature",
  "Coffee",
  "Museums",
  "Nightlife",
  "Volunteering",
  "Architecture",
  "Wellness",
  "Local culture",
  "Road trips",
];

const emptyProfile = {
  dreamDestination: "",
  work: "",
  uselessSkill: "",
  pets: "",
  birthDecade: "",
  school: "",
  spendTooMuchTime: "",
  funFact: "",
  favoriteHighSchoolSong: "",
  biographyTitle: "",
  obsessedWith: "",
  languages: "",
  livesIn: "",
  aboutMe: "",
  interests: [],
};

const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat("en-MY", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(new Date(value))
    : "Date unavailable";

const getTimeOnCloudStay = (createdAt) => {
  if (!createdAt) return "Recently joined";
  const joined = new Date(createdAt);
  if (Number.isNaN(joined.getTime())) return "Recently joined";

  const diffMs = Date.now() - joined.getTime();
  if (diffMs < 24 * 60 * 60 * 1000) return "Less than a day";

  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  return `${days} day${days === 1 ? "" : "s"}`;
};

const getHostDuration = (hostSince) => {
  if (!hostSince) return "Host date unavailable";
  const started = new Date(hostSince);
  if (Number.isNaN(started.getTime())) return "Host date unavailable";

  const diffMs = Date.now() - started.getTime();
  if (diffMs < 24 * 60 * 60 * 1000) return "Less than a day";

  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  return `${days} day${days === 1 ? "" : "s"}`;
};

const formatHostRating = (value) => {
  const rating = Number(value);
  return Number.isFinite(rating) ? rating.toFixed(1) : "No ratings yet";
};

const renderStars = (rating) => "*".repeat(Math.max(0, Math.min(5, Math.round(Number(rating) || 0))));

const isPastTrip = (trip) => {
  const status = String(trip.status || "").toLowerCase();
  return (
    status === "checkedout" ||
    status === "completed" ||
    (trip.checkOut && new Date(trip.checkOut) < new Date())
  );
};

const buildProfile = (user) => ({
  ...emptyProfile,
  ...Object.fromEntries(
    Object.keys(emptyProfile)
      .filter((key) => key !== "interests")
      .map((key) => [key, user?.[key] || ""]),
  ),
  interests: Array.isArray(user?.interests) ? user.interests : [],
});

function TripCard({ trip, onOpen }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="overflow-hidden rounded-3xl border border-slate-200 bg-white text-left transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="h-36 bg-gradient-to-br from-rose-100 to-slate-200">
        {trip.property?.imageUrl && (
          <img src={trip.property.imageUrl} alt="" className="h-full w-full object-cover" />
        )}
      </div>
      <div className="p-5">
        <h3 className="truncate text-lg font-bold">{trip.property?.title || "CloudStay property"}</h3>
        <p className="mt-1 truncate text-sm text-slate-500">{trip.property?.location || "Location unavailable"}</p>
        <p className="mt-4 text-xs font-bold uppercase tracking-wide text-slate-500">
          {formatDate(trip.checkIn)} - {formatDate(trip.checkOut)}
        </p>
      </div>
    </button>
  );
}

function ProfileHero({ user, profile, pastTrips, reviews, onEdit }) {
  const profileItems = profileFields
    .map(([key, label]) => [label, profile[key]])
    .filter(([, value]) => String(value || "").trim());

  return (
    <div className="space-y-12">
      <section>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">About me</h1>
            <p className="mt-3 max-w-2xl text-slate-500">
              A profile helps hosts and guests feel confident about who they are meeting.
            </p>
          </div>
          <button
            type="button"
            onClick={onEdit}
            className="w-fit rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
          >
            Edit profile
          </button>
        </div>

        <div className="mt-7 grid overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm md:grid-cols-[1fr_220px]">
          <div className="p-8 sm:p-10">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="grid h-32 w-32 shrink-0 place-items-center rounded-full bg-slate-950 text-5xl font-bold text-white">
                {(user?.username || "C").slice(0, 1).toUpperCase()}
              </div>
              <div>
                <h2 className="text-3xl font-bold">{user?.username || "Traveler"}</h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {user?.isHost ? "Guest and host" : "CloudStay guest"}
                </p>
                {profile.livesIn && <p className="mt-3 text-sm font-semibold text-slate-700">{profile.livesIn}</p>}
              </div>
            </div>

            {profile.aboutMe ? (
              <p className="mt-8 max-w-3xl text-base leading-8 text-slate-700">{profile.aboutMe}</p>
            ) : (
              <div className="mt-8 rounded-2xl border border-dashed border-slate-300 p-5">
                <p className="font-bold text-slate-800">Add a short intro about yourself</p>
                <p className="mt-1 text-sm text-slate-500">Share how you travel, host, or spend your weekends.</p>
              </div>
            )}

            {profileItems.length > 0 && (
              <div className="mt-8 border-t border-slate-200 pt-8">
                <div className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
                  {profileItems.map(([label, value]) => (
                    <div key={label}>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
                      <p className="mt-1 text-base font-semibold leading-7 text-slate-800">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 px-7 py-5 md:border-l md:border-t-0">
            {[
              [pastTrips.length, pastTrips.length === 1 ? "trip" : "trips"],
              [reviews.length, reviews.length === 1 ? "review" : "reviews"],
              [getTimeOnCloudStay(user?.createdAt), "on CloudStay"],
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
        <h2 className="text-3xl font-bold tracking-tight">Interests</h2>
        {profile.interests.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No interests selected yet.</p>
        ) : (
          <div className="mt-5 flex flex-wrap gap-2">
            {profile.interests.map((interest) => (
              <span key={interest} className="rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm">
                {interest}
              </span>
            ))}
          </div>
        )}
      </section>

      <section className="border-t border-slate-200 pt-10">
        <h2 className="text-3xl font-bold tracking-tight">Reviews I've written</h2>
        {reviews.length === 0 ? (
          <div className="mt-6 rounded-[2rem] border border-dashed border-slate-300 bg-white p-10">
            <p className="font-bold">No reviews written yet</p>
            <p className="mt-2 text-sm text-slate-500">Reviews you leave after a stay will be collected here.</p>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {reviews.map((review) => (
              <article key={review.id} className="rounded-3xl border border-slate-200 bg-white p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-bold">{review.propertyTitle}</h3>
                  <span className="text-sm font-bold text-amber-500">
                    {"*".repeat(Math.round(review.overallRating))}
                  </span>
                </div>
                <p className="mt-3 leading-7 text-slate-600">{review.comment}</p>
                <p className="mt-4 text-xs font-semibold text-slate-400">{formatDate(review.createdAt)}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function HostReviewsModal({ reviews, onClose, onOpenGuest, onOpenComment }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl overflow-hidden rounded-[2rem] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-slate-950">Host reviews</h2>
            <p className="mt-1 text-sm text-slate-500">Reviews written for you by guests.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 text-xl hover:bg-slate-50"
            aria-label="Close host reviews"
          >
            x
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-6">
          <div className="space-y-4">
            {reviews.map((review) => (
              <article key={review.id} className="rounded-3xl border border-slate-200 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    {review.guestId ? (
                      <button
                        type="button"
                        onClick={() => onOpenGuest(review)}
                        className="font-bold text-rose-600 underline-offset-4 hover:underline"
                      >
                        {review.guestName || "Guest"}
                      </button>
                    ) : (
                      <h3 className="font-bold text-slate-950">{review.guestName || "Guest"}</h3>
                    )}
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {review.propertyTitle || "CloudStay property"} - {formatDate(review.createdAt)}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-amber-500">{renderStars(review.rating)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenComment(review)}
                  className="mt-4 block w-full text-left leading-7 text-slate-600 transition hover:text-slate-900"
                >
                  {review.comment || "No written host review."}
                </button>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewDetailModal({ review, onClose, onViewGuest }) {
  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Guest review"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg overflow-hidden rounded-[2rem] bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
          <div>
            <h2 className="text-lg font-bold text-slate-950">Guest review</h2>
            <p className="mt-1 text-sm text-slate-500">
              {review.propertyTitle || "CloudStay property"} - {formatDate(review.createdAt)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-slate-200 text-xl leading-none text-slate-600 transition hover:bg-slate-50"
            aria-label="Close review"
          >
            x
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-6">
          <div className="flex items-center justify-between gap-3">
            {review.guestId && onViewGuest ? (
              <button
                type="button"
                onClick={onViewGuest}
                className="font-bold text-rose-600 underline-offset-4 hover:underline"
              >
                {review.guestName || "Guest"}
              </button>
            ) : (
              <h3 className="font-bold text-slate-950">{review.guestName || "Guest"}</h3>
            )}
            <span className="text-sm font-bold text-amber-500">{renderStars(review.rating)}</span>
          </div>
          <p className="mt-4 whitespace-pre-line leading-7 text-slate-700">
            {review.comment || "No written host review."}
          </p>
        </div>
      </div>
    </div>
  );
}

function HostReviewCard({ review, onOpenGuest, onOpenComment }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          {review.guestId ? (
            <button
              type="button"
              onClick={() => onOpenGuest(review)}
              className="font-bold text-rose-600 underline-offset-4 hover:underline"
            >
              {review.guestName || "Guest"}
            </button>
          ) : (
            <h3 className="font-bold text-slate-950">{review.guestName || "Guest"}</h3>
          )}
          <p className="mt-1 text-xs font-semibold text-slate-500">{formatDate(review.createdAt)}</p>
        </div>
        <span className="shrink-0 text-sm font-bold text-amber-500">{renderStars(review.rating)}</span>
      </div>
      <button
        type="button"
        onClick={() => onOpenComment(review)}
        className="mt-4 block w-full text-left text-sm leading-7 text-slate-600 transition hover:text-slate-900"
      >
        <span className="line-clamp-4">{review.comment || "No written host review."}</span>
      </button>
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
          RM {listing.pricePerNight} <span className="font-normal text-slate-500">per night</span>
        </p>
      </div>
    </button>
  );
}

function HostProfileView({ data, profile, onEdit, onListingOpen }) {
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [guestProfile, setGuestProfile] = useState(null);
  const [activeReview, setActiveReview] = useState(null);
  const openGuest = (review) =>
    setGuestProfile({ id: review.guestId, name: review.guestName });
  const openComment = (review) => setActiveReview(review);
  const reviews = data?.hostReviews || [];
  const listings = data?.listings || [];
  const visibleReviews = reviews.slice(0, 3);
  const profileItems = profileFields
    .map(([key, label]) => [label, profile[key]])
    .filter(([, value]) => String(value || "").trim());

  return (
    <div className="space-y-12">
      <section>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Host Profile</h1>
            <p className="mt-3 max-w-2xl text-slate-500">
              Your host profile highlights guest feedback, hosting history, and active listings.
            </p>
          </div>
          <button
            type="button"
            onClick={onEdit}
            className="w-fit rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
          >
            Edit profile
          </button>
        </div>

        <div className="mt-7 grid overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm md:grid-cols-[1fr_240px]">
          <div className="p-8 sm:p-10">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="grid h-32 w-32 shrink-0 place-items-center rounded-full bg-slate-950 text-5xl font-bold text-white">
                {(data?.username || "H").slice(0, 1).toUpperCase()}
              </div>
              <div>
                <h2 className="text-3xl font-bold">{data?.username || "CloudStay host"}</h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">CloudStay host</p>
                {profile.livesIn && <p className="mt-3 text-sm font-semibold text-slate-700">{profile.livesIn}</p>}
              </div>
            </div>

            {profile.aboutMe ? (
              <p className="mt-8 max-w-3xl text-base leading-8 text-slate-700">{profile.aboutMe}</p>
            ) : (
              <div className="mt-8 rounded-2xl border border-dashed border-slate-300 p-5">
                <p className="font-bold text-slate-800">Add a short intro for guests</p>
                <p className="mt-1 text-sm text-slate-500">Share your hosting style and what guests can expect.</p>
              </div>
            )}

            {profileItems.length > 0 && (
              <div className="mt-8 border-t border-slate-200 pt-8">
                <div className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
                  {profileItems.map(([label, value]) => (
                    <div key={label}>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
                      <p className="mt-1 text-base font-semibold leading-7 text-slate-800">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 px-7 py-5 md:border-l md:border-t-0">
            {[
              [data?.hostReviewCount || 0, "reviews received"],
              [data?.hostReviewCount ? formatHostRating(data.averageHostRating) : "No ratings yet", "average host rating"],
              [getHostDuration(data?.hostSince), "as host on CloudStay"],
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
        <h2 className="text-3xl font-bold tracking-tight">Reviews written for me by guests</h2>
        {reviews.length === 0 ? (
          <div className="mt-6 rounded-[2rem] border border-dashed border-slate-300 bg-white p-10">
            <p className="font-bold">No host reviews yet.</p>
            <p className="mt-2 text-sm text-slate-500">Guest feedback about your hosting will appear here after reviewed stays.</p>
          </div>
        ) : (
          <>
            <div className="mt-6 grid gap-5 md:grid-cols-3">
              {visibleReviews.map((review) => (
                <HostReviewCard
                  key={review.id}
                  review={review}
                  onOpenGuest={openGuest}
                  onOpenComment={openComment}
                />
              ))}
            </div>
            {reviews.length > 3 && (
              <button
                type="button"
                onClick={() => setShowAllReviews(true)}
                className="mt-6 rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-slate-400"
              >
                Show more reviews
              </button>
            )}
          </>
        )}
      </section>

      <section className="border-t border-slate-200 pt-10">
        <h2 className="text-3xl font-bold tracking-tight">My listings</h2>
        {listings.length === 0 ? (
          <div className="mt-6 rounded-[2rem] border border-dashed border-slate-300 bg-white p-10">
            <p className="font-bold">No listings yet</p>
            <p className="mt-2 text-sm text-slate-500">Your hosted stays will appear here.</p>
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

      {showAllReviews && (
        <HostReviewsModal
          reviews={reviews}
          onClose={() => setShowAllReviews(false)}
          onOpenGuest={openGuest}
          onOpenComment={openComment}
        />
      )}

      {activeReview && (
        <ReviewDetailModal
          review={activeReview}
          onClose={() => setActiveReview(null)}
          onViewGuest={
            activeReview.guestId
              ? () => {
                  openGuest(activeReview);
                  setActiveReview(null);
                }
              : undefined
          }
        />
      )}

      {guestProfile?.id && (
        <UserProfileModal
          userId={guestProfile.id}
          fallbackName={guestProfile.name || "Guest"}
          title="Guest profile"
          onClose={() => setGuestProfile(null)}
        />
      )}
    </div>
  );
}

function ProfileIcon({ type }) {
  const commonProps = {
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    strokeWidth: "1.9",
    viewBox: "0 0 24 24",
    className: "h-5 w-5",
    "aria-hidden": "true",
  };
  const paths = {
    pin: <><path d="M12 21s6-5.4 6-11a6 6 0 1 0-12 0c0 5.6 6 11 6 11Z" /><path d="M12 10.5h.01" /></>,
    briefcase: <><path d="M9 7V5.8A1.8 1.8 0 0 1 10.8 4h2.4A1.8 1.8 0 0 1 15 5.8V7" /><path d="M4 8.5h16v9A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5v-9Z" /><path d="M4 12h16" /></>,
    star: <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" />,
    heart: <path d="M20.8 5.6a5 5 0 0 0-7.1 0L12 7.3l-1.7-1.7a5 5 0 1 0-7.1 7.1L12 21l8.8-8.3a5 5 0 0 0 0-7.1Z" />,
    calendar: <><path d="M7 3v3" /><path d="M17 3v3" /><path d="M4 8h16" /><path d="M5 5h14a1 1 0 0 1 1 1v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a1 1 0 0 1 1-1Z" /></>,
    book: <><path d="M5 4h9a3 3 0 0 1 3 3v13H8a3 3 0 0 0-3 3V4Z" /><path d="M17 7h2v13h-2" /></>,
    clock: <><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" /><path d="M12 7v5l3 2" /></>,
    music: <><path d="M9 18V6l10-2v12" /><path d="M9 18a3 3 0 1 1-3-3 3 3 0 0 1 3 3Z" /><path d="M19 16a3 3 0 1 1-3-3 3 3 0 0 1 3 3Z" /></>,
    language: <><path d="M4 5h9" /><path d="M9 3v2" /><path d="M6 9c1.2 3 3.5 5 7 6" /><path d="M12 9c-1.1 2.7-3.3 4.8-7 6" /><path d="m14 21 4-9 4 9" /><path d="M15.5 18h5" /></>,
    home: <><path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10" /><path d="M9 20v-6h6v6" /></>,
    user: <><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    tag: <><path d="M20 13 12 21 3 12V4h8l9 9Z" /><path d="M7.5 7.5h.01" /></>,
  };

  return <svg {...commonProps}>{paths[type] || paths.user}</svg>;
}

function EditableProfileRow({ icon, title, value, placeholder, onClick }) {
  const hasValue = Boolean(String(value || "").trim());

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-4 border-b border-slate-100 px-1 py-5 text-left last:border-b-0"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-slate-50 text-slate-700">
        <ProfileIcon type={icon} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-bold text-slate-950">{title}</span>
        <span className={`mt-1 block truncate text-sm ${hasValue ? "text-slate-600" : "text-slate-400"}`}>
          {hasValue ? value : placeholder}
        </span>
      </span>
      <span className="text-2xl leading-none text-slate-300">+</span>
    </button>
  );
}

function FieldEditorModal({ field, value, onClose, onSave }) {
  const [draft, setDraft] = useState(value || "");

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[2rem] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-slate-50 text-slate-700">
              <ProfileIcon type={field.icon} />
            </span>
            <h2 className="text-xl font-bold text-slate-950">{field.label}</h2>
          </div>
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 text-xl leading-none hover:bg-slate-50" aria-label="Close editor">
            x
          </button>
        </div>
        <div className="p-6">
          {field.multiline ? (
            <textarea
              rows="6"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={field.placeholder}
              className="w-full resize-none rounded-2xl border border-slate-300 px-4 py-3 leading-7 outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
              autoFocus
            />
          ) : (
            <input
              type="text"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={field.placeholder}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
              autoFocus
            />
          )}
        </div>
        <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
          <button type="button" onClick={onClose} className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-bold">
            Cancel
          </button>
          <button type="button" onClick={() => onSave(draft)} className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-bold text-white">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function InterestsEditorModal({ selectedInterests, onClose, onSave }) {
  const [draft, setDraft] = useState(selectedInterests);
  const toggleInterest = (interest) => {
    setDraft((current) =>
      current.includes(interest)
        ? current.filter((item) => item !== interest)
        : [...current, interest],
    );
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-[2rem] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-slate-50 text-slate-700">
              <ProfileIcon type="tag" />
            </span>
            <h2 className="text-xl font-bold text-slate-950">Interests</h2>
          </div>
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 text-xl leading-none hover:bg-slate-50" aria-label="Close interests">
            x
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-6">
          <div className="flex flex-wrap gap-2">
            {interestOptions.map((interest) => {
              const selected = draft.includes(interest);
              return (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  className={`rounded-full border px-4 py-2 text-sm font-bold transition ${
                    selected
                      ? "border-rose-500 bg-rose-50 text-rose-700"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {interest}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
          <button type="button" onClick={onClose} className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-bold">
            Cancel
          </button>
          <button type="button" onClick={() => onSave(draft)} className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-bold text-white">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function EditProfile({ initialProfile, onSaved }) {
  const { updateUser } = useAuth();
  const [form, setForm] = useState(initialProfile);
  const [activeEditor, setActiveEditor] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const handleSubmit = async () => {
    setSaving(true);
    setError("");

    try {
      const updated = await updateMyProfile(form);
      updateUser(updated);
      onSaved(buildProfile(updated));
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Could not save your profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section>
      <h1 className="text-4xl font-bold tracking-tight">Edit profile</h1>
      <p className="mt-3 max-w-2xl text-slate-500">
        Add the details you want guests and hosts to see on your CloudStay profile.
      </p>

      <div className="mt-8 space-y-8">
        <section className="rounded-[2rem] bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">My profile</h2>
          <div className="mt-4">
            {profileFields.map(([key, label, placeholder]) => (
              <EditableProfileRow
                key={key}
                icon={profileFieldIcons[key]}
                title={label}
                value={form[key]}
                placeholder={placeholder}
                onClick={() =>
                  setActiveEditor({
                    type: "field",
                    key,
                    label,
                    placeholder,
                    icon: profileFieldIcons[key],
                  })
                }
              />
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">About me</h2>
          <div className="mt-4">
            <EditableProfileRow
              icon={profileFieldIcons.aboutMe}
              title="About me"
              value={form.aboutMe}
              placeholder="Write a short paragraph about yourself"
              onClick={() =>
                setActiveEditor({
                  type: "field",
                  key: "aboutMe",
                  label: "About me",
                  placeholder: "Write a short paragraph about yourself, how you travel, or what guests can expect from you.",
                  icon: profileFieldIcons.aboutMe,
                  multiline: true,
                })
              }
            />
          </div>
        </section>

        <section className="rounded-[2rem] bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">Interests</h2>
          <div className="mt-4">
            <EditableProfileRow
              icon={profileFieldIcons.interests}
              title="Choose your interests"
              value={form.interests.length > 0 ? form.interests.join(", ") : ""}
              placeholder="Add travel, food, music, hiking, and more"
              onClick={() => setActiveEditor({ type: "interests" })}
            />
          </div>
          {form.interests.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {form.interests.map((interest) => (
                <span key={interest} className="rounded-full bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600">
                  {interest}
                </span>
              ))}
            </div>
          )}
        </section>

        {error && <p className="rounded-2xl bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</p>}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className="rounded-full bg-rose-500 px-6 py-3 text-sm font-bold text-white transition hover:bg-rose-600 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save profile"}
        </button>
      </div>

      {activeEditor?.type === "field" && (
        <FieldEditorModal
          key={activeEditor.key}
          field={activeEditor}
          value={form[activeEditor.key]}
          onClose={() => setActiveEditor(null)}
          onSave={(value) => {
            update(activeEditor.key, value);
            setActiveEditor(null);
          }}
        />
      )}

      {activeEditor?.type === "interests" && (
        <InterestsEditorModal
          selectedInterests={form.interests}
          onClose={() => setActiveEditor(null)}
          onSave={(value) => {
            update("interests", value);
            setActiveEditor(null);
          }}
        />
      )}
    </section>
  );
}

function PastTrips({ trips, loading, onOpen }) {
  return (
    <section>
      <h1 className="text-4xl font-bold tracking-tight">Past trips</h1>
      <p className="mt-3 text-slate-500">Open a previous booking to revisit its dates, price, messages, and review.</p>
      {loading ? (
        <p className="mt-8 text-sm text-slate-500">Loading past trips...</p>
      ) : trips.length === 0 ? (
        <div className="mt-8 rounded-[2rem] border border-dashed border-slate-300 bg-white p-10">
          <p className="font-bold">No past trips yet</p>
          <p className="mt-2 text-sm text-slate-500">Completed stays will appear here.</p>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {trips.map((trip) => (
            <TripCard key={trip.id} trip={trip} onOpen={() => onOpen(trip.id)} />
          ))}
        </div>
      )}
    </section>
  );
}

function Connections({ connections }) {
  return (
    <section>
      <h1 className="text-4xl font-bold tracking-tight">Connections</h1>
      <p className="mt-3 text-slate-500">Hosts you've stayed with through CloudStay.</p>
      {connections.length === 0 ? (
        <div className="mt-8 rounded-[2rem] border border-dashed border-slate-300 bg-white p-10">
          <p className="font-bold">No host connections yet</p>
          <p className="mt-2 text-sm text-slate-500">Hosts from your completed bookings will appear here.</p>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {connections.map((host) => (
            <article key={host.id} className="flex items-center gap-4 rounded-3xl border border-slate-200 bg-white p-5">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-slate-950 text-xl font-bold text-white">
                {(host.username || "H").slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-lg font-bold">{host.username || "CloudStay host"}</h2>
                <p className="mt-1 text-sm text-slate-500">Previous host</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function ProfilePage() {
  const navigate = useNavigate();
  const { section = "about-me" } = useParams();
  const { user } = useAuth();
  const activeSection = validSections.includes(section) ? section : "about-me";
  const [savedProfile, setSavedProfile] = useState(null);
  const [trips, setTrips] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [profileMode, setProfileMode] = useState("guest");
  const [hostProfile, setHostProfile] = useState(null);
  const [hostProfileLoading, setHostProfileLoading] = useState(false);
  const [hostProfileError, setHostProfileError] = useState("");
  const [loading, setLoading] = useState(true);
  const profile = useMemo(() => savedProfile ?? buildProfile(user), [savedProfile, user]);
  const activeProfileMode = user?.isHost ? profileMode : "guest";

  const loadProfileData = useCallback(() => {
    Promise.allSettled([getMyTrips(), getMyReviews()])
      .then(([tripResult, reviewResult]) => {
        setTrips(tripResult.status === "fulfilled" ? tripResult.value : []);
        setReviews(reviewResult.status === "fulfilled" ? reviewResult.value : []);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  useEffect(() => {
    if (!user?.isHost || activeProfileMode !== "host") return undefined;

    let active = true;
    const loadId = window.setTimeout(() => {
      setHostProfileLoading(true);
      setHostProfileError("");

      getMyHostProfile()
        .then((data) => {
          if (active) setHostProfile(data);
        })
        .catch((requestError) => {
          if (active) {
            setHostProfileError(
              requestError.response?.data?.message || "Could not load host profile.",
            );
          }
        })
        .finally(() => {
          if (active) setHostProfileLoading(false);
        });
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(loadId);
    };
  }, [activeProfileMode, user?.isHost]);

  useEffect(() => {
    const refresh = (event) => {
      if (["booking", "review"].includes(event.detail?.entity)) {
        loadProfileData();
      }
    };
    window.addEventListener("cloudstay:data-changed", refresh);
    return () => window.removeEventListener("cloudstay:data-changed", refresh);
  }, [loadProfileData]);

  const pastTrips = useMemo(
    () => trips.filter(isPastTrip).sort((a, b) => new Date(b.checkOut) - new Date(a.checkOut)),
    [trips],
  );

  const connections = useMemo(() => {
    const uniqueHosts = new Map();
    pastTrips.forEach((trip) => {
      const host = trip.property?.host;
      if (host?.id && !uniqueHosts.has(host.id)) uniqueHosts.set(host.id, host);
    });
    return [...uniqueHosts.values()];
  }, [pastTrips]);

  return (
    <div className="min-h-screen bg-[#fffaf7] text-slate-950">
      <AppHeader />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[260px_1fr]">
          <aside className="lg:border-r lg:border-slate-300 lg:pr-8">
            <h1 className="text-4xl font-bold tracking-tight">Profile</h1>
            <nav className="mt-8 flex gap-2 overflow-x-auto lg:flex-col" aria-label="Profile sections">
              {sections.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate(`/profile/${item.id}`)}
                  className={`shrink-0 rounded-xl px-4 py-3 text-left text-sm font-bold transition ${
                    activeSection === item.id
                      ? "bg-slate-950 text-white"
                      : "text-slate-600 hover:bg-white hover:text-slate-950"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </aside>

          <div className="min-w-0 lg:pl-4">
            {user?.isHost && activeSection === "about-me" && (
              <div className="mb-8 inline-flex rounded-full bg-white p-1 shadow-sm" aria-label="Profile mode">
                {[
                  ["guest", "Guest Profile"],
                  ["host", "Host Profile"],
                ].map(([mode, label]) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setProfileMode(mode)}
                    className={`rounded-full px-5 py-2.5 text-sm font-bold transition ${
                      activeProfileMode === mode
                        ? "bg-slate-950 text-white"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            {activeSection === "about-me" && activeProfileMode === "guest" && (
              <ProfileHero
                user={user}
                profile={profile}
                pastTrips={pastTrips}
                reviews={reviews}
                onEdit={() => navigate("/profile/edit-profile")}
              />
            )}
            {activeSection === "about-me" && activeProfileMode === "host" && (
              hostProfileLoading ? (
                <p className="rounded-[2rem] bg-white p-8 text-sm text-slate-500">Loading host profile...</p>
              ) : hostProfileError ? (
                <div className="rounded-[2rem] border border-rose-100 bg-rose-50 p-8">
                  <p className="font-bold text-rose-700">Host profile unavailable</p>
                  <p className="mt-2 text-sm text-rose-600">{hostProfileError}</p>
                </div>
              ) : (
                <HostProfileView
                  data={hostProfile}
                  profile={profile}
                  onEdit={() => navigate("/profile/edit-profile")}
                  onListingOpen={(listingId) => navigate(`/properties/${listingId}`)}
                />
              )
            )}
            {activeSection === "edit-profile" && (
              <EditProfile
                key={user?.userId || "profile"}
                initialProfile={profile}
                onSaved={(nextProfile) => {
                  setSavedProfile(nextProfile);
                  navigate("/profile/about-me");
                }}
              />
            )}
            {activeSection === "past-trips" && (
              <PastTrips trips={pastTrips} loading={loading} onOpen={(bookingId) => navigate(`/trips/${bookingId}`)} />
            )}
            {activeSection === "connections" && <Connections connections={connections} />}
          </div>
        </div>
      </main>
    </div>
  );
}

export default ProfilePage;
