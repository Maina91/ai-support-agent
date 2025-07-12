import React, { useState } from "react";
import { AgentSessionList, AgentSession } from "./sessions/AgentSessionList";
import { AgentSessionView } from "./sessions/AgentSessionView";
import { SessionDetailsPanel } from "./sessions/SessionDetailsPanel";
import { AgentMetrics } from "./analytics/AgentMetrics";
import { AvailabilityToggle } from "./profile/AvailabilityToggle";
import { ScrollArea } from "../components/ui/scroll-area";

// Mocked sessions for demo purposes
const mockSessions: AgentSession[] = [
  {
    id: "s1",
    userName: "John Doe",
    userEmail: "john@example.com",
    lastMessage: "I need help with my order",
    timestamp: new Date().toISOString(),
    unreadCount: 2,
    isActive: true,
  },
  {
    id: "s2",
    userName: "Jane Smith",
    userEmail: "jane@example.com",
    lastMessage: "Can I change my shipping address?",
    timestamp: new Date().toISOString(),
    unreadCount: 0,
    isActive: false,
  },
];

export const AgentDashboard: React.FC = () => {
  const [activeSessionId, setActiveSessionId] = useState<string | null>(
    mockSessions[0]?.id || null
  );

  const selectedSession = mockSessions.find((s) => s.id === activeSessionId);

  return (
    <div className="grid grid-cols-[300px_1fr_350px] h-screen overflow-hidden">
      {/* Session List Panel */}
      <div className="border-r">
        <div className="p-4 flex justify-between items-center border-b">
          <h1 className="text-lg font-semibold">Sessions</h1>
          <AvailabilityToggle />
        </div>
        <AgentSessionList
          sessions={mockSessions}
          selectedSessionId={activeSessionId || undefined}
          onSelect={setActiveSessionId}
        />
      </div>

      {/* Chat View Panel */}
      <div className="flex flex-col">
        <div className="border-b p-4">
          <h2 className="text-base font-medium">
            {selectedSession ? selectedSession.userName : "No session selected"}
          </h2>
        </div>
        {selectedSession ? (
          <AgentSessionView session={selectedSession} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Select a session to begin
          </div>
        )}
      </div>

      {/* Details Panel */}
      <div className="border-l bg-muted/50">
        <SessionDetailsPanel session={selectedSession} />
        <div className="border-t p-4">
          <AgentMetrics agentId="agent-1" />
        </div>
      </div>
    </div>
  );
};
