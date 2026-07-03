import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getConversations } from "../api/api.js";
import { useAuth } from "../context/useAuth.js";

function MessageNotifications() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const notifiedMessageIdsRef = useRef(new Set());
  const loadedUserIdRef = useRef(null);
  const dismissTimerRef = useRef(null);
  const mountedRef = useRef(true);
  const [toast, setToast] = useState(null);
  const userId = user?.userId;

  const loadUnreadMessages = useCallback(async () => {
    if (!userId) return;

    try {
      const conversations = await getConversations();
      if (!mountedRef.current) return;

      if (loadedUserIdRef.current !== userId) {
        loadedUserIdRef.current = userId;
        notifiedMessageIdsRef.current.clear();
      }

      const incoming = conversations.filter(
        (conversation) =>
          conversation.unreadCount > 0 &&
          conversation.lastMessage &&
          String(conversation.lastMessage.senderId) !== String(userId),
      );

      const newestUnnotified = incoming.find(
        (conversation) =>
          !notifiedMessageIdsRef.current.has(conversation.lastMessage.id),
      );

      incoming.forEach((conversation) => {
        notifiedMessageIdsRef.current.add(conversation.lastMessage.id);
      });

      if (newestUnnotified) {
        setToast({
          conversationId: newestUnnotified.id,
          senderName: newestUnnotified.otherUser?.username || "CloudStay user",
          propertyTitle: newestUnnotified.property?.title || "your stay",
          body: newestUnnotified.lastMessage.body,
        });

        window.clearTimeout(dismissTimerRef.current);
        dismissTimerRef.current = window.setTimeout(() => {
          if (mountedRef.current) setToast(null);
        }, 7000);
      }
    } catch {
      // Notifications should never interrupt the page if polling temporarily fails.
    }
  }, [userId]);

  useEffect(() => {
    mountedRef.current = true;

    if (!userId) {
      const resetId = window.setTimeout(() => {
        setToast(null);
      }, 0);

      return () => window.clearTimeout(resetId);
    }

    const initialLoadId = window.setTimeout(() => loadUnreadMessages(), 0);
    const pollingId = window.setInterval(loadUnreadMessages, 5000);

    return () => {
      window.clearTimeout(initialLoadId);
      window.clearInterval(pollingId);
      window.clearTimeout(dismissTimerRef.current);
    };
  }, [loadUnreadMessages, userId]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  if (!user) return null;

  const openConversation = (conversationId) => {
    setToast(null);
    navigate(conversationId ? `/messages/${conversationId}` : "/messages");
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex max-w-[calc(100vw-2.5rem)] flex-col items-end gap-3">
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="w-80 max-w-full rounded-2xl border border-rose-200 bg-white p-4 shadow-2xl shadow-slate-300/70"
        >
          <div className="flex items-start justify-between gap-3">
            <button
              type="button"
              onClick={() => openConversation(toast.conversationId)}
              className="min-w-0 flex-1 text-left"
            >
              <p className="text-xs font-bold uppercase tracking-wide text-rose-500">
                New message
              </p>
              <p className="mt-1 truncate font-bold text-slate-950">
                {toast.senderName}
              </p>
              <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">
                {toast.propertyTitle}
              </p>
              <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                {toast.body}
              </p>
            </button>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label="Dismiss message notification"
            >
              ×
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

export default MessageNotifications;
