// src/components/auth/PrivateRoute.tsx
import { Navigate } from "react-router-dom";

export const LoginRoute = ({ children }: { children: JSX.Element }) => {
  const token = localStorage.getItem("token"); // replace with cookie/session check later
  return token ? children : <Navigate to="/login" />;
};
