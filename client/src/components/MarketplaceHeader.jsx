import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

const MenuIcon = ({ type }) => (
  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-600">
    {type === "trips" && (
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
        <path d="m3 11 18-7-7 18-3-8-8-3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    )}
    {type === "saved" && (
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    )}
    {type === "profile" && (
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
        <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7 8a7 7 0 0 0-14 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )}
    {type === "notifications" && (
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
        <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7Zm-8 11h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )}
    {type === "hosting" && (
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
        <path d="m3 11 9-7 9 7v9h-6v-6H9v6H3v-9Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    )}
  </span>
);

function MarketplaceHeader({
  actions = null,
  centerContent = null,
  hostingMode = false,
}) {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const menuRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return undefined;

    const closeOnOutsideClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen]);

  const goTo = (path) => {
    setMenuOpen(false);
    navigate(path);
  };

  const handleHosting = () => {
    if (hostingMode) {
      goTo("/");
      return;
    }

    if (!user) {
      goTo("/login");
      return;
    }

    goTo(user.isHost ? "/hosting/dashboard" : "/become-host");
  };

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
      <div className="relative mx-auto flex h-[76px] max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-10 2xl:px-12">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-left"
          aria-label="CloudStay home"
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-rose-500 text-white shadow-sm shadow-rose-200">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
              <path d="M4 11.5 12 5l8 6.5V20h-5v-5H9v5H4v-8.5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="hidden text-xl font-extrabold tracking-tight text-rose-500 sm:block">
            CloudStay
          </span>
        </button>

        {centerContent && (
          <div className="absolute left-1/2 hidden max-w-[46vw] -translate-x-1/2 items-center justify-center md:flex">
            {centerContent}
          </div>
        )}

        <div className="flex items-center gap-2 sm:gap-3">
          {actions}
          <button
            type="button"
            onClick={handleHosting}
            className={`rounded-full px-3 py-2.5 text-sm font-bold text-slate-800 transition hover:bg-slate-100 sm:px-4 ${
              hostingMode ? "hidden xl:block" : ""
            }`}
          >
            {hostingMode ? "Switch to traveling" : user?.isHost ? "Switch to hosting" : "Become a host"}
          </button>

          <button
            type="button"
            onClick={() => goTo(user ? "/profile" : "/login")}
            className="grid h-11 w-11 place-items-center rounded-full bg-slate-950 text-sm font-bold text-white transition hover:bg-slate-800"
            aria-label={user ? "Open profile" : "Log in to your profile"}
            title={user ? "Profile" : "Log in"}
          >
            {user?.username ? (
              user.username.slice(0, 1).toUpperCase()
            ) : (
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7 8a7 7 0 0 0-14 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            )}
          </button>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className={`group grid h-11 w-11 place-items-center rounded-full border bg-white transition ${
                menuOpen
                  ? "border-slate-950 shadow-md"
                  : "border-slate-300 hover:border-slate-500 hover:shadow-sm"
              }`}
              aria-label="Open account menu"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
            >
              <span className="relative block h-4 w-5">
                <span className={`absolute left-0 top-0 h-0.5 w-5 rounded-full bg-slate-800 transition duration-300 ${menuOpen ? "translate-y-[7px] rotate-45" : ""}`} />
                <span className={`absolute left-0 top-[7px] h-0.5 w-5 rounded-full bg-slate-800 transition duration-300 ${menuOpen ? "scale-x-0 opacity-0" : ""}`} />
                <span className={`absolute left-0 top-[14px] h-0.5 w-5 rounded-full bg-slate-800 transition duration-300 ${menuOpen ? "-translate-y-[7px] -rotate-45" : ""}`} />
              </span>
            </button>

            <div
              className={`absolute right-0 mt-3 w-[290px] origin-top-right overflow-hidden rounded-3xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-300/50 transition duration-200 ${
                menuOpen
                  ? "visible translate-y-0 scale-100 opacity-100"
                  : "invisible -translate-y-2 scale-95 opacity-0"
              }`}
              role="menu"
            >
              {user ? (
                <>
                  <div className="border-b border-slate-100 px-3 py-3">
                    <p className="truncate font-bold text-slate-950">{user.username || "Traveler"}</p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">{user.email}</p>
                  </div>

                  <div className="py-2">
                    <button type="button" onClick={() => goTo("/my-trips")} className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-950" role="menuitem">
                      <MenuIcon type="trips" /> My trips
                    </button>
                    <button type="button" onClick={() => goTo("/saved-places")} className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-950" role="menuitem">
                      <MenuIcon type="saved" /> Saved places
                    </button>
                    <button type="button" onClick={() => goTo("/profile")} className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-950" role="menuitem">
                      <MenuIcon type="profile" /> Profile
                    </button>
                    <button type="button" onClick={() => goTo("/notifications")} className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-950" role="menuitem">
                      <MenuIcon type="notifications" /> Notifications
                    </button>
                    <button type="button" onClick={() => goTo(user.isHost ? "/hosting/dashboard" : "/become-host")} className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-950" role="menuitem">
                      <MenuIcon type="hosting" /> {user.isHost ? "Hosting dashboard" : "Hosting status"}
                    </button>
                  </div>

                  <div className="border-t border-slate-100 pt-2">
                    <button type="button" onClick={handleLogout} className="w-full rounded-2xl px-4 py-3 text-left text-sm font-bold text-rose-600 transition hover:bg-rose-50" role="menuitem">
                      Log out
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-1">
                  <div className="px-3 pb-2 pt-3">
                    <p className="font-bold text-slate-950">Welcome to CloudStay</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">Log in to book, save, and manage your trips.</p>
                  </div>
                  <button type="button" onClick={() => goTo("/login")} className="w-full rounded-2xl bg-rose-500 px-4 py-3 text-left text-sm font-bold text-white transition hover:bg-rose-600" role="menuitem">
                    Log in
                  </button>
                  <button type="button" onClick={() => goTo("/register")} className="w-full rounded-2xl px-4 py-3 text-left text-sm font-bold text-slate-700 transition hover:bg-slate-50" role="menuitem">
                    Sign up
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default MarketplaceHeader;
