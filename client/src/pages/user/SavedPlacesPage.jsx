import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppHeader from "../../components/AppHeader";
import { useAuth } from "../../context/useAuth";
import { readSavedListings, writeSavedListings } from "../../utils/localState.js";

function SavedPlacesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [savedPlaces, setSavedPlaces] = useState(() => readSavedListings(user?.userId));

  const removeSavedPlace = (event, placeId) => {
    event.stopPropagation();
    const nextPlaces = savedPlaces.filter((place) => place.id !== placeId);
    writeSavedListings(user.userId, nextPlaces);
    setSavedPlaces(nextPlaces);
  };

  return (
    <div className="min-h-screen bg-[#fffaf7] text-slate-950">
      <AppHeader />
      <main className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6 lg:px-10">
        <p className="text-sm font-bold uppercase tracking-wider text-rose-500">Wishlists</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight">Saved places</h1>
        <p className="mt-3 text-slate-600">Homes you want to return to later.</p>

        {savedPlaces.length === 0 ? (
          <section className="mt-10 rounded-[2rem] border border-dashed border-slate-300 bg-white p-12 text-center">
            <h2 className="text-2xl font-bold">Create your first wishlist</h2>
            <p className="mt-2 text-slate-500">Save places while exploring and they will appear here.</p>
            <button type="button" onClick={() => navigate("/")} className="mt-6 rounded-full bg-slate-950 px-6 py-3 text-sm font-bold text-white">
              Start exploring
            </button>
          </section>
        ) : (
          <div className="mt-8 grid gap-x-5 gap-y-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {savedPlaces.map((place) => (
              <article key={place.id} className="group relative cursor-pointer" onClick={() => navigate(`/properties/${place.id}`)}>
                <div className="aspect-[4/3] overflow-hidden rounded-3xl bg-slate-200">
                  {place.imageUrl ? (
                    <img src={place.imageUrl} alt={place.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                  ) : (
                    <div className="grid h-full place-items-center text-sm font-bold text-slate-400">No photo</div>
                  )}
                </div>
                <button type="button" onClick={(event) => removeSavedPlace(event, place.id)} className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-white/95 text-xl shadow-md" aria-label={`Remove ${place.title} from saved places`}>
                  ×
                </button>
                <h2 className="mt-4 truncate text-lg font-bold">{place.title}</h2>
                <p className="mt-1 truncate text-sm text-slate-500">{place.location}</p>
                {place.pricePerNight && <p className="mt-2 font-bold">RM {place.pricePerNight} <span className="font-normal text-slate-500">per night</span></p>}
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default SavedPlacesPage;
