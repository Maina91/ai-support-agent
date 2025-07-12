import React from "react";

interface TypingIndicatorProps {
  role?: "assistant" | "human-agent";
  agentName?: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  role = "assistant",
  agentName,
}) => {
  const label =
    role === "human-agent"
      ? `${agentName || "Support Agent"} is typing`
      : "AI is thinking...";

  return (
    <div className="flex items-center space-x-3 text-sm text-muted-foreground">
      <div className="flex items-center space-x-1">
        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-150" />
        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-300" />
      </div>
      <span className="sr-only">{label}</span>
    </div>
  );
};
