import { v4 as uuidv4 } from 'uuid';
import { createAgentWorkflow } from './workflow.js';
import { 
  SupportAgent, 
  ProcessMessageOptions, 
  ProcessMessageStreamOptions, 
  AgentResponse,
  FeedbackOptions,
  ToolCallEvent,
  HumanHandoffOptions,
  SentimentAnalysis
} from './types.js';
import { memoryManager } from '../memory/index.js';
import { ChatHistoryItem } from '../memory/types.js';
import { toolFactory } from '../tools/index.js';
import config from '../config/index.js';
import { sentimentAnalyzer } from '../utils/sentiment.js';
import { humanHandoffService } from '../services/humanHandoffService.js';

/**
 * Implementation of the support agent
 */
export class SupportAgentImpl implements SupportAgent {
  private workflow;
  
  constructor() {
    this.workflow = createAgentWorkflow();
  }
  
  /**
   * Process a message from a user
   */
  async processMessage(options: ProcessMessageOptions): Promise<AgentResponse> {
    try {
      const { message, sessionId, userId, metadata } = options;
      
      // Check if there's already a handoff for this session
      const existingHandoff = humanHandoffService.getHandoffRequestBySessionId(sessionId);
      if (existingHandoff && (existingHandoff.status === 'pending' || existingHandoff.status === 'assigned')) {
        // If there's an active handoff, return a waiting message
        const waitMessage = existingHandoff.status === 'pending' 
          ? `Your request has been queued. ${config.agent.humanHandoff.waitTimeMessage.replace('{wait_time}', existingHandoff.estimatedWaitTime.toString())}`
          : "A support agent has been assigned to your case and will respond shortly.";
        
        // Store the user message
        const messageId = await memoryManager.addMessage({
          sessionId,
          userId,
          content: message,
          role: 'user',
          metadata,
        });
        
        // Store the waiting response
        const assistantMessageId = await memoryManager.addMessage({
          sessionId,
          userId,
          content: waitMessage,
          role: 'assistant',
          metadata: {
            needsHumanIntervention: true,
            handoffActive: true,
            handoffId: existingHandoff.id,
            handoffStatus: existingHandoff.status,
          },
        });
        
        return {
          id: assistantMessageId,
          message: waitMessage,
          needsHumanIntervention: true,
          handoffReason: existingHandoff.reason,
          estimatedWaitTime: existingHandoff.estimatedWaitTime,
          history: await this.getConversationHistory(sessionId),
        };
      }
      
      // If human handoff is enabled, check sentiment and sensitive topics
      if (config.agent.humanHandoff.enabled) {
        // Check if the message contains sensitive topics
        const topicsCheck = await this.checkSensitiveTopics(message);
        if (topicsCheck.containsSensitiveTopics) {
          return await this.handleSensitiveTopicDetection(message, sessionId, userId, metadata, topicsCheck.detectedTopics);
        }
        
        // Check sentiment if no sensitive topics were detected
        const sentiment = await this.analyzeSentiment(message);
        if (sentiment.category === 'negative' && sentiment.score <= config.agent.humanHandoff.sentimentThreshold) {
          return await this.handleNegativeSentiment(message, sessionId, userId, metadata, sentiment);
        }
      }
      
      // Store the user message
      const messageId = await memoryManager.addMessage({
        sessionId,
        userId,
        content: message,
        role: 'user',
        metadata,
      });
      
      // Get the conversation context
      const context = await memoryManager.getConversationContext(sessionId, userId);
      
      // Initialize workflow input
      const initialState = {
        context,
        messages: [],
        toolCalls: [],
      };
      
      // Execute the workflow
      const result = await this.workflow.invoke(initialState);
      
      // Store the assistant's response
      const assistantMessageId = await memoryManager.addMessage({
        sessionId,
        userId,
        content: result.response || 'No response generated',
        role: 'assistant',
        metadata: {
          confidenceScore: result.confidenceScore,
          needsHumanIntervention: result.needsHumanIntervention,
          toolCalls: result.toolCalls?.map(tc => ({ 
            tool: tc.tool, 
            input: tc.input 
          })),
        },
      });
      
      // If the workflow indicates human intervention is needed
      if (result.needsHumanIntervention) {
        const handoffReason = result.confidenceScore !== undefined 
          ? `Low confidence score (${result.confidenceScore})` 
          : 'AI unable to provide a satisfactory response';
        
        return await this.initiateHumanHandoff({
          sessionId,
          userId,
          reason: handoffReason,
          conversationHistory: await this.getConversationHistory(sessionId),
          priority: 3,
        });
      }
      
      // Return the agent's response
      return {
        id: assistantMessageId,
        message: result.response || 'No response generated',
        needsHumanIntervention: !!result.needsHumanIntervention,
        confidenceScore: result.confidenceScore,
        toolCalls: result.toolCalls?.map(tc => ({ 
          tool: tc.tool, 
          input: tc.input 
        })),
        history: await this.getConversationHistory(sessionId),
      };
    } catch (error) {
      console.error('Error processing message:', error);
      
      throw new Error(`Failed to process message: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Process a message with streaming response
   */
  async processMessageStream(options: ProcessMessageStreamOptions): Promise<void> {
    const { message, sessionId, userId, metadata, onTokenStream, onToolCall, onCompletion } = options;
    
    try {
      // Check if there's already a handoff for this session
      const existingHandoff = humanHandoffService.getHandoffRequestBySessionId(sessionId);
      if (existingHandoff && (existingHandoff.status === 'pending' || existingHandoff.status === 'assigned')) {
        // If there's an active handoff, return a waiting message
        const waitMessage = existingHandoff.status === 'pending' 
          ? `Your request has been queued. ${config.agent.humanHandoff.waitTimeMessage.replace('{wait_time}', existingHandoff.estimatedWaitTime.toString())}`
          : "A support agent has been assigned to your case and will respond shortly.";
        
        // Store the user message
        const messageId = await memoryManager.addMessage({
          sessionId,
          userId,
          content: message,
          role: 'user',
          metadata,
        });
        
        // Store the waiting response
        const assistantMessageId = await memoryManager.addMessage({
          sessionId,
          userId,
          content: waitMessage,
          role: 'assistant',
          metadata: {
            needsHumanIntervention: true,
            handoffActive: true,
            handoffId: existingHandoff.id,
            handoffStatus: existingHandoff.status,
          },
        });
        
        // Stream response one word at a time
        const words = waitMessage.split(' ');
        for (const word of words) {
          onTokenStream(word + ' ');
          await new Promise(resolve => setTimeout(resolve, 50)); // Simulate streaming delay
        }
        
        // Complete with response
        onCompletion({
          id: assistantMessageId,
          message: waitMessage,
          needsHumanIntervention: true,
          handoffReason: existingHandoff.reason,
          estimatedWaitTime: existingHandoff.estimatedWaitTime,
          history: await this.getConversationHistory(sessionId),
        });
        
        return;
      }
      
      // If human handoff is enabled, check sentiment and sensitive topics
      if (config.agent.humanHandoff.enabled) {
        // Check if the message contains sensitive topics
        const topicsCheck = await this.checkSensitiveTopics(message);
        if (topicsCheck.containsSensitiveTopics) {
          // Store the user message
          await memoryManager.addMessage({
            sessionId,
            userId,
            content: message,
            role: 'user',
            metadata,
          });
          
          const handoffResponse = await this.handleSensitiveTopicDetection(
            message, sessionId, userId, metadata, topicsCheck.detectedTopics
          );
          
          // Stream response one word at a time
          const words = handoffResponse.message.split(' ');
          for (const word of words) {
            onTokenStream(word + ' ');
            await new Promise(resolve => setTimeout(resolve, 50)); // Simulate streaming delay
          }
          
          // Complete with handoff response
          onCompletion(handoffResponse);
          return;
        }
        
        // Check sentiment if no sensitive topics were detected
        const sentiment = await this.analyzeSentiment(message);
        if (sentiment.category === 'negative' && sentiment.score <= config.agent.humanHandoff.sentimentThreshold) {
          // Store the user message
          await memoryManager.addMessage({
            sessionId,
            userId,
            content: message,
            role: 'user',
            metadata,
          });
          
          const handoffResponse = await this.handleNegativeSentiment(
            message, sessionId, userId, metadata, sentiment
          );
          
          // Stream response one word at a time
          const words = handoffResponse.message.split(' ');
          for (const word of words) {
            onTokenStream(word + ' ');
            await new Promise(resolve => setTimeout(resolve, 50)); // Simulate streaming delay
          }
          
          // Complete with handoff response
          onCompletion(handoffResponse);
          return;
        }
      }
      
      // Store the user message
      const messageId = await memoryManager.addMessage({
        sessionId,
        userId,
        content: message,
        role: 'user',
        metadata,
      });
      
      // Get the conversation context
      const context = await memoryManager.getConversationContext(sessionId, userId);
      
      // Initialize workflow input
      const initialState = {
        context,
        messages: [],
        toolCalls: [],
      };
      
      // Execute the workflow with callbacks
      // Note: This is a simplified version - in a real implementation,
      // you'd need to integrate with the streaming capabilities of the LLM
      const result = await this.workflow.invoke(initialState);
      
      // If the workflow indicates human intervention is needed
      if (result.needsHumanIntervention) {
        const handoffReason = result.confidenceScore !== undefined 
          ? `Low confidence score (${result.confidenceScore})` 
          : 'AI unable to provide a satisfactory response';
          
        const handoffResponse = await this.initiateHumanHandoff({
          sessionId,
          userId,
          reason: handoffReason,
          conversationHistory: await this.getConversationHistory(sessionId),
          priority: 3,
        });
        
        // Stream handoff message
        const words = handoffResponse.message.split(' ');
        for (const word of words) {
          onTokenStream(word + ' ');
          await new Promise(resolve => setTimeout(resolve, 50)); // Simulate streaming delay
        }
        
        // Store the assistant's response
        const assistantMessageId = await memoryManager.addMessage({
          sessionId,
          userId,
          content: handoffResponse.message,
          role: 'assistant',
          metadata: {
            needsHumanIntervention: true,
            handoffReason,
          },
        });
        
        // Complete with handoff response
        handoffResponse.id = assistantMessageId;
        onCompletion(handoffResponse);
        return;
      }
      
      // Simulate streaming the response
      if (result.response) {
        const tokens = result.response.split(' ');
        for (const token of tokens) {
          onTokenStream(token + ' ');
          await new Promise(resolve => setTimeout(resolve, 50)); // Simulate delay
        }
      }
      
      // Stream tool calls if any
      if (result.toolCalls && result.toolCalls.length > 0) {
        for (const tc of result.toolCalls) {
          const toolCall: ToolCallEvent = {
            tool: tc.tool,
            input: tc.input,
          };
          onToolCall(toolCall);
          await new Promise(resolve => setTimeout(resolve, 200)); // Simulate delay
        }
      }
      
      // Store the assistant's response
      const assistantMessageId = await memoryManager.addMessage({
        sessionId,
        userId,
        content: result.response || 'No response generated',
        role: 'assistant',
        metadata: {
          confidenceScore: result.confidenceScore,
          needsHumanIntervention: result.needsHumanIntervention,
          toolCalls: result.toolCalls?.map(tc => ({ 
            tool: tc.tool, 
            input: tc.input 
          })),
        },
      });
      
      // Return the complete response
      const response: AgentResponse = {
        id: assistantMessageId,
        message: result.response || 'No response generated',
        needsHumanIntervention: !!result.needsHumanIntervention,
        confidenceScore: result.confidenceScore,
        toolCalls: result.toolCalls?.map(tc => ({ 
          tool: tc.tool, 
          input: tc.input 
        })),
        history: await this.getConversationHistory(sessionId),
      };
      
      // Call completion callback
      onCompletion(response);
    } catch (error) {
      console.error('Error processing message stream:', error);
      
      // Store error message
      await memoryManager.addMessage({
        sessionId,
        userId,
        content: 'An error occurred while processing your message',
        role: 'assistant',
        metadata: {
          error: error instanceof Error ? error.message : String(error),
        },
      });
      
      // Stream error message
      onTokenStream('An error occurred while processing your message. ');
      onTokenStream('Please try again or contact support if the issue persists.');
      
      // Call completion with error response
      onCompletion({
        id: uuidv4(),
        message: 'An error occurred while processing your message. Please try again or contact support if the issue persists.',
        needsHumanIntervention: true,
        history: await this.getConversationHistory(sessionId),
      });
    }
  }
  
  /**
   * Get the conversation history for a session
   */
  async getConversationHistory(sessionId: string): Promise<ChatHistoryItem[]> {
    return memoryManager.getConversationHistory(sessionId);
  }
  
  /**
   * Record feedback for a message
   */
  async recordFeedback(options: FeedbackOptions): Promise<void> {
    const { sessionId, messageId, rating, feedback } = options;
    
    await memoryManager.recordFeedback({
      sessionId,
      messageId,
      rating,
      feedback,
    });
  }
  
  /**
   * Analyze message sentiment
   */
  async analyzeSentiment(message: string): Promise<SentimentAnalysis> {
    return sentimentAnalyzer.analyzeSentiment(message);
  }
  
  /**
   * Check if a message contains sensitive topics requiring human intervention
   */
  async checkSensitiveTopics(message: string): Promise<{
    containsSensitiveTopics: boolean;
    detectedTopics: string[];
  }> {
    return sentimentAnalyzer.checkSensitiveTopics(message);
  }
  
  /**
   * Initiate a handoff to a human agent
   */
  async initiateHumanHandoff(options: HumanHandoffOptions): Promise<AgentResponse> {
    const { sessionId, userId, reason, priority, conversationHistory } = options;
    
    // Request handoff
    const handoffResult = await humanHandoffService.requestHandoff({
      sessionId,
      userId,
      reason,
      conversationHistory: conversationHistory || await this.getConversationHistory(sessionId),
      priority,
    });
    
    // Generate a handoff message
    const handoffMessage = `I've noticed that this query would be better handled by a human support agent. ${handoffResult.message}`;
    
    // Store the message
    const assistantMessageId = await memoryManager.addMessage({
      sessionId,
      userId,
      content: handoffMessage,
      role: 'assistant',
      metadata: {
        needsHumanIntervention: true,
        handoffId: handoffResult.handoffId,
        handoffReason: reason,
      },
    });
    
    // Return the response
    return {
      id: assistantMessageId,
      message: handoffMessage,
      needsHumanIntervention: true,
      handoffReason: reason,
      estimatedWaitTime: handoffResult.estimatedWaitTime,
      history: await this.getConversationHistory(sessionId),
    };
  }
  
  /**
   * Handle detection of sensitive topics
   */
  private async handleSensitiveTopicDetection(
    message: string,
    sessionId: string,
    userId: string,
    metadata?: Record<string, any>,
    detectedTopics: string[] = []
  ): Promise<AgentResponse> {
    // Form reason from detected topics
    const reason = `Detected sensitive topics: ${detectedTopics.join(', ')}`;
    
    // Higher priority for sensitive topics
    const priority = 4;
    
    return this.initiateHumanHandoff({
      sessionId,
      userId,
      reason,
      conversationHistory: await this.getConversationHistory(sessionId),
      priority,
    });
  }
  
  /**
   * Handle negative sentiment detection
   */
  private async handleNegativeSentiment(
    message: string,
    sessionId: string,
    userId: string,
    metadata?: Record<string, any>,
    sentiment?: SentimentAnalysis
  ): Promise<AgentResponse> {
    // Form reason from sentiment
    const emotions = sentiment?.emotions ? 
      Object.entries(sentiment.emotions)
        .filter(([_, score]) => score >= 0.5)
        .map(([emotion]) => emotion)
        .join(', ') : 
      '';
      
    const reason = emotions ? 
      `Detected negative sentiment (${sentiment?.score?.toFixed(2)}): ${emotions}` : 
      `Detected negative sentiment (${sentiment?.score?.toFixed(2)})`;
    
    // Medium priority for negative sentiment
    const priority = 3;
    
    return this.initiateHumanHandoff({
      sessionId,
      userId,
      reason,
      conversationHistory: await this.getConversationHistory(sessionId),
      priority,
    });
  }
}