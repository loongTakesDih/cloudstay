export const getSavedListingsKey = (userId) =>
  `cloudstay_saved_listings_${userId ?? "guest"}`;

export const readSavedListings = (userId) => {
  try {
    const raw = localStorage.getItem(getSavedListingsKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const writeSavedListings = (userId, listings) => {
  localStorage.setItem(getSavedListingsKey(userId), JSON.stringify(listings));
};

export const getNotificationsKey = (userId) =>
  `cloudstay_notifications_${userId ?? "guest"}`;

export const readNotifications = (userId) => {
  try {
    const raw = localStorage.getItem(getNotificationsKey(userId));
    const notifications = raw ? JSON.parse(raw) : [];
    return Array.isArray(notifications)
      ? notifications.sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime(),
        )
      : [];
  } catch {
    return [];
  }
};

export const writeNotifications = (userId, notifications) => {
  const newestFirst = [...notifications].sort(
    (a, b) =>
      new Date(b.createdAt || 0).getTime() -
      new Date(a.createdAt || 0).getTime(),
  );
  localStorage.setItem(getNotificationsKey(userId), JSON.stringify(newestFirst));
};

export const markNotificationsRead = (userId, notificationIds) => {
  const existing = readNotifications(userId);
  const ids = new Set(notificationIds);
  const next = existing.map((notification) =>
    ids.has(notification.id) ? { ...notification, read: true } : notification,
  );
  writeNotifications(userId, next);
  return next;
};

export const addNotification = (userId, notification) => {
  const existing = readNotifications(userId);
  const sourceEventId =
    notification.eventId ||
    (notification.messageId ? `message:${notification.messageId}` : null);
  const duplicate = sourceEventId
    ? existing.find((item) => item.eventId === sourceEventId)
    : null;

  if (duplicate) {
    return duplicate;
  }

  const created = {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    read: false,
    ...notification,
    ...(sourceEventId ? { eventId: sourceEventId } : {}),
  };

  writeNotifications(userId, [
    created,
    ...existing,
  ]);
  window.dispatchEvent(new CustomEvent("cloudstay:notifications-changed"));
  return created;
};
