import React, { useState } from "react";
import { Button } from "../../components/ui/button";
import { Textarea } from "../../components/ui/textarea";
import { cn } from "@/lib/utils";

interface AgentInputBarProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export const AgentInputBar: React.FC<AgentInputBarProps> = ({
  onSend,
  disabled = false,
  placeholder = "Type your response...",
  className,
}) => {
  const [value, setValue] = useState("");

  const handleSend = () => {
    if (!value.trim()) return;
    onSend(value.trim());
    setValue("");
  };

  return (
    <div
      className={cn(
        "flex items-end gap-2 border-t p-4 bg-background shadow-inner",
        className
      )}
    >
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1 resize-none min-h-[48px]"
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
        }}
      />

      <Button
        onClick={handleSend}
        disabled={disabled || !value.trim()}
        className="shrink-0"
      >
        Send
      </Button>
    </div>
  );
};
