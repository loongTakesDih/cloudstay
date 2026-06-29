import axios from "axios";

const api = axios.create({

  baseURL: "http://localhost:5028/api", 
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("cloudstay_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

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

export const getMyBookings = async () => {
  const response = await api.get("/bookings/my-trips");
  return response.data;
};

export default api;