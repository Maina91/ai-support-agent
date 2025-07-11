import { BaseMessage } from '@langchain/core/messages';

/**
 * Interface for memory entries stored in the system
 */
export interface MemoryEntry {
  id: string;
  sessionId: string;
  userId: string;
  timestamp: Date;
  content: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  metadata?: Record<string, any>;
  embedding?: number[];
}

/**
 * Interface for chat history items
 */
export interface ChatHistoryItem {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

/**
 * Interface for conversation context
 */
export interface ConversationContext {
  sessionId: string;
  userId: string;
  metadata?: Record<string, any>;
  history: ChatHistoryItem[];
  relevantMemories?: MemoryEntry[];
}

/**
 * Interface for the memory manager
 */
export interface MemoryManager {
  /**
   * Adds a new message to memory
   */
  addMessage(params: {
    sessionId: string;
    userId: string;
    content: string;
    role: 'user' | 'assistant' | 'system' | 'tool';
    metadata?: Record<string, any>;
  }): Promise<string>;

  /**
   * Retrieves conversation history for a session
   */
  getConversationHistory(sessionId: string, limit?: number): Promise<ChatHistoryItem[]>;

  /**
   * Retrieves the most recent messages for a session
   */
  getRecentMessages(sessionId: string, count?: number): Promise<ChatHistoryItem[]>;

  /**
   * Searches for relevant memories based on a query
   */
  searchMemories(query: string, sessionId?: string, limit?: number): Promise<MemoryEntry[]>;

  /**
   * Clears conversation history for a session
   */
  clearSessionMemory(sessionId: string): Promise<void>;

  /**
   * Gets the full conversation context
   */
  getConversationContext(sessionId: string, userId: string): Promise<ConversationContext>;
}

/**
 * Interface for storing user feedback on responses
 */
export interface FeedbackEntry {
  id: string;
  sessionId: string;
  messageId: string;
  rating: number;  // 1-5 scale
  feedback?: string;
  timestamp: Date;
}

/**
 * Interface for the feedback manager
 */
export interface FeedbackManager {
  /**
   * Records user feedback for a message
   */
  recordFeedback(params: {
    sessionId: string;
    messageId: string;
    rating: number;
    feedback?: string;
  }): Promise<void>;

  /**
   * Gets feedback for a specific message
   */
  getMessageFeedback(messageId: string): Promise<FeedbackEntry | null>;

  /**
   * Gets all feedback for a session
   */
  getSessionFeedback(sessionId: string): Promise<FeedbackEntry[]>;
}