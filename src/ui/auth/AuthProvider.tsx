import { createContext, useContext, useEffect, useRef, useState } from "react";
import api from "../api/client";
import { useNavigate } from "react-router-dom";

interface User {
  id: string;
  email: string;
  role: "ADMIN" | "USER";
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  initialised: boolean;
  logout: () => void;
  setUser: (user: User | null) => void;
  error: string | null;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined
);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const navigate = useNavigate();

  // Prevent useEffect double-fire in dev
  const effectRan = useRef(false);

  useEffect(() => {
    if (effectRan.current) return;
    effectRan.current = true;

    const loadUser = async () => {
      try {
        const res = await api.get("/user/me");
        setUser(res.data);
        setError(null);
      } catch (e: any) {
        setUser(null);
        setError(e?.response?.data?.message || "Not authenticated");
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };

    loadUser();
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    api.post("/auth/logout").catch(() => {});
    navigate("/login", { replace: true });
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, logout, setUser, error, initialized }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook: safe, memoized access
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");

  return {
    ...ctx,
    isAdmin: ctx.user?.role === "ADMIN",
    isUser: ctx.user?.role === "USER",
    isLoggedIn: !!ctx.user,
  };
}
