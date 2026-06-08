import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";
import AppHeader from "../../components/AppHeader";
import { useAuth } from "../../context/useAuth";

function NewListing() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [pricePerNight, setPricePerNight] = useState("");
  const [description, setDescription] = useState("");
  const [previewImage, setPreviewImage] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      setPreviewImage("");
      setImageDataUrl("");
      return;
    }

    const reader = new FileReader();

    reader.onloadend = () => {
      const result = reader.result?.toString() || "";
      setPreviewImage(result);
      setImageDataUrl(result);
    };

    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await api.post("/properties", {
        title,
        location,
        pricePerNight: Number(pricePerNight),
        description,
        imageUrl: imageDataUrl || null,
      });

      setSuccess("Listing saved successfully.");
      navigate("/hosting/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Could not save listing.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fffaf7] text-slate-950">
      <AppHeader
        eyebrow="Listing setup"
        title="Create a new stay"
        subtitle={`Set up the basics for ${user?.username || "your"} listing before publishing it.`}
        actions={
          <>
            <button
              onClick={() => navigate("/hosting/dashboard")}
              className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-600"
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
            Property details
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-normal text-slate-950">
            Tell guests what makes this place worth booking.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            List down the "Important Details" to let guests know what to expect. You can always edit these details later.
          </p>
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-[1fr_0.75fr]">
          <form
            onSubmit={handleSubmit}
            className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
          >
            {error && (
              <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                {success}
              </div>
            )}

            <div className="grid gap-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Listing title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
                  placeholder="Cozy studio near the city center"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
                  placeholder="Kuala Lumpur, Malaysia"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Price per night
                </label>
                <div className="flex rounded-lg border border-slate-300 bg-white focus-within:border-rose-400 focus-within:ring-4 focus-within:ring-rose-100">
                  <span className="flex items-center border-r border-slate-200 px-4 text-sm font-semibold text-slate-500">
                    RM
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={pricePerNight}
                    onChange={(event) => setPricePerNight(event.target.value)}
                    className="w-full rounded-lg px-4 py-3 text-slate-950 outline-none"
                    placeholder="180"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Listing photo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition file:mr-4 file:rounded-lg file:border-0 file:bg-slate-950 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-800 focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
                />
                <p className="mt-2 text-xs text-slate-500">
                  Upload a JPG, PNG, or WebP photo for the listing preview.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Description
                </label>
                <textarea
                  rows="6"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className="w-full resize-none rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
                  placeholder="Describe the space, nearby attractions, check-in details, and anything guests should know."
                  required
                />
              </div>
            </div>

            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => navigate("/hosting/dashboard")}
                className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                {loading ? "Saving..." : "Save Listing"}
              </button>
            </div>
          </form>

          <aside className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <p className="text-sm font-semibold text-rose-500">
              Listing preview
            </p>
            <div className="mt-5 aspect-[4/3] overflow-hidden rounded-lg border border-dashed border-slate-300 bg-[#fffaf7]">
              {previewImage && (
                <img
                  src={previewImage}
                  alt="Listing preview"
                  className="h-full w-full object-cover"
                />
              )}
            </div>
            <h3 className="mt-5 text-xl font-bold tracking-normal text-slate-950">
              {title || "Your stay title"}
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              {location || "Location appears here"}
            </p>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              {description ||
                "Add a description to preview what guests will read about this stay."}
            </p>
            <div className="mt-5 rounded-lg border border-slate-200 bg-[#fffaf7] p-4">
              <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">
                Starting from
              </p>
              <p className="mt-1 text-2xl font-bold tracking-normal text-slate-950">
                RM {pricePerNight || "0"}
              </p>
              <p className="text-sm text-slate-500">per night</p>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}

export default NewListing;
