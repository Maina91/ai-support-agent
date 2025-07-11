import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SupportAgentImpl } from '../../src/agent/supportAgent.js';
import { sentimentAnalyzer } from '../../src/utils/sentiment.js';
import { humanHandoffService } from '../../src/services/humanHandoffService.js';
import { memoryManager } from '../../src/memory/index.js';
import { v4 as uuidv4 } from 'uuid';

// Mock dependencies
vi.mock('uuid', () => ({
  v4: () => 'mocked-uuid-1234'
}));

vi.mock('../../src/utils/sentiment.js', () => ({
  sentimentAnalyzer: {
    analyzeSentiment: vi.fn(),
    checkSensitiveTopics: vi.fn()
  }
}));

vi.mock('../../src/services/humanHandoffService.js', () => ({
  humanHandoffService: {
    requestHandoff: vi.fn(),
    getHandoffRequestBySessionId: vi.fn()
  }
}));

vi.mock('../../src/memory/index.js', () => ({
  memoryManager: {
    addMessage: vi.fn().mockResolvedValue('message-id-1234'),
    getConversationContext: vi.fn().mockResolvedValue({
      recentMessages: [],
      relevantDocuments: []
    }),
    getConversationHistory: vi.fn().mockResolvedValue([]),
    recordFeedback: vi.fn()
  }
}));

vi.mock('../../src/agent/workflow.js', () => ({
  createAgentWorkflow: () => ({
    invoke: vi.fn().mockResolvedValue({
      response: 'Test response',
      confidenceScore: 0.8,
      needsHumanIntervention: false
    })
  })
}));

vi.mock('../../src/config/index.js', () => ({
  default: {
    openai: {
      model: 'gpt-4',
      apiKey: 'mock-api-key'
    },
    agent: {
      humanHandoff: {
        enabled: true,
        sentimentThreshold: -0.5,
        sensitiveTopics: ['billing', 'refund', 'complaint'],
        defaultWaitTime: 5,
        waitTimeMessage: 'Estimated wait time: {wait_time} minutes.'
      }
    },
    server: {
      env: 'test'
    }
  }
}));

