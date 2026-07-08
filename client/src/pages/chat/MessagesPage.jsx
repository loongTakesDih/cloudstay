import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getConversationMessages,
  getConversations,
  sendConversationMessage,
} from "../../api/api.js";
import AppHeader from "../../components/AppHeader.jsx";

const formatConversationDate = (value) => {
  if (!value) return "";

  const date = new Date(value);
  const today = new Date();
  const sameDay = date.toDateString() === today.toDateString();

  return new Intl.DateTimeFormat("en-MY", sameDay
    ? { hour: "2-digit", minute: "2-digit" }
    : { day: "2-digit", month: "short" }
  ).format(date);
};

const formatMessageTime = (value) =>
  new Intl.DateTimeFormat("en-MY", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || fallback;

function MessagesPage() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const activeId = Number(conversationId) || null;
  const activeConversation = conversations.find((item) => item.id === activeId);

  const selectConversation = (id) => navigate(`/messages/${id}`);
  const showConversationList = () => navigate("/messages");

  const loadConversations = useCallback(async () => {
    try {
      const data = await getConversations();
      setConversations(data);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Could not load conversations."));
    } finally {
      setLoadingConversations(false);
    }
  }, []);

  const loadMessages = useCallback(async (showLoading = false) => {
    if (!activeId) {
      setMessages([]);
      return;
    }

    if (showLoading) setLoadingMessages(true);

    try {
      const data = await getConversationMessages(activeId);
      setMessages(data);
      setError("");
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Could not load messages."));
    } finally {
      if (showLoading) setLoadingMessages(false);
    }
  }, [activeId]);

  useEffect(() => {
    const initialLoadId = window.setTimeout(() => loadConversations(), 0);
    const intervalId = window.setInterval(() => loadConversations(), 30000);
    return () => {
      window.clearTimeout(initialLoadId);
      window.clearInterval(intervalId);
    };
  }, [loadConversations]);

  useEffect(() => {
    const initialLoadId = window.setTimeout(() => loadMessages(true), 0);
    const intervalId = window.setInterval(() => loadMessages(), 10000);
    return () => {
      window.clearTimeout(initialLoadId);
      window.clearInterval(intervalId);
    };
  }, [activeId, loadMessages]);

  useEffect(() => {
    const refresh = (event) => {
      if (!["message", "conversation", "booking"].includes(event.detail?.entity)) {
        return;
      }
      loadConversations();
      if (
        activeId &&
        (!event.detail?.conversationId ||
          Number(event.detail.conversationId) === activeId)
      ) {
        loadMessages();
      }
    };
    window.addEventListener("cloudstay:data-changed", refresh);
    return () => window.removeEventListener("cloudstay:data-changed", refresh);
  }, [activeId, loadConversations, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeId, messages.length]);

  const handleSend = async (event) => {
    event.preventDefault();
    const body = draft.trim();

    if (!body || !activeId || sending) return;

    setSending(true);
    setError("");

    try {
      const sentMessage = await sendConversationMessage(activeId, body);
      setMessages((current) =>
        current.some((message) => message.id === sentMessage.id)
          ? current
          : [...current, sentMessage],
      );
      setConversations((current) =>
        current
          .map((conversation) =>
            conversation.id === activeId
              ? {
                  ...conversation,
                  updatedAt: sentMessage.createdAt,
                  lastMessage: {
                    id: sentMessage.id,
                    body: sentMessage.body,
                    senderId: sentMessage.senderId,
                    createdAt: sentMessage.createdAt,
                  },
                }
              : conversation,
          )
          .sort((left, right) => new Date(right.updatedAt) - new Date(left.updatedAt)),
      );
      setDraft("");
      loadConversations();
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Your message could not be sent."));
    } finally {
      setSending(false);
    }
  };

  const handleComposerKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  };

  return (
    <div className="min-h-screen bg-[#fffaf7] text-slate-950">
      <AppHeader
        eyebrow="Guest & host chat"
        title="Messages"
        subtitle="Keep every stay conversation together with its booking."
      />

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {error && (
          <div
            role="alert"
            className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700"
          >
            {error}
          </div>
        )}

        <section className="grid min-h-[680px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50 md:grid-cols-[320px_minmax(0,1fr)]">
          <aside className={`${activeId ? "hidden md:flex" : "flex"} min-h-0 flex-col border-r border-slate-200`}>
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="font-bold text-slate-950">Conversations</h2>
              <p className="mt-1 text-xs text-slate-500">
                Messages are private to each booking.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {loadingConversations ? (
                <p className="p-4 text-sm text-slate-500">Loading conversations...</p>
              ) : conversations.length === 0 ? (
                <div className="m-2 rounded-xl border border-dashed border-slate-300 p-5 text-center">
                  <p className="font-bold text-slate-800">No messages yet</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Open a booking or trip and choose Message to start chatting.
                  </p>
                </div>
              ) : (
                conversations.map((conversation) => {
                  const isActive = conversation.id === activeId;
                  const lastMessageDate =
                    conversation.lastMessage?.createdAt || conversation.updatedAt;

                  return (
                    <button
                      key={conversation.id}
                      type="button"
                      onClick={() => selectConversation(conversation.id)}
                      className={`mb-1 w-full rounded-xl p-4 text-left transition ${
                        isActive
                          ? "bg-rose-50 ring-1 ring-rose-200"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-bold text-slate-950">
                            {conversation.otherUser?.username || "CloudStay user"}
                          </p>
                          <p className="mt-0.5 truncate text-xs font-semibold text-rose-600">
                            {conversation.property?.title || "Booking"}
                          </p>
                        </div>
                        <span className="shrink-0 text-[11px] text-slate-500">
                          {formatConversationDate(lastMessageDate)}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <p className="min-w-0 flex-1 truncate text-sm text-slate-500">
                          {conversation.lastMessage?.body || "Start the conversation"}
                        </p>
                        {conversation.unreadCount > 0 && (
                          <span className="min-w-5 rounded-full bg-rose-500 px-1.5 py-0.5 text-center text-[10px] font-bold text-white">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          <div className={`${activeId ? "flex" : "hidden md:flex"} min-h-0 flex-col`}>
            {!activeId ? (
              <div className="flex flex-1 items-center justify-center p-8 text-center">
                <div>
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-2xl">
                    💬
                  </div>
                  <h2 className="mt-4 text-xl font-bold">Choose a conversation</h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Select a booking chat to read and reply.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-4 sm:px-6">
                  <button
                    type="button"
                    onClick={showConversationList}
                    className="rounded-lg border border-slate-200 p-2 text-slate-600 md:hidden"
                    aria-label="Back to conversations"
                  >
                    ←
                  </button>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-bold text-slate-950">
                      {activeConversation?.otherUser?.username || "Booking conversation"}
                    </h2>
                    <p className="truncate text-xs text-slate-500">
                      {activeConversation?.property?.title || "CloudStay booking"}
                      {activeConversation?.bookingStatus
                        ? ` · ${activeConversation.bookingStatus}`
                        : ""}
                    </p>
                  </div>
                  {activeConversation?.propertyId && (
                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          activeConversation.bookingId
                            ? activeConversation.currentUserIsHost
                              ? `/hosting/requests/${activeConversation.bookingId}`
                              : `/trips/${activeConversation.bookingId}`
                            : `/properties/${activeConversation.propertyId}`,
                        )
                      }
                      className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
                    >
                      {activeConversation.bookingId ? "View booking" : "View listing"}
                    </button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto bg-slate-50/70 px-4 py-6 sm:px-6">
                  {loadingMessages ? (
                    <p className="text-center text-sm text-slate-500">Loading messages...</p>
                  ) : messages.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-center">
                      <div>
                        <p className="font-bold text-slate-800">Start the conversation</p>
                        <p className="mt-2 text-sm text-slate-500">
                          Ask a question or share an update about this stay.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.isMine ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[82%] rounded-2xl px-4 py-3 shadow-sm sm:max-w-[70%] ${
                              message.isMine
                                ? "rounded-br-md bg-rose-500 text-white"
                                : "rounded-bl-md border border-slate-200 bg-white text-slate-800"
                            }`}
                          >
                            {!message.isMine && (
                              <p className="mb-1 text-xs font-bold text-rose-600">
                                {message.senderName}
                              </p>
                            )}
                            <p className="whitespace-pre-wrap break-words text-sm leading-6">
                              {message.body}
                            </p>
                            <p
                              className={`mt-1 text-right text-[10px] ${
                                message.isMine ? "text-rose-100" : "text-slate-400"
                              }`}
                            >
                              {formatMessageTime(message.createdAt)}
                              {message.isMine && message.readAt ? " · Read" : ""}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                <form onSubmit={handleSend} className="border-t border-slate-200 bg-white p-4 sm:p-5">
                  <div className="flex items-end gap-3">
                    <textarea
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      onKeyDown={handleComposerKeyDown}
                      maxLength={1000}
                      rows={1}
                      placeholder="Write a message..."
                      className="max-h-32 min-h-11 flex-1 resize-y rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                      aria-label="Message"
                    />
                    <button
                      type="submit"
                      disabled={!draft.trim() || sending}
                      className="h-11 rounded-xl bg-rose-500 px-5 text-sm font-bold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      {sending ? "Sending..." : "Send"}
                    </button>
                  </div>
                  <p className="mt-2 text-right text-[11px] text-slate-400">
                    {draft.length}/1000
                  </p>
                </form>
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default MessagesPage;
