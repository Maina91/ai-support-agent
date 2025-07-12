import React from "react";
import { Message } from "./types";
import { ChatMessageBubble } from "./ChatMessageBubble";

interface Props {
  messages: Message[];
  bottomRef: React.RefObject<HTMLDivElement>;
}

export const ChatMessageList: React.FC<Props> = ({ messages, bottomRef }) => {
  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="max-w-3xl mx-auto">
        {messages.map((m) => (
          <ChatMessageBubble key={m.id} message={m} />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};
