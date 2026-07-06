import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppHeader from "../../components/AppHeader";
import {
  getBookingRequests,
  getConversations,
  getMyTrips,
} from "../../api/api.js";
import { useAuth } from "../../context/useAuth";
import {
  markNotificationsRead,
  readNotifications,
  writeNotifications,
} from "../../utils/localState.js";

const dateKey = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
};

const notificationEventId = (notification) => {
  if (notification.eventId) return notification.eventId;
  if (notification.messageId) return `message:${notification.messageId}`;
  if (
    String(notification.id || "").startsWith("guest-booking-") ||
    String(notification.id || "").startsWith("host-booking-")
  ) {
    return notification.id;
  }
  return null;
};

function NotificationsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState(() => readNotifications(user?.userId));
  const [liveRevision, setLiveRevision] = useState(0);
  const unread = notifications.filter((notification) => !notification.read);

  useEffect(() => {
    const refresh = () => setNotifications(readNotifications(user?.userId));
    window.addEventListener("cloudstay:notifications-changed", refresh);
    return () => window.removeEventListener("cloudstay:notifications-changed", refresh);
  }, [user?.userId]);

  useEffect(() => {
    const refresh = () => setLiveRevision((revision) => revision + 1);
    window.addEventListener("cloudstay:data-changed", refresh);
    return () => window.removeEventListener("cloudstay:data-changed", refresh);
  }, []);

  useEffect(() => {
    let active = true;

    const loadNotifications = async () => {
      try {
        const [tripResult, conversationResult, hostBookingResult] =
          await Promise.allSettled([
            getMyTrips(),
            getConversations(),
            user?.isHost ? getBookingRequests() : Promise.resolve([]),
          ]);

        if (!active) return;
        const trips = tripResult.status === "fulfilled" ? tripResult.value : [];
        const conversations =
          conversationResult.status === "fulfilled" ? conversationResult.value : [];
        const hostBookings =
          hostBookingResult.status === "fulfilled" ? hostBookingResult.value : [];
        const today = dateKey(new Date());

        const generated = [
          ...trips.map((booking) => ({
            id: `guest-booking-${booking.id}-${booking.status}-${booking.paymentStatus}`,
            eventId: `guest-booking-${booking.id}-${booking.status}-${booking.paymentStatus}`,
            type: "booking-status",
            audience: "guest",
            direction: "outgoing",
            title:
              booking.status === "Accepted"
                ? "Booking accepted"
                : booking.status === "Declined"
                  ? "Booking declined"
                  : booking.status === "CheckedOut" || booking.status === "Completed"
                    ? "Stay completed"
                    : booking.paymentStatus === "Paid"
                      ? "Payment completed"
                      : "Payment required",
            message:
              booking.status === "Declined" && booking.paymentStatus === "Refunded"
                ? `${booking.property?.title || "Your CloudStay booking"} was declined and refunded.`
                : booking.status === "Pending" && booking.paymentStatus === "Paid"
                  ? `${booking.property?.title || "Your CloudStay booking"} is paid and waiting for host approval.`
                  : `${booking.property?.title || "Your CloudStay booking"} is ${String(booking.status || "pending").toLowerCase()}.`,
            bookingId: booking.id,
            propertyId: booking.propertyId,
            propertyTitle: booking.property?.title,
            status: booking.status || "Pending",
            targetPath: `/trips/${booking.id}`,
            createdAt: booking.updatedAt || booking.createdAt,
          })),
          ...hostBookings
            .filter((booking) =>
              ["pending", "checkedout"].includes(
                String(booking.status || "").toLowerCase(),
              ),
            )
            .map((booking) => {
              const checkedOut =
                String(booking.status || "").toLowerCase() === "checkedout";
              const view =
                dateKey(booking.checkIn) === today ? "today" : "upcoming";
              return {
                id: `host-booking-${booking.id}-${booking.status}`,
                eventId: `host-booking-${booking.id}-${booking.status}`,
                type: checkedOut ? "booking-status" : "booking-request",
                audience: "host",
                direction: "incoming",
                title: checkedOut ? "Guest checked out" : "New paid booking request",
                message: checkedOut
                  ? `${booking.property?.title || "Your property"} is ready for inspection and preparation.`
                  : `${booking.guest?.username || "A guest"} paid for ${booking.property?.title || "your property"} and is waiting for your review.`,
                bookingId: booking.id,
                propertyId: booking.propertyId,
                propertyTitle: booking.property?.title,
                status: booking.status,
                targetPath: checkedOut
                  ? "/hosting/dashboard?tab=listings"
                  : `/hosting/dashboard?tab=bookings&view=${view}`,
                createdAt: booking.updatedAt || booking.createdAt,
              };
            }),
          ...conversations
            .filter(
              (conversation) =>
                conversation.unreadCount > 0 && conversation.lastMessage,
            )
            .map((conversation) => ({
              id: `message-${conversation.lastMessage.id}`,
              eventId: `message:${conversation.lastMessage.id}`,
              type: "message",
              direction: "incoming",
              title: `New message from ${conversation.otherUser?.username || "CloudStay user"}`,
              message: conversation.lastMessage.body,
              conversationId: conversation.id,
              messageId: conversation.lastMessage.id,
              propertyId: conversation.property?.id,
              propertyTitle: conversation.property?.title,
              targetPath: `/messages/${conversation.id}`,
              createdAt: conversation.lastMessage.createdAt,
            })),
        ];

        const existing = readNotifications(user?.userId);
        const existingEventIds = new Set(
          existing.map(notificationEventId).filter(Boolean),
        );
        const merged = [
          ...generated
            .filter(
              (notification) =>
                !existingEventIds.has(notificationEventId(notification)),
            )
            .map((notification) => ({ ...notification, read: false })),
          ...existing,
        ].sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime(),
        );

        writeNotifications(user?.userId, merged);
        setNotifications(merged);
      } catch {
        // Keep the locally cached notification list if a request is unavailable.
      }
    };

    loadNotifications();
    return () => {
      active = false;
    };
  }, [liveRevision, user?.isHost, user?.userId]);

  const markAllRead = () => {
    setNotifications(markNotificationsRead(user.userId, unread.map((notification) => notification.id)));
  };

  const getNotificationLabel = (notification) => {
    if (notification.type === "message") {
      return notification.direction === "incoming" ? "Incoming message" : "Sent message";
    }
    if (notification.audience === "host" || notification.direction === "incoming") {
      return "Incoming request";
    }
    return "Your booking";
  };

  const openNotification = (notification) => {
    if (!notification.read) {
      setNotifications(markNotificationsRead(user.userId, [notification.id]));
    }
    const fallbackPath =
      notification.audience === "host"
        ? `/hosting/requests/${notification.bookingId}`
        : `/trips/${notification.bookingId}`;
    const target = notification.targetPath || (notification.bookingId ? fallbackPath : "");
    if (target) navigate(target);
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
                onClick={() => openNotification(notification)}
                className={`block w-full rounded-3xl border p-5 text-left transition hover:border-rose-200 ${
                  notification.read ? "border-slate-200 bg-white" : "border-rose-100 bg-rose-50/60"
                }`}
              >
                <div className="flex items-start gap-4">
                  <span className={`mt-2 h-2.5 w-2.5 shrink-0 rounded-full ${notification.read ? "bg-slate-200" : "bg-rose-500"}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <h2 className="font-bold text-slate-950">{notification.title || "CloudStay update"}</h2>
                      <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase text-slate-600">{getNotificationLabel(notification)}</span>
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
