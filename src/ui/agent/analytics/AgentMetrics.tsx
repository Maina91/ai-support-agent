import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Headset, Clock, Smile, Activity } from "lucide-react";

interface AgentMetricsProps {
  chatsHandled: number;
  avgResponseTime: string;
  satisfactionScore: number; // Out of 100
  isAvailable: boolean;
}

export const AgentMetrics: React.FC<AgentMetricsProps> = ({
  chatsHandled,
  avgResponseTime,
  satisfactionScore,
  isAvailable,
}) => {
  return (
    <Card className="w-full shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold">Agent Metrics</CardTitle>
        <Badge variant={isAvailable ? "default" : "outline"}>
          {isAvailable ? "Online" : "Offline"}
        </Badge>
      </CardHeader>

      <CardContent className="grid grid-cols-2 gap-4 text-sm">
        <div className="flex items-center gap-2">
          <Headset className="w-4 h-4 text-muted-foreground" />
          <span>Chats handled:</span>
          <strong className="ml-auto">{chatsHandled}</strong>
        </div>

        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span>Avg response:</span>
          <strong className="ml-auto">{avgResponseTime}</strong>
        </div>

        <div className="flex items-center gap-2">
          <Smile className="w-4 h-4 text-muted-foreground" />
          <span>Satisfaction:</span>
          <strong className="ml-auto">{satisfactionScore}%</strong>
        </div>

        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-muted-foreground" />
          <span>Status:</span>
          <strong className="ml-auto">
            {isAvailable ? "Available" : "Unavailable"}
          </strong>
        </div>
      </CardContent>
    </Card>
  );
};
