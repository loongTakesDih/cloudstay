import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  deleteListing,
  getMyListings,
  publishListing,
  unpublishListing,
  updateListing,
} from "../../api/api.js";
import AppHeader from "../../components/AppHeader";
import { MapPicker } from "../../components/PropertyMap";
import { useAuth } from "../../context/useAuth";
import { popularCities } from "../../utils/searchOptions.js";

const splitValues = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
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

const toDateInputValue = (value) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().slice(0, 10);
};

const buildEditForm = (listing) => ({
  title: listing.title || "",
  description: listing.description || "",
  pricePerNight: listing.pricePerNight || 1,
  location: listing.location || listing.address || "",
  propertyCategory: listing.propertyCategory || "Other",
  placeType: listing.placeType || "Entire place",
  address: listing.address || listing.location || "",
  latitude: listing.latitude ?? null,
  longitude: listing.longitude ?? null,
  addressLine: listing.addressLine || listing.address || listing.location || "",
  city: listing.city || "",
  state: listing.state || "",
  postalCode: listing.postalCode || "",
  country: listing.country || "Malaysia",
  guestCount: listing.guestCount || 1,
  bedroomCount: listing.bedroomCount || 0,
  bedCount: listing.bedCount || 0,
  bathroomCount: listing.bathroomCount || 0,
  unitFeatures: splitValues(listing.unitFeatures),
  propertyFacilities: splitValues(listing.propertyFacilities),
  safetyFeatures: splitValues(listing.safetyFeatures),
  availableFrom: toDateInputValue(listing.availableFrom),
  availableTo: toDateInputValue(listing.availableTo),
  isAvailable: listing.isAvailable ?? true,
});

const tabMeta = {
  unlisted: {
    label: "Unlisted",
    icon: "📝",
    helper: "Drafts waiting for review",
  },
  listed: {
    label: "Listed",
    icon: "🌍",
    helper: "Public stays guests can see",
  },
};

