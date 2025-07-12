export type Role = "user" | "assistant" | "system" | "human-agent";

export interface ToolCall {
  tool: string;
  input: Record<string, any>;
}

export interface Message {
  id: string;
  content: string;
  role: Role;
  timestamp: Date;
  isLoading?: boolean;
  toolCalls?: ToolCall[];
  needsHumanIntervention?: boolean;
  handoffReason?: string;
  estimatedWaitTime?: number;
  agentName?: string;
}
