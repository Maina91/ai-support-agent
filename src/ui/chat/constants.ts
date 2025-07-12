// Chat roles
export const MESSAGE_ROLES = {
  USER: "user",
  ASSISTANT: "assistant",
  SYSTEM: "system",
  HUMAN_AGENT: "human-agent",
} as const;

export type MessageRole = (typeof MESSAGE_ROLES)[keyof typeof MESSAGE_ROLES];

// Avatars / Names for roles (future extensibility: custom per agent)
export const DEFAULT_AGENT_NAMES = [
  "Sarah",
  "Michael",
  "Jessica",
  "David",
  "Emily",
];

export const ROLE_LABELS: Record<MessageRole, string> = {
  user: "You",
  assistant: "AI Assistant",
  system: "System",
  "human-agent": "Support Agent",
};

// SSE / Connection-related constants
export const SSE_RETRY_INTERVAL_MS = 5000; // Initial retry delay
export const MAX_SSE_RETRIES = 5; // Max reconnection attempts
export const HANDOFF_POLL_INTERVAL_MS = 5000; // Polling for human agent
export const HANDOFF_SIMULATE_TIMEOUT_MS = 10000; // Mock wait for human handoff

// UI Constants
export const INPUT_PLACEHOLDER = "Type your message...";
export const DEFAULT_WAIT_TIME_MIN = 2; // default wait when no ETA given
