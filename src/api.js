import axios from "axios";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "./constants";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 errors (expired access token)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refresh = localStorage.getItem(REFRESH_TOKEN);
        if (!refresh) {
          throw new Error("No refresh token found");
        }

        // Request new access token
        const res = await axios.post(
          `${import.meta.env.VITE_API_URL}/rtnc/token/refresh/`,
          { refresh },
          { headers: { "Content-Type": "application/json" } }
        );

        if (res.status === 200) {
          const newAccess = res.data.access;
          localStorage.setItem(ACCESS_TOKEN, newAccess);

          // Update default headers
          api.defaults.headers.common["Authorization"] = `Bearer ${newAccess}`;
          originalRequest.headers["Authorization"] = `Bearer ${newAccess}`;

          // Retry the failed request
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed → log user out
        localStorage.clear();
        window.location.href = "/welcome";
      }
    }

    return Promise.reject(error);
  }
);

export default api;
