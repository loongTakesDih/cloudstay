import { useCallback, useEffect, useRef } from "react";
import { getConversations } from "../api/api.js";
import { useAuth } from "../context/useAuth.js";
import { addNotification } from "../utils/localState.js";

function MessageNotifications() {
  const { user } = useAuth();
  const recordedMessageIdsRef = useRef(new Set());
  const loadedUserIdRef = useRef(null);
  const userId = user?.userId;

  const syncUnreadMessages = useCallback(async () => {
    if (!userId) return;

    try {
      const conversations = await getConversations();

      if (loadedUserIdRef.current !== userId) {
        loadedUserIdRef.current = userId;
        recordedMessageIdsRef.current.clear();
      }

      conversations
        .filter(
          (conversation) =>
            conversation.unreadCount > 0 &&
            conversation.lastMessage &&
            String(conversation.lastMessage.senderId) !== String(userId),
        )
        .forEach((conversation) => {
          const message = conversation.lastMessage;
          if (recordedMessageIdsRef.current.has(message.id)) return;

          recordedMessageIdsRef.current.add(message.id);
          addNotification(userId, {
            type: "message",
            direction: "incoming",
            title: `New message from ${conversation.otherUser?.username || "CloudStay user"}`,
            message: message.body,
            conversationId: conversation.id,
            messageId: message.id,
            propertyId: conversation.property?.id,
            propertyTitle: conversation.property?.title || "CloudStay stay",
            targetPath: `/messages/${conversation.id}`,
          });
        });
    } catch {
      // Notification syncing must never interrupt the current page.
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return undefined;

    const initialLoadId = window.setTimeout(syncUnreadMessages, 0);
    const pollingId = window.setInterval(syncUnreadMessages, 30000);

    return () => {
      window.clearTimeout(initialLoadId);
      window.clearInterval(pollingId);
    };
  }, [syncUnreadMessages, userId]);

  useEffect(() => {
    if (!userId) return undefined;
    const refresh = (event) => {
      if (["message", "conversation"].includes(event.detail?.entity)) {
        syncUnreadMessages();
      }
    };
    window.addEventListener("cloudstay:data-changed", refresh);
    return () => window.removeEventListener("cloudstay:data-changed", refresh);
  }, [syncUnreadMessages, userId]);

  return null;
}

export default MessageNotifications;
