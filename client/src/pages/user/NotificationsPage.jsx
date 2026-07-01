import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppHeader from "../../components/AppHeader";
import { useAuth } from "../../context/useAuth";
import { markNotificationsRead, readNotifications } from "../../utils/localState.js";

function NotificationsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState(() => readNotifications(user?.userId));
  const unread = notifications.filter((notification) => !notification.read);

  const markAllRead = () => {
    setNotifications(markNotificationsRead(user.userId, unread.map((notification) => notification.id)));
  };

  return (
    <div className="min-h-screen bg-[#fffaf7] text-slate-950">
      <AppHeader />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-5">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-rose-500">Inbox</p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight">Notifications</h1>
            <p className="mt-3 text-slate-600">Booking decisions and account updates.</p>
          </div>
          {unread.length > 0 && (
            <button type="button" onClick={markAllRead} className="shrink-0 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-bold hover:bg-slate-50">
              Mark all as read
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <section className="mt-10 rounded-[2rem] border border-dashed border-slate-300 bg-white p-12 text-center">
            <h2 className="text-2xl font-bold">You’re all caught up</h2>
            <p className="mt-2 text-slate-500">New booking and account updates will appear here.</p>
          </section>
        ) : (
          <div className="mt-8 space-y-3">
            {notifications.map((notification) => (
              <button
                key={notification.id}
                type="button"
                onClick={() => notification.bookingId && navigate(`/trips/${notification.bookingId}`)}
                className={`block w-full rounded-3xl border p-5 text-left transition hover:border-rose-200 ${
                  notification.read ? "border-slate-200 bg-white" : "border-rose-100 bg-rose-50/60"
                }`}
              >
                <div className="flex items-start gap-4">
                  <span className={`mt-2 h-2.5 w-2.5 shrink-0 rounded-full ${notification.read ? "bg-slate-200" : "bg-rose-500"}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <h2 className="font-bold text-slate-950">{notification.title || "CloudStay update"}</h2>
                      <span className="shrink-0 text-xs font-semibold uppercase text-slate-500">{notification.status || "Update"}</span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{notification.message}</p>
                    <p className="mt-3 text-xs text-slate-400">{new Date(notification.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default NotificationsPage;
