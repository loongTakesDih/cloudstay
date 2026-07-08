import axios from "axios";

//trying to switch vercel production branch to main

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5028/api";

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("cloudstay_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && localStorage.getItem("cloudstay_token")) {
      localStorage.removeItem("cloudstay_token");
      delete api.defaults.headers.common.Authorization;
      window.dispatchEvent(new Event("cloudstay:unauthorized"));
    }

    return Promise.reject(error);
  },
);

// ==========================================
// AUTHENTICATION
// ==========================================
export const login = async (credentials) => {
  const response = await api.post("/auth/login", credentials);
  return response.data;
};

export const register = async (userData) => {
  const response = await api.post("/auth/register", userData);
  return response.data;
};

export const getMe = async () => {
  const response = await api.get("/auth/me");
  return response.data;
};

export const updateMyProfile = async (payload) => {
  const response = await api.put("/auth/me/profile", payload);
  return response.data;
};

// ==========================================
// HOSTING & PROPERTIES
// ==========================================
export const completeHostOnboarding = async (payload) => {
  const response = await api.post("/host/onboarding", payload);
  return response.data;
};

export const createListing = async (payload) => {
  const response = await api.post("/properties", payload);
  return response.data;
};

export const createPropertyImageUploadUrl = async (file) => {
  const response = await api.post("/uploads/property-image-url", {
    fileName: file.name,
    contentType: file.type,
  });

  return response.data;
};

export const uploadPropertyImage = async (file) => {
  const upload = await createPropertyImageUploadUrl(file);

  await axios.put(upload.uploadUrl, file, {
    headers: {
      "Content-Type": file.type,
    },
  });

  return upload;
};

export const getMyListings = async () => {
  const response = await api.get("/properties/my");
  return response.data;
};

export const getPublicListings = async () => {
  const response = await api.get("/properties");
  return response.data;
};

export const getProperty = async (id) => {
  const response = await api.get(`/properties/${id}`);
  return response.data;
};

export const getPropertyAvailability = async (id) => {
  const response = await api.get(`/properties/${id}/availability`);
  return response.data;
};

export const updateListing = async (id, payload) => {
  const response = await api.put(`/properties/${id}`, payload);
  return response.data;
};

export const publishListing = async (id) => {
  const response = await api.patch(`/properties/${id}/publish`);
  return response.data;
};

export const unpublishListing = async (id) => {
  const response = await api.patch(`/properties/${id}/unpublish`);
  return response.data;
};

export const deleteListing = async (id) => {
  await api.delete(`/properties/${id}`);
};

export const getBookingRequests = async () => {
  const response = await api.get("/bookings/host/requests");
  return response.data;
};
// ==========================================
// BOOKINGS & TRIPS
// ==========================================
export const createBookingRequest = async (bookingData) => {
  const response = await api.post("/bookings", bookingData);
  return response.data;
};
export const getMyTrips = async () => {
  const response = await api.get("/bookings/my-trips");
  return response.data;
};

export const getBookingDetails = async (id) => {
  const response = await api.get(`/bookings/${id}`);
  return response.data;
};

export const getBookingById = async (id) => {
  const response = await api.get(`/bookings/${id}`);
  return response.data;
};

export const updateBookingStatus = async (id, status) => {
  const response = await api.put(`/bookings/${id}/status`, { status });
  return response.data;
};

export const checkoutBooking = async (id) => {
  const response = await api.post(`/bookings/${id}/checkout`);
  return response.data;
};

export const createBookingPaymentSession = async (id) => {
  const response = await api.post(`/bookings/${id}/create-payment-session`);
  return response.data;
};

export const getMyBookings = async () => {
  const response = await api.get("/bookings/my-trips");
  return response.data;
};

// ==========================================
// VERIFIED-STAY REVIEWS
// ==========================================
export const getPropertyReviews = async (propertyId) => {
  const response = await api.get(`/reviews/property/${propertyId}`);
  return response.data;
};

export const getReviewEligibility = async (bookingId) => {
  const response = await api.get(`/reviews/eligibility/${bookingId}`);
  return response.data;
};

export const createReview = async (payload) => {
  const response = await api.post("/reviews", payload);
  return response.data;
};

export const getMyReviews = async () => {
  const response = await api.get("/reviews/mine");
  return response.data;
};

// ==========================================
// GUEST & HOST CHAT
// ==========================================
export const getConversations = async () => {
  const response = await api.get("/chat/conversations");
  return response.data;
};

export const getOrCreateConversation = async (bookingId) => {
  const response = await api.post("/chat/conversations", { bookingId });
  return response.data;
};

export const getOrCreatePropertyConversation = async (propertyId) => {
  const response = await api.post("/chat/conversations", { propertyId });
  return response.data;
};

export const getConversationMessages = async (conversationId) => {
  const response = await api.get(`/chat/conversations/${conversationId}/messages`);
  return response.data;
};

export const sendConversationMessage = async (conversationId, body) => {
  const response = await api.post(`/chat/conversations/${conversationId}/messages`, {
    body,
  });
  return response.data;
};
export default api;
