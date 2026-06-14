import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("cloudstay_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

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

export default api;
