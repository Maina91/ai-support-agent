import React from "react";

interface AgentStatusBannerProps {
  isHumanHandoffActive: boolean;
  waitingForAgent: boolean;
  connectedAgentName?: string | null;
}

export const AgentStatusBanner: React.FC<AgentStatusBannerProps> = ({
  isHumanHandoffActive,
  waitingForAgent,
  connectedAgentName,
}) => {
  if (!isHumanHandoffActive) return null;

  return (
    <div className="bg-green-50 border-t border-b border-green-200 text-green-800 px-4 py-2 text-sm flex items-center justify-between">
      {waitingForAgent ? (
        <span className="flex items-center space-x-2">
          <svg
            className="animate-spin h-4 w-4 text-green-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
          <span>Waiting for a human agent to join the conversation...</span>
        </span>
      ) : (
        <span>
          You're now chatting with{" "}
          <strong>{connectedAgentName || "a human support agent"}</strong>.
        </span>
      )}
    </div>
  );
};
