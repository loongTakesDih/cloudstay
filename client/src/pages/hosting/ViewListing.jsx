import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";
import AppHeader from "../../components/AppHeader";
import { useAuth } from "../../context/useAuth";

const getDisplayLocation = (location) => {
  const parts = location
    ?.split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (!parts || parts.length < 5) {
    return location;
  }

  const streetName1 = parts[1];
  const city = parts[3].replace(/^\d{5}\s*/, "");
  const state = parts[4];

  return [streetName1, city, state].filter(Boolean).join(", ");
};

function ViewListing() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadListings = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await api.get("/properties/mine");
        setListings(response.data);
      } catch (err) {
        setError(err.response?.data?.message || "Could not load your listings.");
      } finally {
        setLoading(false);
      }
    };

    loadListings();
  }, []);

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
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-normal text-rose-500">
            Host inventory
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-normal text-slate-950">
            Keep track of every stay you have listed.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            Listings created from the hosting form will appear here after they
            are saved to the database.
          </p>
        </section>

        <section className="mt-8">
          {loading && (
            <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
              Loading listings...
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          {!loading && !error && listings.length === 0 && (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
              <h3 className="text-xl font-bold tracking-normal text-slate-950">
                No listings yet
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Create your first stay to start building your host inventory.
              </p>
              <button
                onClick={() => navigate("/hosting/listings/new")}
                className="mt-5 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Create listing
              </button>
            </div>
          )}

          {!loading && !error && listings.length > 0 && (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {listings.map((listing) => (
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
                    <p className="text-sm font-semibold text-rose-500">
                      {getDisplayLocation(listing.location)}
                    </p>
                    <h3 className="mt-2 text-xl font-bold tracking-normal text-slate-950">
                      {listing.title}
                    </h3>
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
                      {listing.description}
                    </p>
                    <div className="mt-5 rounded-lg border border-slate-200 bg-[#fffaf7] p-4">
                      <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">
                        Price per night
                      </p>
                      <p className="mt-1 text-2xl font-bold tracking-normal text-slate-950">
                        RM {listing.pricePerNight}
                      </p>
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
