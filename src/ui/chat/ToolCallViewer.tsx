import React from "react";
import { ToolCall } from "./types";

export const ToolCallViewer: React.FC<{ toolCalls: ToolCall[] }> = ({
  toolCalls,
}) => (
  <div className="mt-2 text-xs text-gray-500">
    <strong>Tools used:</strong>
    {toolCalls.map((call, i) => (
      <div key={i} className="mt-1">
        <span className="font-medium">{call.tool}</span>
        <pre className="bg-gray-100 p-2 rounded mt-1 overflow-x-auto text-xs">
          {JSON.stringify(call.input, null, 2)}
        </pre>
      </div>
    ))}
  </div>
);
