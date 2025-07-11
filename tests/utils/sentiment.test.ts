import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { SentimentAnalyzer } from '../../src/utils/sentiment.js';
import { ChatOpenAI } from '@langchain/openai';

// Mock LangChain
vi.mock('@langchain/openai', () => {
  return {
    ChatOpenAI: vi.fn().mockImplementation(() => {
      return {
        invoke: vi.fn().mockImplementation(async (messages) => {
          // Simulate responses based on input messages
          const userMessage = messages[1].content as string;
          
          if (userMessage.includes('angry') || userMessage.includes('terrible')) {
            // Negative sentiment response
            return {
              content: JSON.stringify({
                score: -0.8,
                category: "negative",
                emotions: {
                  anger: 0.9,
                  frustration: 0.7
                }
              })
            };
          } else if (userMessage.includes('happy') || userMessage.includes('excellent')) {
            // Positive sentiment response
            return {
              content: JSON.stringify({
                score: 0.8,
                category: "positive",
                emotions: {
                  joy: 0.9,
                  satisfaction: 0.8
                }
              })
            };
          } else if (userMessage.includes('billing') || userMessage.includes('refund')) {
            // Sensitive topic response
            return {
              content: JSON.stringify({
                containsSensitiveTopics: true,
                detectedTopics: ["billing dispute", "refund request"]
              })
            };
          } else {
            // Neutral sentiment response
            return {
              content: JSON.stringify({
                score: 0.1,
                category: "neutral",
                emotions: {
                  interest: 0.5
                }
              })
            };
          }
        }),
      };
    }),
    SystemMessage: vi.fn().mockImplementation((content) => ({ role: 'system', content })),
    HumanMessage: vi.fn().mockImplementation((content) => ({ role: 'human', content })),
  };
});

describe('SentimentAnalyzer', () => {
  let sentimentAnalyzer: SentimentAnalyzer;
  
  beforeAll(() => {
    sentimentAnalyzer = new SentimentAnalyzer();
  });
  
  it('should detect negative sentiment correctly', async () => {
    const result = await sentimentAnalyzer.analyzeSentiment(
      'This is a terrible service! I am very angry about how this was handled.'
    );
    
    expect(result.category).toBe('negative');
    expect(result.score).toBeLessThan(0);
    expect(result.emotions).toBeDefined();
    expect(result.emotions?.anger).toBeGreaterThan(0.5);
  });
  
  it('should detect positive sentiment correctly', async () => {
    const result = await sentimentAnalyzer.analyzeSentiment(
      'I am so happy with your service! This is excellent work.'
    );
    
    expect(result.category).toBe('positive');
    expect(result.score).toBeGreaterThan(0);
    expect(result.emotions).toBeDefined();
    expect(result.emotions?.joy).toBeGreaterThan(0.5);
  });
  
  it('should handle neutral sentiment correctly', async () => {
    const result = await sentimentAnalyzer.analyzeSentiment(
      'I need information about your opening hours.'
    );
    
    expect(result.category).toBe('neutral');
    expect(result.emotions).toBeDefined();
  });
  
  it('should detect sensitive topics correctly', async () => {
    const result = await sentimentAnalyzer.checkSensitiveTopics(
      'I want to dispute a billing charge and request a refund for my account.'
    );
    
    expect(result.containsSensitiveTopics).toBe(true);
    expect(result.detectedTopics).toContain('billing dispute');
    expect(result.detectedTopics).toContain('refund request');
  });
  
  it('should handle non-sensitive topics correctly', async () => {
    const result = await sentimentAnalyzer.checkSensitiveTopics(
      'What are your business hours today?'
    );
    
    expect(result.containsSensitiveTopics).toBe(false);
    expect(result.detectedTopics).toEqual([]);
  });
  
  it('should handle error in LLM response for sentiment analysis', async () => {
    // Mock an error in the LLM response parsing
    const mockChatOpenAI = new ChatOpenAI() as any;
    mockChatOpenAI.invoke.mockResolvedValueOnce({
      content: 'Invalid JSON response',
    });
    
    // Replace the mocked invoke method temporarily
    const originalInvoke = sentimentAnalyzer['llm'].invoke;
    sentimentAnalyzer['llm'].invoke = mockChatOpenAI.invoke;
    
    const result = await sentimentAnalyzer.analyzeSentiment('Hello');
    
    // Restore the original invoke method
    sentimentAnalyzer['llm'].invoke = originalInvoke;
    
    // Even with an error, we should get a fallback result
    expect(result).toHaveProperty('score');
    expect(result).toHaveProperty('category');
    expect(result).toHaveProperty('emotions');
  });
});