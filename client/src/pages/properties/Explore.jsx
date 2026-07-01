import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MarketplaceHeader from "../../components/MarketplaceHeader";
import { getPublicListings } from "../../api/api.js";

const applyFilters = (sourceListings, nextFilters) => {
  const normalizedWhere = nextFilters.where.trim().toLowerCase();
  const requestedGuests = Number(nextFilters.guests);
  const requestedCheckIn = nextFilters.checkIn ? new Date(nextFilters.checkIn) : null;
  const requestedCheckOut = nextFilters.checkOut ? new Date(nextFilters.checkOut) : null;

  return sourceListings.filter((listing) => {
    const matchesWhere =
      normalizedWhere.length === 0 ||
      [listing.title, listing.location, listing.address, listing.placeType]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedWhere));

    const availableFrom = listing.availableFrom ? new Date(listing.availableFrom) : null;
    const availableTo = listing.availableTo ? new Date(listing.availableTo) : null;

    const matchesDates =
      !requestedCheckIn ||
      !requestedCheckOut ||
      ((availableFrom === null || requestedCheckIn >= availableFrom) &&
        (availableTo === null || requestedCheckOut <= availableTo));

    const matchesGuests =
      !nextFilters.guests ||
      !Number.isFinite(requestedGuests) ||
      requestedGuests <= 0 ||
      requestedGuests <= (listing.guestCount || 0);

    return matchesWhere && matchesDates && matchesGuests;
  });
};

function ExploreStays() {
  const navigate = useNavigate();

  const [listings, setListings] = useState([]);
  const [filteredListings, setFilteredListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    where: "",
    checkIn: "",
    checkOut: "",
    guests: "",
  });

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const data = await getPublicListings();
        setListings(data);
        setFilteredListings(data);
      } catch (err) {
        console.error("Failed to fetch listings", err);
        setError("Could not load stays. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, []);

  const handleFilterChange = (field, value) => {
    const nextFilters = {
      ...filters,
      [field]: value,
    };

    setFilters(nextFilters);
    setFilteredListings(applyFilters(listings, nextFilters));
  };

  return (
    <div className="min-h-screen bg-[#fffaf7] text-slate-950">
      <MarketplaceHeader />

      <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-10 lg:py-8 2xl:px-12">
        <section className="mb-9">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-2 shadow-xl shadow-slate-200/70">
            <div className="grid gap-2 lg:grid-cols-[1.45fr_1fr_1fr_auto]">
              <label className="rounded-[1.5rem] px-5 py-4 text-slate-950 lg:border-r lg:border-slate-200">
              <span className="block text-sm font-bold">Where</span>
              <input
                type="text"
                value={filters.where}
                onChange={(event) => handleFilterChange("where", event.target.value)}
                placeholder="Search destinations"
                className="mt-1 w-full bg-transparent text-lg text-slate-700 outline-none placeholder:text-slate-400"
              />
              </label>

              <div className="rounded-[1.5rem] px-5 py-4 text-slate-950 lg:border-r lg:border-slate-200">
                <span className="block text-sm font-bold">When</span>
                <div className="mt-1 grid gap-2">
                  <input
                    type={filters.checkIn ? "date" : "text"}
                    value={filters.checkIn}
                    min={new Date().toISOString().split("T")[0]}
                    onFocus={(event) => {
                      if (event.target.type !== "date") {
                        event.target.type = "date";
                      }
                    }}
                    onBlur={(event) => {
                      if (!event.target.value) {
                        event.target.type = "text";
                      }
                    }}
                    onChange={(event) => handleFilterChange("checkIn", event.target.value)}
                    placeholder="Add dates"
                    className="w-full bg-transparent text-lg text-slate-700 outline-none placeholder:text-slate-400"
                  />
                  <input
                    type={filters.checkOut ? "date" : "text"}
                    value={filters.checkOut}
                    min={filters.checkIn || new Date().toISOString().split("T")[0]}
                    onFocus={(event) => {
                      if (event.target.type !== "date") {
                        event.target.type = "date";
                      }
                    }}
                    onBlur={(event) => {
                      if (!event.target.value) {
                        event.target.type = "text";
                      }
                    }}
                    onChange={(event) => handleFilterChange("checkOut", event.target.value)}
                    placeholder="Add checkout"
                    className="w-full bg-transparent text-sm text-slate-500 outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div className="rounded-[1.5rem] px-5 py-4 text-slate-950">
                <span className="block text-sm font-bold">Who</span>
                <div className="mt-1 grid gap-2">
                <input
                  type={filters.guests ? "number" : "text"}
                  min={filters.guests ? "1" : undefined}
                  value={filters.guests}
                  onChange={(event) => handleFilterChange("guests", event.target.value)}
                  onFocus={(event) => {
                    if (event.target.type !== "number") {
                      event.target.type = "number";
                    }
                  }}
                  onBlur={(event) => {
                    if (!event.target.value) {
                      event.target.type = "text";
                    }
                  }}
                  placeholder="Add guests"
                  className="w-full bg-transparent text-lg text-slate-700 outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-center p-2">
              <button
                type="button"
                onClick={() => setFilteredListings(applyFilters(listings, filters))}
                className="grid h-16 w-16 place-items-center rounded-full bg-rose-500 text-white transition hover:bg-rose-600"
                aria-label="Search stays"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="h-7 w-7">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35m1.85-5.15a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" />
                </svg>
              </button>
            </div>
          </div>
          </div>
        </section>

        <div className="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
          <h1 className="text-2xl font-bold tracking-normal text-slate-950 sm:text-3xl">
            Explore stays
          </h1>
          <p className="mt-2 text-sm font-semibold text-slate-600">
            {filteredListings.length} {filteredListings.length === 1 ? "stay" : "stays"} found.
          </p>
          </div>
          <p className="text-sm text-slate-500">Homes and getaways hosted by the CloudStay community</p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-600">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <p className="text-lg font-semibold text-slate-500">Loading stays...</p>
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white py-20 text-center shadow-sm">
            <h3 className="mt-4 text-lg font-bold text-slate-950">No stays match this search</h3>
            <p className="mt-2 text-sm text-slate-500">Try changing the destination, dates, or guest count.</p>
          </div>
        ) : (
          <div className="grid gap-x-5 gap-y-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {filteredListings.map((listing) => (
              <div
                key={listing.id}
                className="group flex cursor-pointer flex-col overflow-hidden rounded-3xl bg-white shadow-sm transition hover:shadow-md"
                onClick={() => navigate(`/properties/${listing.id}`)}
              >
                <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100">
                  {listing.imageUrl ? (
                    <img
                      src={listing.imageUrl}
                      alt={listing.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-100 to-rose-50 text-sm font-bold text-slate-400">
                      No Photo
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="truncate text-base font-bold text-slate-950" title={listing.location}>
                      {listing.location || "CloudStay"}
                    </h3>
                  </div>

                  <p className="mt-1 truncate text-sm text-slate-500">
                    {listing.title}
                  </p>

                  <div className="mt-auto pt-4">
                    <p className="text-base font-bold text-slate-950">
                      RM {listing.pricePerNight} <span className="font-normal text-slate-500">night</span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default ExploreStays;
