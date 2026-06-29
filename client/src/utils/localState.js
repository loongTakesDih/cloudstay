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
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const writeNotifications = (userId, notifications) => {
  localStorage.setItem(getNotificationsKey(userId), JSON.stringify(notifications));
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
  const duplicateIndex = existing.findIndex(
    (item) =>
      item.type === notification.type &&
      item.bookingId === notification.bookingId &&
      item.status === notification.status,
  );

  if (duplicateIndex >= 0) {
    const duplicate = existing[duplicateIndex];
    const remaining = existing.filter((_, index) => index !== duplicateIndex);
    const updated = {
      ...duplicate,
      ...notification,
      createdAt: new Date().toISOString(),
      read: false,
    };

    writeNotifications(userId, [updated, ...remaining]);
    return updated;
  }

  writeNotifications(userId, [
    {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
      read: false,
      ...notification,
    },
    ...existing,
  ]);
};
