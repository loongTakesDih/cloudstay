import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  deleteListing,
  getMyListings,
  publishListing,
  unpublishListing,
  updateListing,
} from "../../api/api";
import AppHeader from "../../components/AppHeader";
import { useAuth } from "../../context/useAuth";

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

function ViewListing() {
  const navigate = useNavigate();
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
    <div className="min-h-screen bg-[#fffaf7] text-slate-950">
      <AppHeader
        eyebrow="Inventory"
        title="My listings"
        subtitle={`Review the stays created by ${user?.username || "your host account"}.`}
        actions={
          <>
            <button
              onClick={() => navigate("/hosting/listings/new")}
              className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-600"
            >
              Create Listing
            </button>
            <button
              onClick={() => navigate("/hosting/dashboard")}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            >
              Hosting Dashboard
            </button>
            <button
              onClick={logout}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            >
              Logout
            </button>
          </>
        }
      />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap gap-2">
          {["unlisted", "listed"].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold capitalize transition ${
                activeTab === tab
                  ? "bg-slate-950 text-white"
                  : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300"
              }`}
            >
              {tab} ({counts[tab]})
            </button>
          ))}
        </div>

        {error && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {editingId && editForm && (
          <form
            onSubmit={handleSaveEdit}
            className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
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
                className="rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
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
                className="rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
                placeholder="Price per night"
                required
              />
              <input
                type="text"
                value={editForm.address}
                onChange={(event) => {
                  updateEditForm("address", event.target.value);
                  updateEditForm("location", event.target.value);
                }}
                className="rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100 md:col-span-2"
                placeholder="Address"
                required
              />
              <input
                type="date"
                value={editForm.availableFrom}
                onChange={(event) =>
                  updateEditForm("availableFrom", event.target.value)
                }
                className="rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
                required
              />
              <input
                type="date"
                value={editForm.availableTo}
                onChange={(event) =>
                  updateEditForm("availableTo", event.target.value)
                }
                className="rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
                required
              />
              <textarea
                rows="4"
                value={editForm.description}
                onChange={(event) =>
                  updateEditForm("description", event.target.value)
                }
                className="resize-none rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100 md:col-span-2"
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
                className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </form>
        )}

        <section className="mt-8">
          {loading && (
            <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
              Loading listings...
            </div>
          )}

          {!loading && filteredListings.length === 0 && (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
              <h3 className="text-xl font-bold tracking-normal text-slate-950">
                No {activeTab} listings
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {activeTab === "unlisted"
                  ? "New onboarding listings will appear here first."
                  : "Publish an unlisted stay when it is ready for guests."}
              </p>
            </div>
          )}

          {!loading && filteredListings.length > 0 && (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredListings.map((listing) => (
                <article
                  key={listing.id}
                  className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
                >
                  <div className="aspect-[4/3] bg-[#fffaf7]">
                    {listing.imageUrl ? (
                      <img
                        src={listing.imageUrl}
                        alt={listing.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-slate-400">
                        No photo
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-rose-500">
                          {listing.address || listing.location}
                        </p>
                        <h3 className="mt-2 text-xl font-bold tracking-normal text-slate-950">
                          {listing.title}
                        </h3>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          listing.isListed
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {listing.isListed ? "Listed" : "Unlisted"}
                      </span>
                    </div>

                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
                      {listing.description}
                    </p>

                    <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-lg bg-slate-50 p-3">
                        <dt className="font-semibold text-slate-500">Price</dt>
                        <dd className="mt-1 font-bold text-slate-950">
                          RM {listing.pricePerNight}
                        </dd>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-3">
                        <dt className="font-semibold text-slate-500">Basics</dt>
                        <dd className="mt-1 font-bold text-slate-950">
                          {listing.guestCount || 0} guests,{" "}
                          {listing.bedroomCount || 0} bedrooms,{" "}
                          {listing.bathroomCount || 0} baths
                        </dd>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-3">
                        <dt className="font-semibold text-slate-500">From</dt>
                        <dd className="mt-1 font-bold text-slate-950">
                          {formatDate(listing.availableFrom)}
                        </dd>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-3">
                        <dt className="font-semibold text-slate-500">To</dt>
                        <dd className="mt-1 font-bold text-slate-950">
                          {formatDate(listing.availableTo)}
                        </dd>
                      </div>
                    </dl>

                    <div className="mt-5 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(listing)}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                      >
                        Edit
                      </button>
                      {listing.isListed ? (
                        <button
                          type="button"
                          onClick={() => handleUnpublish(listing)}
                          className="rounded-lg bg-slate-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                        >
                          Unpublish
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handlePublish(listing)}
                          className="rounded-lg bg-rose-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-rose-600"
                        >
                          Publish
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDelete(listing)}
                        className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-100"
                      >
                        Delete
                      </button>
                    </div>
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
