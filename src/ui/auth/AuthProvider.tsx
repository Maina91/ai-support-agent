import { createContext, useContext, useEffect, useRef, useState } from "react";
import api from "@/ui/api/client";
import { useNavigate } from "react-router-dom";
import { tokenStore } from "@/ui/utils/tokenStore";

interface User {
  id: string;
  email: string;
  role: "ADMIN" | "USER" | "AGENT";
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  logout: () => void;
  setUser: (user: User | null) => void;
  accessToken: string | null;
  setAccessToken: (token: string) => void;
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
  const [accessToken, setAccessTokenState] = useState<string | null>(null);

  const navigate = useNavigate();
  const effectRan = useRef(false);

  // ✅ Set access token and sync to tokenStore
  const setAccessToken = (token: string) => {
    tokenStore.set(token);
    setAccessTokenState(token);
  };

  const tryLoadFromToken = async () => {
    const storedToken = tokenStore.get();
    if (storedToken) {
      setAccessToken(storedToken);
      try {
        const meRes = await api.get("/user/me");
        setUser(meRes.data);
        return;
      } catch {
        tokenStore.clear();
      }
    }

    // fallback to refresh
    try {
      const refreshRes = await api.post("/auth/refresh");
      const { accessToken } = refreshRes.data;
      setAccessToken(accessToken);

      const meRes = await api.get("/user/me");
      setUser(meRes.data);
    } catch {
      tokenStore.clear();
      setUser(null);
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  };

  useEffect(() => {
    if (!effectRan.current) {
      tryLoadFromToken();
      effectRan.current = true;
    }
  }, []);

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {}
    tokenStore.clear();
    setUser(null);
    setAccessTokenState(null);
    navigate("/login", { replace: true });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        logout,
        setUser,
        error,
        initialized,
        setAccessToken,
        accessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");

  return {
    ...ctx,
    isAdmin: ctx.user?.role === "ADMIN",
    isUser: ctx.user?.role === "USER",
    isAgent: ctx.user?.role === "AGENT",
    isLoggedIn: !!ctx.user,
  };
};
