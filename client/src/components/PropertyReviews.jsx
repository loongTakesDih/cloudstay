import { useEffect, useState } from "react";
import { getPropertyReviews } from "../api/api.js";

const CATEGORY_META = [
  ["cleanliness", "Cleanliness", "✦"],
  ["accuracy", "Accuracy", "✓"],
  ["checkIn", "Check-in", "⌁"],
  ["communication", "Communication", "◻"],
  ["location", "Location", "⌖"],
  ["value", "Value", "◇"],
];

const formatReviewDate = (value) =>
  new Intl.DateTimeFormat("en-MY", {
    month: "long",
    year: "numeric",
  }).format(new Date(value));

function PropertyReviews({ propertyId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  useEffect(() => {
    let active = true;
    const loadId = window.setTimeout(async () => {
      try {
        const result = await getPropertyReviews(propertyId);
        if (active) setData(result);
      } catch {
        if (active) setData(null);
      } finally {
        if (active) setLoading(false);
      }
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(loadId);
    };
  }, [propertyId]);

  if (loading) {
    return (
      <section className="border-b border-slate-200 py-6 text-sm text-slate-500">
        Loading reviews...
      </section>
    );
  }

  const reviewCount = data?.reviewCount || 0;
  const overallRating = data?.overallRating || 0;

  return (
    <>
      <section className="border-b border-slate-200 py-8">
        <h2 className="text-2xl font-bold text-slate-950">
          ★ {reviewCount ? overallRating.toFixed(1) : "New"} · {reviewCount}{" "}
          {reviewCount === 1 ? "review" : "reviews"}
        </h2>
        <button
          type="button"
          onClick={() => setShowHowItWorks(true)}
          className="mt-2 text-sm font-semibold text-slate-500 underline underline-offset-4"
        >
          How reviews work
        </button>

        {reviewCount === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">
            No reviews yet. The first verified guest can review after checkout.
          </div>
        ) : (
          <>
            <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <div className="border-slate-200 lg:border-r lg:pr-5">
                <p className="text-sm font-bold text-slate-950">Overall rating</p>
                <div className="mt-3 space-y-1">
                  {data.ratingDistribution.map((row) => (
                    <div key={row.rating} className="flex items-center gap-2 text-xs">
                      <span className="w-2 text-slate-500">{row.rating}</span>
                      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <span
                          className="block h-full rounded-full bg-slate-800"
                          style={{ width: `${(row.count / reviewCount) * 100}%` }}
                        />
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              {CATEGORY_META.map(([key, label, icon]) => (
                <div key={key} className="border-slate-200 lg:border-r lg:pr-5">
                  <p className="text-sm font-bold text-slate-950">{label}</p>
                  <p className="mt-1 text-xl font-bold text-slate-900">
                    {data.categories[key].toFixed(1)}
                  </p>
                  <p className="mt-4 text-2xl text-slate-600" aria-hidden="true">
                    {icon}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-9 grid gap-x-10 gap-y-8 md:grid-cols-2">
              {data.reviews.map((review) => (
                <article key={review.id}>
                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-full bg-rose-100 font-bold text-rose-600">
                      {review.guestName.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-950">{review.guestName}</h3>
                      <p className="text-xs text-slate-500">Verified CloudStay guest</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm font-semibold text-slate-700">
                    {"★".repeat(review.overallRating)}{" "}
                    <span className="font-normal text-slate-400">
                      · {formatReviewDate(review.createdAt)}
                    </span>
                  </p>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                    {review.comment}
                  </p>
                </article>
              ))}
            </div>
          </>
        )}
      </section>

      {showHowItWorks && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reviews-explainer-title"
        >
          <div className="relative w-full max-w-xl rounded-3xl bg-white p-7 shadow-2xl sm:p-9">
            <button
              type="button"
              onClick={() => setShowHowItWorks(false)}
              className="absolute right-5 top-5 rounded-full p-2 text-xl text-slate-500 hover:bg-slate-100"
              aria-label="Close review explanation"
            >
              ×
            </button>
            <h2 id="reviews-explainer-title" className="text-2xl font-bold text-slate-950">
              How reviews work
            </h2>
            <div className="mt-7 space-y-5 text-sm leading-7 text-slate-600">
              <p>
                Reviews help future guests understand what a home is really like.
                CloudStay only accepts reviews connected to a genuine reservation.
              </p>
              <p>
                Only the guest who booked an accepted stay can review it. The review
                opens after checkout and remains available for 14 days.
              </p>
              <p>
                Guests rate the overall stay plus cleanliness, accuracy, check-in,
                communication, location, and value. Reviews are published on the
                listing after submission.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowHowItWorks(false)}
              className="mt-8 rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default PropertyReviews;
