// src/components/chat/ChatInterface.tsx
import React, { useState, useRef, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";

import { ChatMessageList } from "./ChatMessageList";
import { ChatInputBox } from "./ChatInputBox";
import { AgentStatusBanner } from "./AgentStatusBanner";
import { Message } from "./types";
import { SSE_RETRY_INTERVAL_MS, DEFAULT_AGENT_NAMES } from "./constants";
import { TypingIndicator } from "./TypingIndicator";
import api from "../api/client";

interface ChatInterfaceProps {
  userId: string;
  apiEndpoint?: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  userId,
  apiEndpoint = "http://localhost:3000/api/agent/chat",
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      content: "Hello! How can I assist you today?",
      role: "assistant",
      timestamp: new Date(),
    },
  ]);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(uuidv4());
  const [isHumanHandoffActive, setIsHumanHandoffActive] = useState(false);
  const [waitingForAgent, setWaitingForAgent] = useState(false);
  const [connectedAgentName, setConnectedAgentName] = useState<string | null>(
    null
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null;
    if (waitingForAgent && !connectedAgentName) {
      pollInterval = setInterval(() => {
        setTimeout(() => {
          if (Math.random() > 0.5) {
            const agentName =
              DEFAULT_AGENT_NAMES[
                Math.floor(Math.random() * DEFAULT_AGENT_NAMES.length)
              ];
            setConnectedAgentName(agentName);
            setMessages((prev) => [
              ...prev,
              {
                id: uuidv4(),
                content: `Human agent ${agentName} has joined the conversation.`,
                role: "system",
                timestamp: new Date(),
              },
            ]);
            setWaitingForAgent(false);
          }
        }, 10000);
      }, SSE_RETRY_INTERVAL_MS);
    }
    return () => { if (pollInterval) clearInterval(pollInterval); };
  }, [waitingForAgent, connectedAgentName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      id: uuidv4(),
      content: input,
      role: "user",
      timestamp: new Date(),
    };

    const assistantMessageId = uuidv4();
    const assistantPlaceholder: Message = {
      id: assistantMessageId,
      content: "",
      role: isHumanHandoffActive ? "human-agent" : "assistant",
      timestamp: new Date(),
      isLoading: true,
      agentName: isHumanHandoffActive
        ? (connectedAgentName ?? undefined)
        : undefined,
    };

    setMessages((prev) => [...prev, userMessage, assistantPlaceholder]);
    setInput("");
    setIsLoading(true);

    if (isHumanHandoffActive) {
      setTimeout(() => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  content: `Thank you. I'm ${connectedAgentName}, reviewing your issue now.`,
                  isLoading: false,
                }
              : msg
          )
        );
        setIsLoading(false);
      }, 2000);
      return;
    }

    try {
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          sessionId,
          userId,
          stream: true,
        }),
      });

      if (!response.ok) throw new Error(`Error: ${response.status}`);

      const reader = response.body?.getReader();
      let accumulatedContent = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split("\n\n");

          for (const line of lines) {
            if (line.startsWith("data:")) {
              try {
                const data = JSON.parse(line.slice(5));
                if (data.token) {
                  accumulatedContent += data.token;
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessageId
                        ? { ...msg, content: accumulatedContent }
                        : msg
                    )
                  );
                }
                if (data.completion) {
                  const {
                    message,
                    toolCalls,
                    needsHumanIntervention,
                    handoffReason,
                    estimatedWaitTime,
                  } = data.completion;
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessageId
                        ? {
                            ...msg,
                            content: message,
                            isLoading: false,
                            toolCalls,
                            needsHumanIntervention,
                            handoffReason,
                            estimatedWaitTime,
                          }
                        : msg
                    )
                  );
                  if (needsHumanIntervention) {
                    setIsHumanHandoffActive(true);
                    setWaitingForAgent(true);
                  }
                }
              } catch (err) {
                console.error("SSE parse error:", err);
              }
            }
          }
        }
      }
    } catch (err) {
      console.error("Chat send error:", err);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content: "Sorry, there was an error.",
                isLoading: false,
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <AgentStatusBanner
        isHumanHandoffActive={isHumanHandoffActive}
        waitingForAgent={waitingForAgent}
        connectedAgentName={connectedAgentName}
      />

      <div className="flex-1 overflow-y-auto p-4">
        <ChatMessageList messages={messages} bottomRef={messagesEndRef} />
      </div>

      <div className="border-t p-4">
        <ChatInputBox
          input={input}
          onChange={setInput}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          isHumanHandoffActive={isHumanHandoffActive}
          agentName={connectedAgentName}
          waitingForAgent={waitingForAgent}
        />
      </div>
    </div>
  );
};
