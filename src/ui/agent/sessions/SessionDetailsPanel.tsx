import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Separator } from "../../components/ui/separator";
import { Badge } from "../../components/ui/badge";
import { ScrollArea } from "../../components/ui/scroll-area";
import { UserContextCard } from "../components/UserContextCard";
import { InternalNotes } from "./InternalNotes";

interface SessionDetailsPanelProps {
  sessionId: string;
  startedAt: Date;
  user: {
    name: string;
    email: string;
    tags?: string[];
  };
  assignedAgent?: {
    name: string;
    email: string;
  };
  defaultNotes?: string;
  onSaveNote?: (note: string) => void;
}

export const SessionDetailsPanel: React.FC<SessionDetailsPanelProps> = ({
  sessionId,
  startedAt,
  user,
  assignedAgent,
  defaultNotes,
  onSaveNote,
}) => {
  const sessionDurationMinutes = Math.floor(
    (Date.now() - new Date(startedAt).getTime()) / 60000
  );

  return (
    <Card className="h-full w-full flex flex-col border-l">
      <CardHeader>
        <CardTitle className="text-lg">Session Details</CardTitle>
        <p className="text-sm text-muted-foreground">
          ID: <span className="font-mono text-xs">{sessionId}</span>
        </p>
      </CardHeader>

      <Separator />

      <CardContent className="flex-1 overflow-hidden p-4">
        <ScrollArea className="h-full pr-2 space-y-6">
          {/* User Info */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground">
              User
            </h4>
            <UserContextCard
              name={user.name}
              email={user.email}
              tags={user.tags}
            />
          </div>

          {/* Agent Info */}
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-muted-foreground">
              Assigned Agent
            </h4>
            {assignedAgent ? (
              <div className="text-sm text-gray-800">
                {assignedAgent.name}{" "}
                <span className="text-muted-foreground text-xs">
                  ({assignedAgent.email})
                </span>
              </div>
            ) : (
              <Badge variant="secondary" className="text-xs">
                Unassigned
              </Badge>
            )}
          </div>

          {/* Session Metadata */}
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-muted-foreground">
              Session Metadata
            </h4>
            <p className="text-xs text-muted-foreground">
              Started: {new Date(startedAt).toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">
              Active: {sessionDurationMinutes} min
            </p>
          </div>

          {/* Internal Notes */}
          <div className="pt-2">
            <InternalNotes defaultNote={defaultNotes} onSave={onSaveNote} />
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
