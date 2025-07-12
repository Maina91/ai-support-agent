import React from "react";
import { Switch } from "../../components/ui/switch";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import { Circle } from "lucide-react";

interface AvailabilityToggleProps {
  isAvailable: boolean;
  onChange: (available: boolean) => void;
}

export const AvailabilityToggle: React.FC<AvailabilityToggleProps> = ({
  isAvailable,
  onChange,
}) => {
  return (
    <div className="flex items-center justify-between gap-4 p-4 border rounded-xl shadow-sm bg-background">
      <div className="flex items-center gap-3">
        <Circle
          className={`w-3 h-3 ${
            isAvailable ? "text-green-500" : "text-gray-400"
          }`}
          fill={isAvailable ? "currentColor" : "transparent"}
        />
        <div>
          <Label className="text-sm font-medium">Availability</Label>
          <p className="text-xs text-muted-foreground">
            {isAvailable
              ? "You’re online and available for chats"
              : "You’re currently offline"}
          </p>
        </div>
      </div>

      <Switch checked={isAvailable} onCheckedChange={onChange} />
    </div>
  );
};
