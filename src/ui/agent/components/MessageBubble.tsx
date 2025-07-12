import React from "react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { Badge } from "../../components/ui/badge";

export interface MessageBubbleProps {
  content: string;
  role: "user" | "assistant" | "human-agent" | "system";
  timestamp: string;
  agentName?: string;
  toolCalls?: { tool: string; input: Record<string, any> }[];
  isLoading?: boolean;
  handoffReason?: string;
  estimatedWaitTime?: number;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  content,
  role,
  timestamp,
  agentName,
  toolCalls,
  isLoading,
  handoffReason,
  estimatedWaitTime,
}) => {
  const isUser = role === "user";
  const isAgent = role === "human-agent";
  const isSystem = role === "system";

  return (
    <div
      className={cn(
        "flex flex-col gap-1 p-3 rounded-xl shadow-sm max-w-xl",
        isUser && "bg-blue-100 self-end",
        isAgent && "bg-green-100 self-start",
        isSystem && "bg-muted self-center text-sm text-muted-foreground",
        !isUser && !isAgent && !isSystem && "bg-gray-100 self-start"
      )}
    >
      {isAgent && (
        <div className="text-xs text-green-800 font-semibold">
          {agentName || "Support Agent"}
        </div>
      )}

      {!isUser && !isAgent && !isSystem && (
        <div className="text-xs font-medium text-gray-600">AI Assistant</div>
      )}

      <div className="prose text-sm text-gray-900">
        {isLoading ? (
          <div className="animate-pulse flex gap-1">
            <div className="h-2 w-2 bg-gray-500 rounded-full" />
            <div className="h-2 w-2 bg-gray-500 rounded-full" />
            <div className="h-2 w-2 bg-gray-500 rounded-full" />
          </div>
        ) : (
          <ReactMarkdown>{content}</ReactMarkdown>
        )}
      </div>

      {toolCalls?.length && (
        <div className="mt-2 space-y-1 text-xs">
          <div className="font-medium">Tools used:</div>
          {toolCalls.map((tc, i) => (
            <div key={i} className="bg-muted px-2 py-1 rounded border">
              <strong>{tc.tool}</strong>
              <pre className="overflow-x-auto text-xs whitespace-pre-wrap">
                {JSON.stringify(tc.input, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      )}

      {handoffReason && (
        <div className="mt-2 text-xs bg-orange-50 border border-orange-300 p-2 rounded">
          <div className="font-medium text-orange-800">
            Handoff reason: {handoffReason}
          </div>
          {estimatedWaitTime && (
            <div className="text-orange-700">
              Estimated wait: {estimatedWaitTime} min
            </div>
          )}
        </div>
      )}

      <div className="text-[10px] text-muted-foreground mt-1 self-end">
        {new Date(timestamp).toLocaleTimeString()}
      </div>
    </div>
  );
};
