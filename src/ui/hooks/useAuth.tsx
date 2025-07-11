import { useEffect, useState } from "react";
import { getCurrentUser } from "../lib/api";

export function useAuth() {
  const [user, setUser] = useState<null | {
    id: string;
    email: string;
    role: string;
  }>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
      } catch (err: any) {
        setError("Unauthorized or session expired");
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, []);

  return { user, loading, error };
}