describe('SupportAgent - Human Handoff Tests', () => {
  let supportAgent: SupportAgentImpl;
  const sessionId = 'test-session-123';
  const userId = 'test-user-456';
  
  beforeEach(() => {
    supportAgent = new SupportAgentImpl();
    
    // Reset mocks
    vi.resetAllMocks();
    
    // Default mock implementation for sentiment analysis
    (sentimentAnalyzer.analyzeSentiment as any).mockResolvedValue({
      score: 0.2,
      category: 'neutral',
      emotions: {}
    });
    
    // Default mock implementation for sensitive topics
    (sentimentAnalyzer.checkSensitiveTopics as any).mockResolvedValue({
      containsSensitiveTopics: false,
      detectedTopics: []
    });
    
    // Default mock implementation for handoff requests
    (humanHandoffService.requestHandoff as any).mockResolvedValue({
      handoffId: 'handoff-123',
      estimatedWaitTime: 5,
      message: 'Estimated wait time: 5 minutes.'
    });
    
    // Default mock implementation for getting handoff requests
    (humanHandoffService.getHandoffRequestBySessionId as any).mockResolvedValue(null);
  });
  
  it('should process message normally when no handoff is needed', async () => {
    const result = await supportAgent.processMessage({
      message: 'Hello, I need help with my account',
      sessionId,
      userId
    });
    
    // Should not trigger human handoff
    expect(result.needsHumanIntervention).toBe(false);
    expect(result.message).toBe('Test response');
    expect(humanHandoffService.requestHandoff).not.toHaveBeenCalled();
  });
  
  it('should trigger human handoff when sentiment is negative', async () => {
    // Mock negative sentiment
    (sentimentAnalyzer.analyzeSentiment as any).mockResolvedValue({
      score: -0.8,
      category: 'negative',
      emotions: { anger: 0.9, frustration: 0.8 }
    });
    
    const result = await supportAgent.processMessage({
      message: 'This service is terrible! I am very angry!',
      sessionId,
      userId
    });
    
    // Should trigger human handoff
    expect(result.needsHumanIntervention).toBe(true);
    expect(result.handoffReason).toBeDefined();
    expect(result.handoffReason).toContain('negative sentiment');
    expect(result.estimatedWaitTime).toBe(5);
    expect(humanHandoffService.requestHandoff).toHaveBeenCalledTimes(1);
  });
  
  it('should trigger human handoff when sensitive topic is detected', async () => {
    // Mock sensitive topic detection
    (sentimentAnalyzer.checkSensitiveTopics as any).mockResolvedValue({
      containsSensitiveTopics: true,
      detectedTopics: ['billing', 'refund']
    });
    
    const result = await supportAgent.processMessage({
      message: 'I need a refund for my billing issue',
      sessionId,
      userId
    });
    
    // Should trigger human handoff
    expect(result.needsHumanIntervention).toBe(true);
    expect(result.handoffReason).toBeDefined();
    expect(result.handoffReason).toContain('Detected sensitive topics');
    expect(result.handoffReason).toContain('billing');
    expect(result.handoffReason).toContain('refund');
    expect(humanHandoffService.requestHandoff).toHaveBeenCalledTimes(1);
  });
  
  it('should trigger human handoff when AI confidence is low', async () => {
    // Mock low confidence workflow response
    const originalInvoke = supportAgent['workflow'].invoke;
    supportAgent['workflow'].invoke = vi.fn().mockResolvedValue({
      response: 'I\'m not sure how to help with that.',
      confidenceScore: 0.3,
      needsHumanIntervention: true
    });
    
    const result = await supportAgent.processMessage({
      message: 'Can you help me with something complex?',
      sessionId,
      userId
    });
    
    // Restore original invoke
    supportAgent['workflow'].invoke = originalInvoke;
    
    // Should trigger human handoff
    expect(result.needsHumanIntervention).toBe(true);
    expect(result.handoffReason).toBeDefined();
    expect(result.handoffReason).toContain('Low confidence score');
    expect(humanHandoffService.requestHandoff).toHaveBeenCalledTimes(1);
  });
  
  it('should return waiting message when handoff is already active', async () => {
    // Mock existing handoff
    (humanHandoffService.getHandoffRequestBySessionId as any).mockResolvedValue({
      id: 'handoff-123',
      status: 'pending',
      reason: 'Existing handoff',
      estimatedWaitTime: 7
    });
    
    const result = await supportAgent.processMessage({
      message: 'Any update on my issue?',
      sessionId,
      userId
    });
    
    // Should return waiting message
    expect(result.needsHumanIntervention).toBe(true);
    expect(result.message).toContain('Your request has been queued');
    expect(result.message).toContain('7 minutes');
    
    // Should not create a new handoff
    expect(humanHandoffService.requestHandoff).not.toHaveBeenCalled();
  });
  
  it('should handle streaming messages correctly', async () => {
    const onTokenStreamMock = vi.fn();
    const onToolCallMock = vi.fn();
    const onCompletionMock = vi.fn();
    
    await supportAgent.processMessageStream({
      message: 'Hello there',
      sessionId,
      userId,
      onTokenStream: onTokenStreamMock,
      onToolCall: onToolCallMock,
      onCompletion: onCompletionMock
    });
    
    // Should call onCompletion
    expect(onCompletionMock).toHaveBeenCalledTimes(1);
    const completionArg = onCompletionMock.mock.calls[0][0];
    expect(completionArg.needsHumanIntervention).toBe(false);
    expect(completionArg.message).toBe('Test response');
  });
  
  it('should stream handoff message when sentiment is negative', async () => {
    // Mock negative sentiment
    (sentimentAnalyzer.analyzeSentiment as any).mockResolvedValue({
      score: -0.9,
      category: 'negative',
      emotions: { anger: 0.9 }
    });
    
    const onTokenStreamMock = vi.fn();
    const onToolCallMock = vi.fn();
    const onCompletionMock = vi.fn();
    
    await supportAgent.processMessageStream({
      message: 'I am extremely upset!',
      sessionId,
      userId,
      onTokenStream: onTokenStreamMock,
      onToolCall: onToolCallMock,
      onCompletion: onCompletionMock
    });
    
    // Should call onTokenStream at least once
    expect(onTokenStreamMock).toHaveBeenCalled();
    
    // Should call onCompletion with handoff message
    expect(onCompletionMock).toHaveBeenCalledTimes(1);
    const completionArg = onCompletionMock.mock.calls[0][0];
    expect(completionArg.needsHumanIntervention).toBe(true);
    expect(completionArg.handoffReason).toBeDefined();
  });
  
  it('should directly implement analyzeSentiment method', async () => {
    (sentimentAnalyzer.analyzeSentiment as any).mockResolvedValue({
      score: 0.5,
      category: 'positive',
      emotions: { happiness: 0.7 }
    });
    
    const result = await supportAgent.analyzeSentiment('I love your service!');
    
    expect(result.score).toBe(0.5);
    expect(result.category).toBe('positive');
    expect(result.emotions?.happiness).toBe(0.7);
    expect(sentimentAnalyzer.analyzeSentiment).toHaveBeenCalledWith('I love your service!');
  });
  
  it('should directly implement checkSensitiveTopics method', async () => {
    (sentimentAnalyzer.checkSensitiveTopics as any).mockResolvedValue({
      containsSensitiveTopics: true,
      detectedTopics: ['billing']
    });
    
    const result = await supportAgent.checkSensitiveTopics('I need billing help');
    
    expect(result.containsSensitiveTopics).toBe(true);
    expect(result.detectedTopics).toContain('billing');
    expect(sentimentAnalyzer.checkSensitiveTopics).toHaveBeenCalledWith('I need billing help');
  });
  
  it('should directly implement initiateHumanHandoff method', async () => {
    const handoffOptions = {
      sessionId,
      userId,
      reason: 'Test reason',
      conversationHistory: [],
      priority: 4
    };
    
    const result = await supportAgent.initiateHumanHandoff(handoffOptions);
    
    expect(result.needsHumanIntervention).toBe(true);
    expect(result.handoffReason).toBe('Test reason');
    expect(humanHandoffService.requestHandoff).toHaveBeenCalledWith(handoffOptions);
  });
});