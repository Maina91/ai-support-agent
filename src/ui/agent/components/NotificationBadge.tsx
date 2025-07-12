import React from "react";
import { cn } from "@/lib/utils";
import { BellIcon } from "lucide-react";

interface NotificationBadgeProps {
  count?: number;
  pulse?: boolean;
  onClick?: () => void;
  className?: string;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count = 0,
  pulse = false,
  onClick,
  className,
}) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        "relative inline-flex items-center justify-center cursor-pointer",
        className
      )}
    >
      <BellIcon className="h-5 w-5 text-muted-foreground" />

      {count > 0 && (
        <span
          className={cn(
            "absolute -top-1 -right-1 bg-red-500 text-white text-xs font-semibold rounded-full h-5 w-5 flex items-center justify-center",
            pulse && "animate-ping-slow"
          )}
        >
          {count}
        </span>
      )}
    </div>
  );
};
