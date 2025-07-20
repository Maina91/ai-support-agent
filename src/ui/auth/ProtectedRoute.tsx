import { Navigate } from "react-router-dom";
import { useAuth } from "@/ui/auth/AuthProvider";
import { Loader } from "@/ui/components/ui/Loader";

type Role = "ADMIN" | "USER" | "AGENT";

interface ProtectedRouteProps {
  children: JSX.Element;
  roles?: Role[];
  redirectTo?: string;
  unauthorizedTo?: string;
}

export const ProtectedRoute = ({
  children,
  roles,
  redirectTo = "/login",
  unauthorizedTo = "/unauthorized",
}: ProtectedRouteProps) => {
  const { user, loading } = useAuth();

  if (loading) return <Loader />;

  if (!user) return <Navigate to={redirectTo} replace />;

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={unauthorizedTo} replace />;
  }

  return children;
};
