import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  withCredentials: true,
});

function getAccessToken() {
  return localStorage.getItem("token");
}

function authHeader() {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getCurrentUser() {
  const res = await api.get("/user/me", {
    headers: authHeader(),
  });
  return res.data;
}

function logout() {
  localStorage.removeItem("token");
  api.post("/auth/logout").catch(() => {});
  window.location.href = "/login";
}

// 🔁 Auto-refresh access token
api.interceptors.response.use(undefined, async (error) => {
  const originalRequest = error.config;

  if (
    error?.response?.status === 401 &&
    !originalRequest._retry &&
    !originalRequest.url.includes("/auth/refresh")
  ) {
    originalRequest._retry = true;

    try {
      const res = await api.post("/auth/refresh");
      const { accessToken } = res.data;

      localStorage.setItem("token", accessToken);
      originalRequest.headers = {
        ...originalRequest.headers,
        Authorization: `Bearer ${accessToken}`,
      };

      return api(originalRequest);
    } catch (err) {
      logout();
      return Promise.reject(err);
    }
  }

  return Promise.reject(error);
});
