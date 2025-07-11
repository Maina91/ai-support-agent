import { SupportAgentImpl } from './supportAgent.js';

// Create and export the support agent instance
export const supportAgent = new SupportAgentImpl();

// Re-export types
export * from './types.js';