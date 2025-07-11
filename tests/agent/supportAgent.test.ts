import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { SupportAgent } from '../../src/agent/supportAgent';
import { createMemoryManager } from '../../src/memory';
import { createToolFactory } from '../../src/tools';

// Mock dependencies
vi.mock('../../src/memory', () => ({
  createMemoryManager: vi.fn(() => ({
    saveMessage: vi.fn().mockResolvedValue(true),
    getChatHistory: vi.fn().mockResolvedValue([]),
    getSimilarMessages: vi.fn().mockResolvedValue([]),
    clearHistory: vi.fn().mockResolvedValue(true),
  })),
}));

vi.mock('../../src/tools', () => ({
  createToolFactory: vi.fn(() => ({
    getTool: vi.fn().mockReturnValue({
      name: 'mockTool',
      description: 'A mock tool for testing',
      schema: {},
      execute: vi.fn().mockResolvedValue({ result: 'success' }),
    }),
    getAllTools: vi.fn().mockReturnValue([]),
  })),
}));

vi.mock('@langchain/openai', () => ({
  ChatOpenAI: vi.fn().mockImplementation(() => ({
    invoke: vi.fn().mockResolvedValue({
      content: 'This is a mock response from the LLM',
    }),
  })),
}));

describe('SupportAgent', () => {
  let agent: SupportAgent;
  
  beforeEach(() => {
    agent = new SupportAgent({
      memoryManager: createMemoryManager('memory'),
      toolFactory: createToolFactory(),
      apiKey: 'test-key',
      model: 'gpt-3.5-turbo',
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize correctly', () => {
    expect(agent).toBeDefined();
  });

  it('should handle user messages', async () => {
    const response = await agent.processUserMessage({
      sessionId: 'test-session',
      userId: 'user-1',
      message: 'Hello, I need help',
    });

    expect(response).toBeDefined();
    expect(typeof response.messageId).toBe('string');
    expect(typeof response.response).toBe('string');
  });

  it('should handle tool execution', async () => {
    // This is a simplified test since we're mocking the tool execution
    const response = await agent.processUserMessage({
      sessionId: 'test-session',
      userId: 'user-1',
      message: 'Can you help me calculate 5+5?',
    });

    expect(response).toBeDefined();
  });
});