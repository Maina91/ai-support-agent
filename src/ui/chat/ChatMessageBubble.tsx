import React from "react";
import ReactMarkdown from "react-markdown";
import { Message } from "./types";
import { ToolCallViewer } from "./ToolCallViewer";

export const ChatMessageBubble: React.FC<{ message: Message }> = ({
  message,
}) => {
  const roleStyles = {
    user: "bg-blue-100 ml-auto",
    assistant: "bg-gray-100 mr-auto",
    system: "bg-yellow-100 mx-auto text-center italic",
    "human-agent": "bg-green-100 mr-auto",
  };

  const className = `p-4 rounded-lg max-w-[80%] mb-4 ${roleStyles[message.role]}`;

  return (
    <div className={className}>
      {message.agentName && (
        <div className="text-sm font-medium text-green-800 mb-1">
          {message.agentName}
        </div>
      )}

      {message.isLoading ? (
        <div className="flex items-center space-x-2 animate-pulse">
          <div className="h-2 w-2 bg-gray-500 rounded-full animate-bounce" />
          <div className="h-2 w-2 bg-gray-500 rounded-full animate-bounce delay-100" />
          <div className="h-2 w-2 bg-gray-500 rounded-full animate-bounce delay-200" />
        </div>
      ) : (
        <div className="prose dark:prose-invert">
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>
      )}

      {message.toolCalls?.length > 0 && (
        <ToolCallViewer toolCalls={message.toolCalls} />
      )}

      {message.needsHumanIntervention && (
        <div className="mt-2 text-xs text-orange-700 bg-orange-50 p-2 rounded">
          <div>
            <strong>Handoff reason:</strong> {message.handoffReason}
          </div>
          {message.estimatedWaitTime && (
            <div>
              <strong>Estimated wait time:</strong> {message.estimatedWaitTime}{" "}
              min
            </div>
          )}
        </div>
      )}

      <div className="text-xs text-gray-500 mt-2">
        {new Date(message.timestamp).toLocaleTimeString()}
      </div>
    </div>
  );
};