function ViewListing() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { logout, user } = useAuth();
  const [listings, setListings] = useState([]);
  const [activeTab, setActiveTab] = useState("unlisted");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const filteredListings = useMemo(
    () =>
      listings.filter((listing) =>
        activeTab === "listed" ? listing.isListed : !listing.isListed
      ),
    [activeTab, listings]
  );

  const counts = useMemo(
    () => ({
      listed: listings.filter((listing) => listing.isListed).length,
      unlisted: listings.filter((listing) => !listing.isListed).length,
    }),
    [listings]
  );

  useEffect(() => {
    let isActive = true;

    getMyListings()
      .then((data) => {
        if (isActive) {
          setListings(data);
        }
      })
      .catch((err) => {
        if (isActive) {
          setError(err.response?.data?.message || "Could not load your listings.");
        }
      })
      .finally(() => {
        if (isActive) {
          setLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  const replaceListing = (updatedListing) => {
    setListings((currentListings) =>
      currentListings.map((listing) =>
        listing.id === updatedListing.id ? updatedListing : listing
      )
    );
  };

  useEffect(() => {
    const editId = Number(searchParams.get("edit"));

    if (!editId || listings.length === 0) return;

    const listingToEdit = listings.find((listing) => listing.id === editId);

    if (listingToEdit) {
      Promise.resolve().then(() => {
        setEditingId(listingToEdit.id);
        setEditForm(buildEditForm(listingToEdit));
        setActiveTab(listingToEdit.isListed ? "listed" : "unlisted");
        setSearchParams({});
      });
    }
  }, [listings, searchParams, setSearchParams]);

  const handlePublish = async (listing) => {
    setError("");

    try {
      replaceListing(await publishListing(listing.id));
      setActiveTab("listed");
    } catch (err) {
      setError(err.response?.data?.message || "Could not publish listing.");
    }
  };

  const handleUnpublish = async (listing) => {
    setError("");

    try {
      replaceListing(await unpublishListing(listing.id));
      setActiveTab("unlisted");
    } catch (err) {
      setError(err.response?.data?.message || "Could not unpublish listing.");
    }
  };

  const handleDelete = async (listing) => {
    if (!window.confirm("Delete this listing?")) return;

    setError("");

    try {
      await deleteListing(listing.id);
      setListings((currentListings) =>
        currentListings.filter((item) => item.id !== listing.id)
      );
    } catch (err) {
      setError(err.response?.data?.message || "Could not delete listing.");
    }
  };

  const startEdit = (listing) => {
    setEditingId(listing.id);
    setEditForm(buildEditForm(listing));
    setError("");
  };

  const updateEditForm = (field, value) => {
    setEditForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  };

  const updateEditLocation = (field, value) => {
    setEditForm((currentForm) => {
      const next = { ...currentForm, [field]: value };
      const address = [
        next.addressLine,
        next.city,
        next.postalCode,
        next.state,
        next.country,
      ].filter(Boolean).join(", ");
      return {
        ...next,
        address,
        location: [next.city, next.state, next.country].filter(Boolean).join(", "),
      };
    });
  };

  const handleSaveEdit = async (event) => {
    event.preventDefault();

    if (!editingId || !editForm) return;

    setSaving(true);
    setError("");

    try {
      const updatedListing = await updateListing(editingId, {
        ...editForm,
        pricePerNight: Number(editForm.pricePerNight),
        guestCount: Number(editForm.guestCount),
        bedroomCount: Number(editForm.bedroomCount),
        bedCount: Number(editForm.bedCount),
        bathroomCount: Number(editForm.bathroomCount),
      });

      replaceListing(updatedListing);
      setEditingId(null);
      setEditForm(null);
    } catch (err) {
      setError(err.response?.data?.message || "Could not update listing.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#fffaf7_0%,#fff1ec_52%,#f8fafc_100%)] text-slate-950">
      <AppHeader
        eyebrow="Inventory"
        title="My listings"
        subtitle={`Review the stays created by ${user?.username || "your host account"}.`}
        actions={
          <>
            <button
              onClick={() => navigate("/hosting/listings/new")}
              className="rounded-full bg-gradient-to-r from-rose-500 to-rose-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-rose-200 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
            >
              Create Listing
            </button>
            <button
              onClick={() => navigate("/hosting/dashboard")}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
            >
              Hosting Dashboard
            </button>
            <button
              onClick={logout}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
            >
              Logout
            </button>
          </>
        }
      />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-white/80 bg-white/80 p-6 shadow-xl shadow-rose-100/50 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-normal text-rose-500">
                Listing studio
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-normal text-slate-950">
                Review, publish, and refine your stays.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                Unlisted stays are private drafts. Listed stays are visible to guests.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:min-w-72">
              <div className="rounded-2xl bg-amber-50 p-4">
                <p className="text-xs font-bold uppercase tracking-normal text-amber-700">
                  Drafts
                </p>
                <p className="mt-1 text-3xl font-bold text-slate-950">
                  {counts.unlisted}
                </p>
              </div>
              <div className="rounded-2xl bg-emerald-50 p-4">
                <p className="text-xs font-bold uppercase tracking-normal text-emerald-700">
                  Public
                </p>
                <p className="mt-1 text-3xl font-bold text-slate-950">
                  {counts.listed}
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-3 rounded-3xl border border-white/80 bg-white/75 p-2 shadow-lg shadow-rose-100/40 sm:grid-cols-2">
          {["unlisted", "listed"].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-2xl px-5 py-4 text-left transition-all duration-300 ${
                activeTab === tab
                  ? "bg-slate-950 text-white shadow-xl shadow-slate-200"
                  : "bg-white/70 text-slate-700 hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
              }`}
            >
              <span className="flex items-center justify-between gap-3">
                <span className="text-sm font-bold">
                  <span aria-hidden="true">{tabMeta[tab].icon}</span>{" "}
                  {tabMeta[tab].label} ({counts[tab]})
                </span>
              </span>
              <span
                className={`mt-1 block text-xs font-semibold ${
                  activeTab === tab ? "text-slate-300" : "text-slate-500"
                }`}
              >
                {tabMeta[tab].helper}
              </span>
            </button>
          ))}
        </div>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 shadow-sm">
            {error}
          </div>
        )}

        {editingId && editForm && (
          <form
            onSubmit={handleSaveEdit}
            className="mt-6 rounded-3xl border border-white/80 bg-white/85 p-6 shadow-xl shadow-rose-100/50"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-bold tracking-normal text-slate-950">
                Edit listing
              </h2>
              <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={editForm.isAvailable}
                  onChange={(event) =>
                    updateEditForm("isAvailable", event.target.checked)
                  }
                  className="h-4 w-4 accent-rose-500"
                />
                Available to book
              </label>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <input
                type="text"
                value={editForm.title}
                onChange={(event) => updateEditForm("title", event.target.value)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
                placeholder="Listing title"
                required
              />
              <input
                type="number"
                min="1"
                value={editForm.pricePerNight}
                onChange={(event) =>
                  updateEditForm("pricePerNight", event.target.value)
                }
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
                placeholder="Price per night"
                required
              />
              <input
                type="text"
                value={editForm.addressLine}
                onChange={(event) => updateEditLocation("addressLine", event.target.value)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100 md:col-span-2"
                placeholder="Unit and street address"
                required
              />
              <input
                type="text"
                list="edit-popular-cities"
                value={editForm.city}
                onChange={(event) => updateEditLocation("city", event.target.value)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
                placeholder="City"
                required
              />
              <datalist id="edit-popular-cities">
                {popularCities.map((city) => <option key={city} value={city} />)}
              </datalist>
              <input
                type="text"
                value={editForm.state}
                onChange={(event) => updateEditLocation("state", event.target.value)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
                placeholder="State"
                required
              />
              <input
                type="text"
                value={editForm.postalCode}
                onChange={(event) => updateEditLocation("postalCode", event.target.value)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
                placeholder="Postal code"
              />
              <input
                type="text"
                value={editForm.country}
                onChange={(event) => updateEditLocation("country", event.target.value)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
                placeholder="Country"
                required
              />
              <div className="md:col-span-2">
                <MapPicker
                  address={editForm.address}
                  latitude={editForm.latitude}
                  longitude={editForm.longitude}
                  onLocationChange={({ address, latitude, longitude }) =>
                    setEditForm((currentForm) => ({
                      ...currentForm,
                      address: address || currentForm.address,
                      location: address || currentForm.location,
                      latitude,
                      longitude,
                    }))
                  }
                />
              </div>
              <input
                type="date"
                value={editForm.availableFrom}
                onChange={(event) =>
                  updateEditForm("availableFrom", event.target.value)
                }
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
                required
              />
              <input
                type="date"
                value={editForm.availableTo}
                onChange={(event) =>
                  updateEditForm("availableTo", event.target.value)
                }
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
                required
              />
              <textarea
                rows="4"
                value={editForm.description}
                onChange={(event) =>
                  updateEditForm("description", event.target.value)
                }
                className="resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100 md:col-span-2"
                placeholder="Description"
                required
              />
            </div>

            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setEditForm(null);
                }}
                className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-slate-200 transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </form>
        )}

        <section className="mt-8">
          {loading && (
            <div className="rounded-3xl border border-white/80 bg-white/80 p-8 text-sm font-semibold text-slate-600 shadow-xl shadow-rose-100/40">
              Loading listings...
            </div>
          )}

          {!loading && filteredListings.length === 0 && (
            <div className="rounded-3xl border border-dashed border-rose-200 bg-white/80 p-10 text-center shadow-xl shadow-rose-100/40">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-rose-50 text-3xl">
                <span aria-hidden="true">{tabMeta[activeTab].icon}</span>
              </div>
              <h3 className="mt-5 text-2xl font-bold tracking-normal text-slate-950">
                No {tabMeta[activeTab].label.toLowerCase()} listings
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
                {activeTab === "unlisted"
                  ? "New listings start here as private drafts while you review the details."
                  : "Publish an unlisted stay when it is polished and ready for guests."}
              </p>
              {activeTab === "unlisted" && (
                <button
                  type="button"
                  onClick={() => navigate("/hosting/listings/new")}
                  className="mt-6 rounded-full bg-rose-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-rose-200 transition-all duration-300 hover:-translate-y-0.5 hover:bg-rose-600 hover:shadow-xl"
                >
                  Create listing
                </button>
              )}
            </div>
          )}

          {!loading && filteredListings.length > 0 && (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredListings.map((listing) => (
                <article
                  key={listing.id}
                  className="group overflow-hidden rounded-2xl bg-white text-left transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <button
                    type="button"
                    onClick={() => navigate(`/properties/${listing.id}`)}
                    className="block w-full text-left"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-[#fffaf7]">
                    {listing.imageUrl ? (
                      <img
                        src={listing.imageUrl}
                        alt={listing.title}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-slate-100 text-sm font-bold text-slate-400">
                        <span className="rounded-xl bg-white px-4 py-3">
                          Photo placeholder
                        </span>
                      </div>
                    )}
                    <span
                      className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-bold ${
                        listing.isListed
                          ? "bg-white/90 text-emerald-700"
                          : "bg-white/90 text-amber-700"
                      }`}
                    >
                      {listing.isListed ? "Active public" : "Draft review"}
                    </span>
                    </div>
                    <div className="px-4 py-3.5">
                      <h3 className="line-clamp-1 text-[15px] font-bold leading-5 text-slate-900">
                        {listing.title}
                      </h3>
                      <p className="mt-1 text-[13px] font-semibold leading-5 text-slate-600">
                        RM {listing.pricePerNight} per night
                      </p>
                      <p className="mt-1 line-clamp-1 text-xs font-semibold text-slate-500">
                        {listing.address || listing.location}
                      </p>
                      <p className="mt-2 text-xs font-semibold text-slate-500">
                        {listing.guestCount || 0} guests ·{" "}
                        {listing.bedroomCount || 0} bedrooms ·{" "}
                        {listing.bathroomCount || 0} baths
                      </p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        {formatDate(listing.availableFrom)} -{" "}
                        {formatDate(listing.availableTo)}
                      </p>
                    </div>
                  </button>

                  <div className="flex flex-wrap gap-2 border-t border-slate-100 px-4 py-3">
                    <button
                      type="button"
                      onClick={() => startEdit(listing)}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:border-slate-300"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(`/properties/${listing.id}`)}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:border-slate-300"
                    >
                      {listing.isListed ? "View listing" : "Preview as guest"}
                    </button>
                    {listing.isListed ? (
                      <button
                        type="button"
                        onClick={() => handleUnpublish(listing)}
                        className="rounded-full bg-slate-950 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-slate-800"
                      >
                        Unpublish
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handlePublish(listing)}
                        className="rounded-full bg-rose-500 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-rose-600"
                      >
                        Publish
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(listing)}
                      className="rounded-full border border-red-100 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 transition hover:border-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

    </div>
  );
}

export default ViewListing;
