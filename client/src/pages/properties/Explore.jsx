import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getPublicListings } from "../../api/api.js";
import DateRangePicker from "../../components/DateRangePicker.jsx";
import GuestPicker from "../../components/GuestPicker.jsx";
import MarketplaceHeader from "../../components/MarketplaceHeader";
import { useAuth } from "../../context/useAuth.js";
import { readSavedListings, writeSavedListings } from "../../utils/localState.js";
import {
  emptyGuestSelection,
  formatGuests,
  getGuestTotal,
  popularCities,
} from "../../utils/searchOptions.js";

const today = () => {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
};

const formatRange = (startDate, endDate) => {
  if (!startDate) return "Add dates";
  const format = (value) =>
    new Date(`${value}T00:00:00`).toLocaleDateString("en-MY", {
      day: "numeric",
      month: "short",
    });
  return endDate ? `${format(startDate)} – ${format(endDate)}` : `${format(startDate)} – Add end`;
};

const applyFilters = (sourceListings, filters) => {
  const destination = filters.where.trim().toLowerCase();
  const requestedGuests = getGuestTotal(filters.guests);
  const checkIn = filters.startDate;
  const checkOut = filters.endDate;

  return sourceListings.filter((listing) => {
    const matchesWhere =
      !destination ||
      [
        listing.city,
        listing.state,
        listing.country,
        listing.title,
        listing.location,
        listing.address,
        listing.addressLine,
        listing.postalCode,
        listing.propertyCategory,
        listing.placeType,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(destination));

    const availableFrom = listing.availableFrom?.slice(0, 10);
    const availableTo = listing.availableTo?.slice(0, 10);
    const matchesDates =
      !checkIn ||
      !checkOut ||
      ((!availableFrom || checkIn >= availableFrom) && (!availableTo || checkOut <= availableTo));

    const matchesGuests =
      requestedGuests === 0 || requestedGuests <= Number(listing.guestCount || 0);

    return matchesWhere && matchesDates && matchesGuests;
  });
};

