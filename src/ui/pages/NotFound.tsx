import { Button } from "../components/ui/button";
import { useNavigate } from "react-router-dom";
import { Frown } from "lucide-react";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 text-center">
      <Frown className="h-12 w-12 text-muted-foreground mb-4" />
      <h1 className="text-3xl font-bold mb-2">404 – Page Not Found</h1>
      <p className="text-muted-foreground mb-6 max-w-md">
        The page you’re looking for doesn’t exist or has been moved.
      </p>
      <Button onClick={() => navigate("/")}>Go Home</Button>
    </div>
  );
};

export default NotFound;
