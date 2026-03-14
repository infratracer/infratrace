import axios from "axios";
import { env } from "../config/env";
import { useAuthStore } from "../store/authStore";

const client = axios.create({
  baseURL: `${env.API_URL}/api/v1`,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

client.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const res = await axios.post(
          `${env.API_URL}/api/v1/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const token = res.data.access_token;
        useAuthStore.getState().setToken(token);
        original.headers.Authorization = `Bearer ${token}`;
        return client(original);
      } catch {
        useAuthStore.getState().logout();
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default client;