function ExploreStays() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const [filteredListings, setFilteredListings] = useState([]);
  const [, setSavedRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activePicker, setActivePicker] = useState("");
  const [filters, setFilters] = useState({
    where: "",
    startDate: "",
    endDate: "",
    guests: { ...emptyGuestSelection },
  });
  const filtersRef = useRef(filters);
  const searchControlsRef = useRef(null);

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  useEffect(() => {
    if (!activePicker) return undefined;

    const closeOnClickAway = (event) => {
      if (
        searchControlsRef.current &&
        !searchControlsRef.current.contains(event.target)
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

  const loadListings = useCallback(async () => {
    try {
      const data = await getPublicListings();
      setListings(data);
      setFilteredListings(applyFilters(data, filtersRef.current));
      setError("");
    } catch (err) {
      console.error("Failed to fetch listings", err);
      setError("Could not load stays. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialLoadId = window.setTimeout(loadListings, 0);
    return () => window.clearTimeout(initialLoadId);
  }, [loadListings]);

  useEffect(() => {
    const refresh = (event) => {
      if (["booking", "property"].includes(event.detail?.entity)) {
        loadListings();
      }
    };
    window.addEventListener("cloudstay:data-changed", refresh);
    return () => window.removeEventListener("cloudstay:data-changed", refresh);
  }, [loadListings]);

  const savedIds = new Set(
    readSavedListings(user?.userId).map((listing) => listing.id),
  );

  const runSearch = () => {
    if ((filters.startDate && !filters.endDate) || (!filters.startDate && filters.endDate)) {
      setError("Select both a start and end date, or leave the dates empty.");
      setActivePicker("when");
      return;
    }
    setError("");
    setFilteredListings(applyFilters(listings, filters));
    setActivePicker("");
  };

  const toggleSaved = (event, listing) => {
    event.stopPropagation();
    if (!user) {
      navigate("/login");
      return;
    }
    if (listing.isOwner) return;

    const saved = readSavedListings(user.userId);
    const alreadySaved = saved.some((item) => item.id === listing.id);
    const next = alreadySaved
      ? saved.filter((item) => item.id !== listing.id)
      : [
          {
            id: listing.id,
            title: listing.title,
            location: listing.location,
            imageUrl: listing.imageUrl,
            pricePerNight: listing.pricePerNight,
          },
          ...saved,
        ];
    writeSavedListings(user.userId, next);
    setSavedRevision((revision) => revision + 1);
  };

  return (
    <div className="min-h-screen bg-[#fffaf7] text-slate-950">
      <MarketplaceHeader />

      <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-10 lg:py-8 2xl:px-12">
        <section className="relative z-20 mx-auto mb-10 max-w-4xl">
          <div ref={searchControlsRef} className="grid rounded-[2rem] border border-slate-200 bg-white p-2 shadow-lg shadow-slate-200/60 md:grid-cols-[1.2fr_1fr_1fr_auto]">
            <div className="relative">
              <label className="block w-full rounded-[1.5rem] px-5 py-3 pr-11 text-left hover:bg-slate-50">
                <span className="block text-xs font-bold">Where</span>
                <input
                  type="text"
                  value={filters.where}
                  onFocus={() => setActivePicker("where")}
                  onClick={() => setActivePicker("where")}
                  onChange={(event) => setFilters({ ...filters, where: event.target.value })}
                  placeholder="Search destinations"
                  className="mt-1 block w-full truncate bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-500"
                />
              </label>
              {filters.where && (
                <button
                  type="button"
                  onClick={() => setFilters({ ...filters, where: "" })}
                  className="absolute right-3 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-lg text-slate-500 hover:bg-slate-200"
                  aria-label="Clear destination"
                >
                  ×
                </button>
              )}
              {activePicker === "where" && (
                <div className="absolute left-0 top-[calc(100%+0.75rem)] w-[min(22rem,calc(100vw-2rem))] rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl">
                  <p className="px-2 text-sm font-bold">Popular cities</p>
                  <div className="mt-2 grid grid-cols-2 gap-1">
                    {popularCities.map((city) => (
                      <button key={city} type="button" onClick={() => { setFilters({ ...filters, where: city }); setActivePicker(""); }} className="rounded-2xl px-3 py-3 text-left text-sm font-semibold hover:bg-rose-50 hover:text-rose-700">
                        <span className="mr-2">⌖</span>{city}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="relative border-t border-slate-100 md:border-l md:border-t-0">
              <button type="button" onClick={() => setActivePicker(activePicker === "when" ? "" : "when")} className="w-full rounded-[1.5rem] px-5 py-3 pr-11 text-left hover:bg-slate-50">
                <span className="block text-xs font-bold">When</span>
                <span className={`mt-1 block truncate text-sm ${filters.startDate ? "text-slate-800" : "text-slate-500"}`}>
                  {formatRange(filters.startDate, filters.endDate)}
                </span>
              </button>
              {(filters.startDate || filters.endDate) && (
                <button
                  type="button"
                  onClick={() => setFilters({ ...filters, startDate: "", endDate: "" })}
                  className="absolute right-3 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-lg text-slate-500 hover:bg-slate-200"
                  aria-label="Clear dates"
                >
                  ×
                </button>
              )}
              {activePicker === "when" && (
                <div className="absolute left-0 top-[calc(100%+0.75rem)] md:left-1/2 md:-translate-x-1/2">
                  <DateRangePicker
                    startDate={filters.startDate}
                    endDate={filters.endDate}
                    minDate={today()}
                    onChange={({ startDate, endDate }) =>
                      setFilters({ ...filters, startDate, endDate })
                    }
                  />
                </div>
              )}
            </div>

            <div className="relative border-t border-slate-100 md:border-l md:border-t-0">
              <button type="button" onClick={() => setActivePicker(activePicker === "who" ? "" : "who")} className="w-full rounded-[1.5rem] px-5 py-3 pr-11 text-left hover:bg-slate-50">
                <span className="block text-xs font-bold">Who</span>
                <span className="mt-1 block truncate text-sm text-slate-500">
                  {formatGuests(filters.guests)}
                </span>
              </button>
              {(getGuestTotal(filters.guests) > 0 || filters.guests.infants > 0) && (
                <button
                  type="button"
                  onClick={() => setFilters({ ...filters, guests: { ...emptyGuestSelection } })}
                  className="absolute right-3 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-lg text-slate-500 hover:bg-slate-200"
                  aria-label="Clear guests"
                >
                  ×
                </button>
              )}
              {activePicker === "who" && (
                <div className="absolute right-0 top-[calc(100%+0.75rem)]">
                  <GuestPicker
                    value={filters.guests}
                    onChange={(guests) => setFilters({ ...filters, guests })}
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-center p-1.5">
              <button type="button" onClick={runSearch} className="grid h-12 w-12 place-items-center rounded-full bg-rose-500 text-white transition hover:bg-rose-600" aria-label="Search stays">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35m1.85-5.15a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" />
                </svg>
              </button>
            </div>
          </div>
        </section>

        <div className="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-2xl font-bold text-slate-950 sm:text-3xl">Explore stays</h1>
            <p className="mt-2 text-sm font-semibold text-slate-600">
              {filteredListings.length} {filteredListings.length === 1 ? "stay" : "stays"} found.
            </p>
          </div>
          <p className="text-sm text-slate-500">Homes and getaways hosted by the CloudStay community</p>
        </div>

        {error && <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-600">{error}</div>}

        {loading ? (
          <div className="flex h-64 items-center justify-center"><p className="text-lg font-semibold text-slate-500">Loading stays...</p></div>
        ) : filteredListings.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white py-20 text-center">
            <h3 className="text-lg font-bold">No stays match this search</h3>
            <p className="mt-2 text-sm text-slate-500">Try changing the destination, dates, or guest count.</p>
          </div>
        ) : (
          <div className="grid gap-x-5 gap-y-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {filteredListings.map((listing) => {
              const isSaved = savedIds.has(listing.id);
              return (
                <article key={listing.id} className="group relative cursor-pointer" onClick={() => navigate(`/properties/${listing.id}`)}>
                  <div className="aspect-[4/3] overflow-hidden rounded-3xl bg-slate-100">
                    {listing.imageUrl ? (
                      <img src={listing.imageUrl} alt={listing.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-100 to-rose-50 text-sm font-bold text-slate-400">No Photo</div>
                    )}
                  </div>
                  {!listing.isOwner && (
                    <button type="button" onClick={(event) => toggleSaved(event, listing)} className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-white/90 shadow-md backdrop-blur transition hover:scale-105" aria-label={`${isSaved ? "Remove" : "Save"} ${listing.title}`}>
                      <svg viewBox="0 0 24 24" className={`h-6 w-6 ${isSaved ? "fill-rose-500 stroke-rose-500" : "fill-black/20 stroke-white"}`} strokeWidth="2">
                        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
                      </svg>
                    </button>
                  )}
                  <h2 className="mt-3 truncate text-base font-bold text-slate-950">{listing.title}</h2>
                  <p className="mt-1 text-sm font-bold text-slate-950">
                    RM {listing.pricePerNight} <span className="font-normal text-slate-500">night</span>
                  </p>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default ExploreStays;
