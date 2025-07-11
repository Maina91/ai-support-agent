import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { 
  MemoryManager, 
  MemoryEntry, 
  ChatHistoryItem, 
  ConversationContext,
  FeedbackManager,
  FeedbackEntry
} from './types.js';
import config from '../config/index.js';
import { EmbeddingsManager } from './embeddings.js';

/**
 * Memory manager implementation using Supabase
 */
export class SupabaseMemoryManager implements MemoryManager, FeedbackManager {
  private supabase;
  private embeddingsManager: EmbeddingsManager;
  private messagesTable = 'messages';
  private feedbackTable = 'feedback';
  
  constructor() {
    this.supabase = createClient(
      config.supabase.url,
      config.supabase.apiKey
    );
    
    this.embeddingsManager = new EmbeddingsManager();
  }

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
    
    // Generate embedding for the message content
    const embedding = await this.embeddingsManager.generateEmbedding(content);
    
    // Store message with embedding
    const { error } = await this.supabase
      .from(this.messagesTable)
      .insert({
        id,
        session_id: sessionId,
        user_id: userId,
        content,
        role,
        metadata,
        embedding,
        created_at: timestamp.toISOString()
      });
      
    if (error) {
      console.error('Error adding message to Supabase:', error);
      throw new Error(`Failed to add message: ${error.message}`);
    }
    
    return id;
  }

  /**
   * Retrieves conversation history for a session
   */
  async getConversationHistory(sessionId: string, limit = 100): Promise<ChatHistoryItem[]> {
    const { data, error } = await this.supabase
      .from(this.messagesTable)
      .select('id, role, content, created_at, metadata')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(limit);
      
    if (error) {
      console.error('Error fetching conversation history from Supabase:', error);
      throw new Error(`Failed to fetch conversation history: ${error.message}`);
    }
    
    return data.map((item) => ({
      id: item.id,
      role: item.role,
      content: item.content,
      timestamp: new Date(item.created_at),
      metadata: item.metadata,
    }));
  }

  /**
   * Retrieves the most recent messages for a session
   */
  async getRecentMessages(sessionId: string, count = 10): Promise<ChatHistoryItem[]> {
    const { data, error } = await this.supabase
      .from(this.messagesTable)
      .select('id, role, content, created_at, metadata')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(count);
      
    if (error) {
      console.error('Error fetching recent messages from Supabase:', error);
      throw new Error(`Failed to fetch recent messages: ${error.message}`);
    }
    
    // Return in chronological order (oldest first)
    return data
      .map((item) => ({
        id: item.id,
        role: item.role,
        content: item.content,
        timestamp: new Date(item.created_at),
        metadata: item.metadata,
      }))
      .reverse();
  }

  /**
   * Searches for relevant memories based on a query
   */
  async searchMemories(query: string, sessionId?: string, limit = 5): Promise<MemoryEntry[]> {
    // Generate embedding for the query
    const queryEmbedding = await this.embeddingsManager.generateEmbedding(query);
    
    // Build the similarity search query
    let similarityQuery = this.supabase
      .from(this.messagesTable)
      .select('id, session_id, user_id, content, role, created_at, metadata')
      .order('created_at', { ascending: false })
      .limit(limit);
      
    // If sessionId is provided, filter by it
    if (sessionId) {
      similarityQuery = similarityQuery.eq('session_id', sessionId);
    }
    
    const { data, error } = await similarityQuery;
      
    if (error) {
      console.error('Error searching memories from Supabase:', error);
      throw new Error(`Failed to search memories: ${error.message}`);
    }
    
    // Convert to MemoryEntry and sort by cosine similarity
    const results = data.map((item) => ({
      id: item.id,
      sessionId: item.session_id,
      userId: item.user_id,
      content: item.content,
      role: item.role,
      timestamp: new Date(item.created_at),
      metadata: item.metadata,
    }));
    
    return results;
  }

  /**
   * Clears conversation history for a session
   */
  async clearSessionMemory(sessionId: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.messagesTable)
      .delete()
      .eq('session_id', sessionId);
      
    if (error) {
      console.error('Error clearing session memory from Supabase:', error);
      throw new Error(`Failed to clear session memory: ${error.message}`);
    }
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
    
    const { error } = await this.supabase
      .from(this.feedbackTable)
      .insert({
        id,
        session_id: sessionId,
        message_id: messageId,
        rating,
        feedback,
        created_at: timestamp.toISOString()
      });
      
    if (error) {
      console.error('Error recording feedback to Supabase:', error);
      throw new Error(`Failed to record feedback: ${error.message}`);
    }
  }

  /**
   * Gets feedback for a specific message
   */
  async getMessageFeedback(messageId: string): Promise<FeedbackEntry | null> {
    const { data, error } = await this.supabase
      .from(this.feedbackTable)
      .select('id, session_id, message_id, rating, feedback, created_at')
      .eq('message_id', messageId)
      .maybeSingle();
      
    if (error) {
      console.error('Error fetching message feedback from Supabase:', error);
      throw new Error(`Failed to fetch message feedback: ${error.message}`);
    }
    
    if (!data) return null;
    
    return {
      id: data.id,
      sessionId: data.session_id,
      messageId: data.message_id,
      rating: data.rating,
      feedback: data.feedback,
      timestamp: new Date(data.created_at),
    };
  }

  /**
   * Gets all feedback for a session
   */
  async getSessionFeedback(sessionId: string): Promise<FeedbackEntry[]> {
    const { data, error } = await this.supabase
      .from(this.feedbackTable)
      .select('id, session_id, message_id, rating, feedback, created_at')
      .eq('session_id', sessionId);
      
    if (error) {
      console.error('Error fetching session feedback from Supabase:', error);
      throw new Error(`Failed to fetch session feedback: ${error.message}`);
    }
    
    return data.map((item) => ({
      id: item.id,
      sessionId: item.session_id,
      messageId: item.message_id,
      rating: item.rating,
      feedback: item.feedback,
      timestamp: new Date(item.created_at),
    }));
  }
}