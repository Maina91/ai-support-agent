import React from "react";
import { ScrollArea } from "../../components/ui/scroll-area";
import { Badge } from "../../components/ui/badge";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";

export interface AgentSession {
  id: string;
  userName: string;
  userEmail: string;
  lastMessage: string;
  timestamp: string;
  unreadCount?: number;
  isActive: boolean;
}

interface AgentSessionListProps {
  sessions: AgentSession[];
  selectedSessionId?: string;
  onSelect: (sessionId: string) => void;
}

export const AgentSessionList: React.FC<AgentSessionListProps> = ({
  sessions,
  selectedSessionId,
  onSelect,
}) => {
  return (
    <ScrollArea className="h-full w-full border-r bg-background">
      <div className="p-4 space-y-2">
        <h2 className="text-lg font-semibold">Active Sessions</h2>

        {sessions.length === 0 && (
          <div className="text-sm text-muted-foreground mt-6">
            No active sessions.
          </div>
        )}

        {sessions.map((session) => (
          <button
            key={session.id}
            onClick={() => onSelect(session.id)}
            className={cn(
              "flex items-start gap-3 p-3 w-full rounded-lg text-left border transition-all",
              session.id === selectedSessionId
                ? "border-blue-500 bg-blue-50"
                : "hover:bg-muted"
            )}
          >
            <Avatar className="h-9 w-9">
              <AvatarFallback>
                {session.userName[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex justify-between items-center">
                <span className="font-medium text-sm">{session.userName}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(session.timestamp).toLocaleTimeString()}
                </span>
              </div>

              <div className="text-xs text-muted-foreground truncate">
                {session.lastMessage}
              </div>

              {session.unreadCount && session.unreadCount > 0 && (
                <Badge variant="destructive" className="text-[10px] mt-1">
                  {session.unreadCount} new
                </Badge>
              )}
            </div>
          </button>
        ))}
      </div>
    </ScrollArea>
  );
};
