import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const Loader = ({ className }: { className?: string }) => (
  <div
    className={cn("flex justify-center items-center min-h-screen", className)}
  >
    <Loader2 className="animate-spin h-6 w-6 text-primary" />
  </div>
);
