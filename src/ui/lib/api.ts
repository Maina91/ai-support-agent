import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  withCredentials: true, // Enable cookie-based auth if needed
});

export async function getCurrentUser() {
  const res = await api.get("/me", {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`, // or use secure cookies
    },
  });
  return res.data;
}
