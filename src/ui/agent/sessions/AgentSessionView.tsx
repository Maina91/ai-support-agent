import React, { useState, useRef, useEffect } from "react";
import { Separator } from "../../components/ui/separator";
import { ScrollArea } from "../../components/ui/scroll-area";
import { MessageBubble } from "../components/MessageBubble";
import { AgentInputBar } from "../components/AgentInputBar";
import { SessionDetailsPanel } from "./SessionDetailsPanel";
import { TransferModal } from "./TransferModal";
import { ReturnToAIModal } from "./ReturnToAIModal";
import { Button } from "../../components/ui/button";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant" | "human-agent" | "system";
  timestamp: string;
  agentName?: string;
  isLoading?: boolean;
  handoffReason?: string;
  estimatedWaitTime?: number;
}

interface AgentSessionViewProps {
  sessionId: string;
  startedAt: Date;
  user: {
    name: string;
    email: string;
    tags?: string[];
  };
  agent: {
    name: string;
    email: string;
  };
  initialMessages: Message[];
  onSend: (message: string) => void;
  onReturnToAI: () => void;
  onTransfer: (toAgentId: string) => void;
}

export const AgentSessionView: React.FC<AgentSessionViewProps> = ({
  sessionId,
  startedAt,
  user,
  agent,
  initialMessages,
  onSend,
  onReturnToAI,
  onTransfer,
}) => {
  const [messages, setMessages] = useState(initialMessages);
  const [note, setNote] = useState("");
  const [showTransfer, setShowTransfer] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (content: string) => {
    const newMsg: Message = {
      id: crypto.randomUUID(),
      content,
      role: "human-agent",
      timestamp: new Date().toISOString(),
      agentName: agent.name,
    };

    setMessages((prev) => [...prev, newMsg]);
    onSend(content);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] h-full">
      {/* Chat Column */}
      <div className="flex flex-col h-full">
        <ScrollArea className="flex-1 p-4 space-y-4">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} {...msg} />
          ))}
          <div ref={messagesEndRef} />
        </ScrollArea>

        <Separator />

        <div className="p-4 border-t bg-background">
          <AgentInputBar onSend={handleSend} />
          <div className="mt-2 flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTransfer(true)}
            >
              Transfer Session
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowReturnModal(true)}
            >
              Return to AI
            </Button>
          </div>
        </div>
      </div>

      {/* Side Panel */}
      <SessionDetailsPanel
        sessionId={sessionId}
        startedAt={startedAt}
        user={user}
        assignedAgent={agent}
        defaultNotes={note}
        onSaveNote={setNote}
      />

      {/* Modals */}
      <TransferModal
        open={showTransfer}
        onClose={() => setShowTransfer(false)}
        onTransfer={onTransfer}
      />
      <ReturnToAIModal
        open={showReturnModal}
        onClose={() => setShowReturnModal(false)}
        onConfirm={onReturnToAI}
      />
    </div>
  );
};
