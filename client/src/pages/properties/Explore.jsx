import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppHeader from "../../components/AppHeader";
import { useAuth } from "../../context/useAuth";
import { getPublicListings } from "../../api/api";

function ExploreStays() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

useEffect(() => {
    const fetchListings = async () => {
      try {
        const data = await getPublicListings();
        // TEMPORARY FIX: Bypass the filter and just show everything in the database
        setListings(data); 
      } catch (err) {
        console.error("Failed to fetch listings", err);
        setError("Could not load stays. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, []);

  return (
    <div className="min-h-screen bg-[#fffaf7] text-slate-950">
      <AppHeader
        title="Explore CloudStay"
        subtitle="Find your next weekend escape or apartment."
        actions={
          <>
            {user ? (
              <>
                <button
                  onClick={() => navigate("/dashboard")}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                >
                  Dashboard
                </button>
                <button
                  onClick={logout}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                >
                  Logout
                </button>
              </>
            ) : (
              <button
                onClick={() => navigate("/login")}
                className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-600"
              >
                Login
              </button>
            )}
          </>
        }
      />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-normal text-slate-950">
            Available Stays
          </h1>
          <p className="mt-2 text-sm font-semibold text-slate-600">
            {listings.length} {listings.length === 1 ? 'stay' : 'stays'} found.
          </p>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-600 mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <p className="text-lg font-semibold text-slate-500">Loading stays...</p>
          </div>
        ) : listings.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white py-20 text-center shadow-sm">
            <div className="text-4xl">🏝️</div>
            <h3 className="mt-4 text-lg font-bold text-slate-950">No stays available right now</h3>
            <p className="mt-2 text-sm text-slate-500">Check back later for new listings!</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {listings.map((listing) => (
              <div 
                key={listing.id} 
                className="group flex cursor-pointer flex-col overflow-hidden rounded-3xl bg-white shadow-sm transition hover:shadow-md"
                onClick={() => navigate(`/properties/${listing.id}`)}
              >
                {/* Image Container */}
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

                {/* Details Container */}
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