import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { markNotificationsRead, readNotifications } from "../utils/localState.js";

function NotificationBell({ userId }) {
  const navigate = useNavigate();
  const panelRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    let active = true;
    const refresh = () => {
      if (active) setNotifications(userId ? readNotifications(userId) : []);
    };
    Promise.resolve().then(refresh);
    window.addEventListener("cloudstay:notifications-changed", refresh);
    return () => {
      active = false;
      window.removeEventListener("cloudstay:notifications-changed", refresh);
    };
  }, [userId]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  const unreadNotifications = notifications.filter((item) => !item.read);

  const handleToggle = () => {
    const nextOpen = !open;
    setOpen(nextOpen);

    if (!open && unreadNotifications.length > 0 && userId) {
      const updated = markNotificationsRead(
        userId,
        unreadNotifications.map((item) => item.id),
      );
      setNotifications(updated);
    }
  };

  const getTargetPath = (notification) => {
    if (notification.targetPath) return notification.targetPath;
    if (!notification.bookingId) return "";
    return notification.audience === "host"
      ? `/hosting/requests/${notification.bookingId}`
      : `/trips/${notification.bookingId}`;
  };

  const getNotificationLabel = (notification) => {
    if (notification.type === "message") return "Message";
    return notification.audience === "host" || notification.direction === "incoming"
      ? "Incoming"
      : "Travel";
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={handleToggle}
        className="relative rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
        aria-label="Open notifications"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-5 w-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
        </svg>
        {unreadNotifications.length > 0 && (
          <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
            {unreadNotifications.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-3 w-[340px] rounded-3xl border border-slate-200 bg-white p-3 shadow-2xl shadow-slate-200/80">
          <div className="flex items-center justify-between px-2 pb-2">
            <div>
              <p className="text-sm font-bold text-slate-950">Notifications</p>
              <p className="text-xs text-slate-500">Booking updates and decisions</p>
            </div>
          </div>

          <div className="max-h-80 space-y-2 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                No notifications yet
              </div>
            ) : (
              notifications.slice(0, 8).map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    const target = getTargetPath(notification);
                    if (target) navigate(target);
                  }}
                  className="block w-full rounded-2xl border border-slate-100 bg-slate-50 p-4 text-left transition hover:border-rose-200 hover:bg-rose-50"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-bold text-slate-950">{notification.title}</p>
                    <span
                      className={`rounded-full px-2 py-1 text-[10px] font-bold ${
                        notification.status === "Accepted"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-rose-50 text-rose-700"
                      }`}
                    >
                      {getNotificationLabel(notification)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{notification.message}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
