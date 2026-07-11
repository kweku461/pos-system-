import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
});

// Automatically attach token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global session-expiry handling: if the API rejects our token,
// clear the stale session and send the user back to the login screen.
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || "";
    const isLoginRequest = error.config?.url?.includes("/auth/login");

    const isAuthFailure =
      !isLoginRequest &&
      (status === 401 ||
        // older deployed backends return 403 for expired tokens
        (status === 403 && message.toLowerCase().includes("token")));

    if (isAuthFailure && localStorage.getItem("token")) {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("name");
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

export default API;
