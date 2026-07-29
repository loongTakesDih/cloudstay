import { useEffect, useState } from "react";
import { getUserProfile } from "../api/api";

function UserProfileModal({ userId, fallbackName = "CloudStay member", title = "Profile", onClose }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  useEffect(() => {
    if (!userId) return undefined;

    let active = true;
    setLoading(true);
    setError("");

    getUserProfile(userId)
      .then((data) => {
        if (active) setProfile(data);
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError.response?.data?.message || "Could not load this profile.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [userId]);

  const name = profile?.username || fallbackName;
  const initial = name.slice(0, 1).toUpperCase();
  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).getFullYear()
    : null;
  const details = profile?.profileDetails || [];

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md overflow-hidden rounded-[2rem] bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
          <h2 className="text-lg font-bold text-slate-950">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-slate-200 text-xl leading-none text-slate-600 transition hover:bg-slate-50"
            aria-label="Close profile"
          >
            x
          </button>
        </div>

        <div className="max-h-[78vh] overflow-y-auto p-6">
          {loading ? (
            <p className="rounded-2xl bg-slate-50 p-6 text-sm text-slate-500">Loading profile...</p>
          ) : error ? (
            <div className="rounded-2xl border border-rose-100 bg-rose-50 p-6">
              <p className="font-bold text-rose-700">Profile unavailable</p>
              <p className="mt-1 text-sm text-rose-600">{error}</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4">
                {profile?.profilePictureUrl ? (
                  <img
                    src={profile.profilePictureUrl}
                    alt={name}
                    className="h-20 w-20 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-slate-950 text-2xl font-bold text-white">
                    {initial}
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="truncate text-xl font-bold text-slate-950">{name}</h3>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    {profile?.isHost ? "CloudStay host" : "CloudStay guest"}
                  </p>
                  {memberSince && (
                    <p className="mt-0.5 text-xs font-semibold text-slate-400">
                      Member since {memberSince}
                    </p>
                  )}
                </div>
              </div>

              {profile?.aboutMe ? (
                <p className="mt-6 text-sm leading-7 text-slate-700">{profile.aboutMe}</p>
              ) : (
                <div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-4">
                  <p className="text-sm font-semibold text-slate-500">
                    This member has not added an about section yet.
                  </p>
                </div>
              )}

              {details.length > 0 && (
                <div className="mt-6 grid gap-x-8 gap-y-5 border-t border-slate-200 pt-6 sm:grid-cols-2">
                  {details.map((item) => (
                    <div key={item.label}>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                        {item.label}
                      </p>
                      <p className="mt-1 text-sm font-semibold leading-6 text-slate-800">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserProfileModal;
