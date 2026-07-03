import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getBookingRequests,
  getConversations,
} from "../api/api.js";

const formatDate = (value) =>
  new Intl.DateTimeFormat("en-MY", {
    day: "2-digit",
    month: "short",
  }).format(new Date(value));

function HostNotificationBell() {
  const navigate = useNavigate();
  const panelRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [unreadConversations, setUnreadConversations] = useState([]);

  const loadNotifications = useCallback(async () => {
    try {
      const [bookings, conversations] = await Promise.all([
        getBookingRequests(),
        getConversations(),
      ]);

      setPendingRequests(
        bookings.filter(
          (booking) => String(booking.status).toLowerCase() === "pending",
        ),
      );
      setUnreadConversations(
        conversations.filter(
          (conversation) =>
            conversation.currentUserIsHost && conversation.unreadCount > 0,
        ),
      );
    } catch {
      // A temporary notification failure should not interrupt the host dashboard.
    }
  }, []);

  useEffect(() => {
    const initialLoadId = window.setTimeout(() => loadNotifications(), 0);
    const pollingId = window.setInterval(loadNotifications, 5000);

    return () => {
      window.clearTimeout(initialLoadId);
      window.clearInterval(pollingId);
    };
  }, [loadNotifications]);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  const unreadMessageCount = unreadConversations.reduce(
    (total, conversation) => total + conversation.unreadCount,
    0,
  );
  const totalCount = pendingRequests.length + unreadMessageCount;

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => {
          setOpen((current) => !current);
          loadNotifications();
        }}
        className="relative rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
        aria-label={`Host notifications${totalCount ? `, ${totalCount} pending` : ""}`}
        aria-expanded={open}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.8}
          stroke="currentColor"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
          />
        </svg>
        {totalCount > 0 && (
          <span className="absolute -right-1.5 -top-1.5 min-w-5 rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white ring-2 ring-white">
            {totalCount > 99 ? "99+" : totalCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-3 w-[360px] max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white p-3 text-slate-950 shadow-2xl shadow-slate-300/70">
          <div className="px-2 pb-3">
            <h2 className="font-bold">Host notifications</h2>
            <p className="mt-1 text-xs text-slate-500">
              Booking requests and unread guest messages
            </p>
          </div>

          {totalCount === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">
              You are all caught up.
            </div>
          ) : (
            <div className="max-h-96 space-y-4 overflow-y-auto">
              {pendingRequests.length > 0 && (
                <section>
                  <p className="px-2 text-xs font-bold uppercase tracking-wide text-rose-500">
                    Booking requests · {pendingRequests.length}
                  </p>
                  <div className="mt-2 space-y-1">
                    {pendingRequests.slice(0, 5).map((booking) => (
                      <button
                        key={booking.id}
                        type="button"
                        onClick={() => {
                          setOpen(false);
                          navigate(`/hosting/requests/${booking.id}`);
                        }}
                        className="block w-full rounded-xl bg-slate-50 p-3 text-left transition hover:bg-rose-50"
                      >
                        <p className="text-sm font-bold">
                          {booking.guest?.username || "Guest"} requested{" "}
                          {booking.property?.title || "your listing"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {formatDate(booking.checkIn)} – {formatDate(booking.checkOut)}
                        </p>
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {unreadConversations.length > 0 && (
                <section>
                  <p className="px-2 text-xs font-bold uppercase tracking-wide text-rose-500">
                    Unread messages · {unreadMessageCount}
                  </p>
                  <div className="mt-2 space-y-1">
                    {unreadConversations.slice(0, 5).map((conversation) => (
                      <button
                        key={conversation.id}
                        type="button"
                        onClick={() => {
                          setOpen(false);
                          navigate(`/messages/${conversation.id}`);
                        }}
                        className="flex w-full items-center gap-3 rounded-xl bg-slate-50 p-3 text-left transition hover:bg-rose-50"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold">
                            {conversation.otherUser?.username || "Guest"}
                          </p>
                          <p className="mt-1 truncate text-xs text-slate-500">
                            {conversation.lastMessage?.body || "New message"}
                          </p>
                        </div>
                        <span className="min-w-5 rounded-full bg-rose-500 px-1.5 py-0.5 text-center text-[10px] font-bold text-white">
                          {conversation.unreadCount}
                        </span>
                      </button>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default HostNotificationBell;
