import { v4 as uuidv4 } from 'uuid';
import { 
  MemoryManager, 
  ChatHistoryItem, 
  ConversationContext,
  MemoryEntry,
  FeedbackManager,
  FeedbackEntry
} from './types.js';

/**
 * In-memory implementation of the MemoryManager
 * Used for testing or when Supabase is not configured
 */
export class InMemoryManager implements MemoryManager, FeedbackManager {
  private messages: Map<string, Map<string, ChatHistoryItem>> = new Map();
  private feedback: Map<string, FeedbackEntry> = new Map();
  
  /**
   * Adds a new message to memory
   */
  async addMessage({
    sessionId,
    userId,
    content,
    role,
    metadata
  }: {
    sessionId: string;
    userId: string;
    content: string;
    role: 'user' | 'assistant' | 'system' | 'tool';
    metadata?: Record<string, any>;
  }): Promise<string> {
    const id = uuidv4();
    const timestamp = new Date();
    
    // Create session map if it doesn't exist
    if (!this.messages.has(sessionId)) {
      this.messages.set(sessionId, new Map());
    }
    
    const sessionMessages = this.messages.get(sessionId)!;
    
    // Add message to session
    sessionMessages.set(id, {
      id,
      role,
      content,
      timestamp,
      metadata,
    });
    
    return id;
  }

  /**
   * Retrieves conversation history for a session
   */
  async getConversationHistory(sessionId: string, limit = 100): Promise<ChatHistoryItem[]> {
    if (!this.messages.has(sessionId)) {
      return [];
    }
    
    const sessionMessages = this.messages.get(sessionId)!;
    
    // Convert to array and sort by timestamp
    const history = Array.from(sessionMessages.values())
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      .slice(0, limit);
      
    return history;
  }

  /**
   * Retrieves the most recent messages for a session
   */
  async getRecentMessages(sessionId: string, count = 10): Promise<ChatHistoryItem[]> {
    if (!this.messages.has(sessionId)) {
      return [];
    }
    
    const sessionMessages = this.messages.get(sessionId)!;
    
    // Convert to array, sort by timestamp (newest first), and take the specified count
    const recentMessages = Array.from(sessionMessages.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, count)
      .reverse(); // Reverse to get chronological order
      
    return recentMessages;
  }

  /**
   * Searches for relevant memories based on a query
   * Note: This is a simple implementation that just searches for substrings
   */
  async searchMemories(query: string, sessionId?: string, limit = 5): Promise<MemoryEntry[]> {
    const results: MemoryEntry[] = [];
    const queryLower = query.toLowerCase();
    
    // Get all sessions or just the specified one
    const sessionIds = sessionId ? [sessionId] : Array.from(this.messages.keys());
    
    for (const sid of sessionIds) {
      if (!this.messages.has(sid)) continue;
      
      const sessionMessages = this.messages.get(sid)!;
      
      // Look for messages that contain the query
      for (const message of sessionMessages.values()) {
        if (message.content.toLowerCase().includes(queryLower)) {
          const entry: MemoryEntry = {
            id: message.id,
            sessionId: sid,
            userId: '', // In-memory doesn't track this well
            content: message.content,
            role: message.role,
            timestamp: message.timestamp,
            metadata: message.metadata,
          };
          
          results.push(entry);
          
          // Stop if we've reached the limit
          if (results.length >= limit) {
            break;
          }
        }
      }
    }
    
    return results;
  }

  /**
   * Clears conversation history for a session
   */
  async clearSessionMemory(sessionId: string): Promise<void> {
    this.messages.delete(sessionId);
  }

  /**
   * Gets the full conversation context
   */
  async getConversationContext(sessionId: string, userId: string): Promise<ConversationContext> {
    // Get the conversation history
    const history = await this.getConversationHistory(sessionId);
    
    // Get the most recent message from the user to search for relevant memories
    const recentMessages = await this.getRecentMessages(sessionId, 1);
    let relevantMemories: MemoryEntry[] = [];
    
    if (recentMessages.length > 0) {
      const lastMessage = recentMessages[0];
      
      // Only search for relevant memories if the last message is from the user
      if (lastMessage.role === 'user') {
        relevantMemories = await this.searchMemories(lastMessage.content, sessionId);
      }
    }
    
    return {
      sessionId,
      userId,
      history,
      relevantMemories,
    };
  }

  /**
   * Records user feedback for a message
   */
  async recordFeedback({
    sessionId,
    messageId,
    rating,
    feedback
  }: {
    sessionId: string;
    messageId: string;
    rating: number;
    feedback?: string;
  }): Promise<void> {
    const id = uuidv4();
    const timestamp = new Date();
    
    this.feedback.set(messageId, {
      id,
      sessionId,
      messageId,
      rating,
      feedback,
      timestamp,
    });
  }

  /**
   * Gets feedback for a specific message
   */
  async getMessageFeedback(messageId: string): Promise<FeedbackEntry | null> {
    if (!this.feedback.has(messageId)) {
      return null;
    }
    
    return this.feedback.get(messageId)!;
  }

  /**
   * Gets all feedback for a session
   */
  async getSessionFeedback(sessionId: string): Promise<FeedbackEntry[]> {
    return Array.from(this.feedback.values())
      .filter(feedback => feedback.sessionId === sessionId);
  }
}