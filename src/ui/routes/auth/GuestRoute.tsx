// src/auth/GuestRoute.tsx
import { Navigate } from "react-router-dom";

export const GuestRoute = ({ children }: { children: JSX.Element }) => {
  const token = localStorage.getItem("token");
  return token ? <Navigate to="/" /> : children;
};
