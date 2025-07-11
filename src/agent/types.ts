import { BaseMessage } from '@langchain/core/messages';
import { ChatHistoryItem } from '../memory/types.js';

/**
 * Interface for processing a message from a user
 */
export interface ProcessMessageOptions {
  /**
   * The message from the user
   */
  message: string;
  
  /**
   * The session ID for the conversation
   */
  sessionId: string;
  
  /**
   * The user ID for the conversation
   */
  userId: string;
  
  /**
   * Optional metadata to associate with the message
   */
  metadata?: Record<string, any>;
}

/**
 * Interface for processing a message with streaming
 */
export interface ProcessMessageStreamOptions extends ProcessMessageOptions {
  /**
   * Callback for streaming tokens
   */
  onTokenStream: (token: string) => void;
  
  /**
   * Callback for tool calls
   */
  onToolCall: (toolCall: ToolCallEvent) => void;
  
  /**
   * Callback for completion
   */
  onCompletion: (completion: AgentResponse) => void;
}

/**
 * Interface for a tool call event
 */
export interface ToolCallEvent {
  /**
   * The name of the tool being called
   */
  tool: string;
  
  /**
   * The input parameters for the tool call
   */
  input: Record<string, any>;
}

/**
 * Interface for an agent response
 */
export interface AgentResponse {
  /**
   * The ID of the response message
   */
  id: string;
  
  /**
   * The response message
   */
  message: string;
  
  /**
   * Whether the agent requires human intervention
   */
  needsHumanIntervention: boolean;
  
  /**
   * The confidence score of the response (0-1)
   */
  confidenceScore?: number;
  
  /**
   * The reason for human handoff, if applicable
   */
  handoffReason?: string;
  
  /**
   * Estimated wait time for human agent (in minutes), if applicable
   */
  estimatedWaitTime?: number;
  
  /**
   * The tool calls made during processing
   */
  toolCalls?: ToolCallEvent[];
  
  /**
   * The sources used to generate the response
   */
  sources?: string[];
  
  /**
   * The full conversation history
   */
  history?: ChatHistoryItem[];
}

/**
 * Interface for recording user feedback
 */
export interface FeedbackOptions {
  /**
   * The session ID for the conversation
   */
  sessionId: string;
  
  /**
   * The message ID to provide feedback for
   */
  messageId: string;
  
  /**
   * The rating (1-5)
   */
  rating: number;
  
  /**
   * Optional feedback text
   */
  feedback?: string;
}

/**
 * Interface for human handoff options
 */
export interface HumanHandoffOptions {
  /**
   * The session ID for the conversation
   */
  sessionId: string;
  
  /**
   * The user ID
   */
  userId: string;
  
  /**
   * The reason for the handoff
   */
  reason: string;
  
  /**
   * Priority of the handoff (1-5, where 5 is highest)
   */
  priority?: number;
  
  /**
   * Conversation history to provide to the human agent
   */
  conversationHistory?: ChatHistoryItem[];
  
  /**
   * Optional callback when human agent connects
   */
  onAgentConnected?: (agentId: string) => void;
}

/**
 * Sentiment analysis result
 */
export interface SentimentAnalysis {
  /**
   * Sentiment score (-1 to 1, where -1 is very negative and 1 is very positive)
   */
  score: number;
  
  /**
   * Overall sentiment category
   */
  category: 'negative' | 'neutral' | 'positive';
  
  /**
   * Detected emotions (if available)
   */
  emotions?: Record<string, number>;
}

/**
 * Interface for the support agent
 */
export interface SupportAgent {
  /**
   * Process a message from a user
   */
  processMessage(options: ProcessMessageOptions): Promise<AgentResponse>;
  
  /**
   * Process a message with streaming response
   */
  processMessageStream(options: ProcessMessageStreamOptions): Promise<void>;
  
  /**
   * Get the conversation history for a session
   */
  getConversationHistory(sessionId: string): Promise<ChatHistoryItem[]>;
  
  /**
   * Record feedback for a message
   */
  recordFeedback(options: FeedbackOptions): Promise<void>;
  
  /**
   * Initiate a handoff to a human agent
   */
  initiateHumanHandoff(options: HumanHandoffOptions): Promise<void>;
  
  /**
   * Analyze message sentiment
   */
  analyzeSentiment(message: string): Promise<SentimentAnalysis>;
  
  /**
   * Check if a message contains sensitive topics requiring human intervention
   */
  checkSensitiveTopics(message: string): Promise<{
    containsSensitiveTopics: boolean;
    detectedTopics: string[];
  }>;
}