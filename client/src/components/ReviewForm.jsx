import { useEffect, useState } from "react";
import {
  createReview,
  getReviewEligibility,
} from "../api/api.js";

const RATING_FIELDS = [
  ["overallRating", "Overall experience"],
  ["cleanlinessRating", "Cleanliness"],
  ["accuracyRating", "Accuracy"],
  ["checkInRating", "Check-in"],
  ["communicationRating", "Communication"],
  ["locationRating", "Location"],
  ["valueRating", "Value"],
];

const initialRatings = Object.fromEntries(RATING_FIELDS.map(([key]) => [key, 0]));

function StarRating({ label, onChange, value }) {
  return (
    <div>
      <p className="text-sm font-bold text-slate-800">{label}</p>
      <div className="mt-2 flex gap-1" aria-label={`${label}: ${value} out of 5`}>
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => onChange(rating)}
            className={`text-2xl transition ${
              rating <= value ? "text-amber-400" : "text-slate-200 hover:text-amber-200"
            }`}
            aria-label={`${rating} star${rating === 1 ? "" : "s"}`}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  );
}

function ReviewForm({ bookingId }) {
  const [eligibility, setEligibility] = useState(null);
  const [ratings, setRatings] = useState(initialRatings);
  const [hostRating, setHostRating] = useState(0);
  const [comment, setComment] = useState("");
  const [hostReviewComment, setHostReviewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let active = true;
    const loadId = window.setTimeout(async () => {
      try {
        const data = await getReviewEligibility(bookingId);
        if (active) setEligibility(data);
      } catch {
        if (active) setEligibility(null);
      } finally {
        if (active) setLoading(false);
      }
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(loadId);
    };
  }, [bookingId]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (Object.values(ratings).some((rating) => rating === 0)) {
      setError("Please rate every category.");
      return;
    }

    if (hostRating === 0) {
      setError("Please rate your host.");
      return;
    }

    if (comment.trim().length < 10) {
      setError("Please write at least 10 characters about your stay.");
      return;
    }

    setSubmitting(true);
    try {
      await createReview({
        bookingId: Number(bookingId),
        ...ratings,
        comment: comment.trim(),
        hostRating,
        hostReviewComment: hostReviewComment.trim() || null,
      });
      setSubmitted(true);
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Could not publish your review.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p className="mt-6 text-sm text-slate-500">Checking review eligibility...</p>;
  }

  if (submitted) {
    return (
      <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
        <h3 className="font-bold text-emerald-800">Review published</h3>
        <p className="mt-1 text-sm text-emerald-700">
          Thank you for helping future CloudStay guests.
        </p>
      </div>
    );
  }

  if (!eligibility?.canReview) {
    return (
      <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <h3 className="font-bold text-slate-900">Review this stay</h3>
        <p className="mt-2 text-sm text-slate-600">
          {eligibility?.reason || "Review eligibility is currently unavailable."}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 border-t border-slate-200 pt-8">
      <h3 className="text-2xl font-bold text-slate-950">Review your stay</h3>
      <p className="mt-2 text-sm text-slate-500">
        Your ratings and public comment will appear on the listing.
      </p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        {RATING_FIELDS.map(([key, label]) => (
          <StarRating
            key={key}
            label={label}
            value={ratings[key]}
            onChange={(value) =>
              setRatings((current) => ({ ...current, [key]: value }))
            }
          />
        ))}
      </div>

      <label className="mt-6 block">
        <span className="text-sm font-bold text-slate-800">Public review</span>
        <textarea
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          maxLength={2000}
          rows={5}
          placeholder="What should future guests know about this stay?"
          className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
        />
      </label>

      <section className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-5">
        <h4 className="text-lg font-bold text-slate-950">Rate your host</h4>
        <p className="mt-1 text-sm text-slate-500">
          This helps future guests understand the hosting experience.
        </p>
        <div className="mt-5">
          <StarRating
            label="Host rating"
            value={hostRating}
            onChange={setHostRating}
          />
        </div>
        <label className="mt-5 block">
          <span className="text-sm font-bold text-slate-800">Host review</span>
          <textarea
            value={hostReviewComment}
            onChange={(event) => setHostReviewComment(event.target.value)}
            maxLength={2000}
            rows={4}
            placeholder="Optional: what stood out about your host?"
            className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
          />
        </label>
      </section>

      {error && <p className="mt-3 text-sm font-semibold text-rose-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="mt-5 rounded-xl bg-rose-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-rose-600 disabled:bg-slate-300"
      >
        {submitting ? "Publishing..." : "Publish review"}
      </button>
    </form>
  );
}

export default ReviewForm;
