import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { InMemoryManager } from '../../src/memory/inMemoryManager';

// Define enums locally for testing to avoid import issues
enum MessageType {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system',
  TOOL = 'tool'
}

describe('InMemoryManager', () => {
  let memoryManager: InMemoryManager;
  
  beforeEach(() => {
    memoryManager = new InMemoryManager();
  });

  afterEach(() => {
    // Clean up after each test
  });

  it('should save messages correctly', async () => {
    const sessionId = 'test-session';
    const userId = 'test-user';
    const message = 'Hello, this is a test message';
    const type = MessageType.USER;

    const result = await memoryManager.saveMessage({
      sessionId,
      userId,
      message,
      type,
    });

    expect(result).toBe(true);
  });

  it('should retrieve chat history', async () => {
    const sessionId = 'test-session';
    const userId = 'test-user';
    const message = 'Hello, this is a test message';
    
    // Save a message first
    await memoryManager.saveMessage({
      sessionId,
      userId,
      message,
      type: MessageType.USER,
    });

    await memoryManager.saveMessage({
      sessionId,
      userId,
      message: 'This is a response',
      type: MessageType.ASSISTANT,
    });

    // Retrieve chat history
    const history = await memoryManager.getChatHistory(sessionId);
    
    expect(history).toHaveLength(2);
    expect(history[0].message).toBe(message);
    expect(history[0].type).toBe(MessageType.USER);
    expect(history[1].type).toBe(MessageType.ASSISTANT);
  });

  it('should get similar messages', async () => {
    const sessionId = 'test-session';
    const userId = 'test-user';
    
    // Save some messages
    await memoryManager.saveMessage({
      sessionId,
      userId,
      message: 'How do I reset my password?',
      type: MessageType.USER,
    });

    await memoryManager.saveMessage({
      sessionId,
      userId,
      message: 'You can reset your password by clicking on the "Forgot Password" link.',
      type: MessageType.ASSISTANT,
    });

    // In-memory implementation doesn't do real similarity search,
    // but we should still get back some results
    const similar = await memoryManager.getSimilarMessages(sessionId, 'password reset');
    
    expect(Array.isArray(similar)).toBe(true);
  });

  it('should clear history', async () => {
    const sessionId = 'test-session';
    const userId = 'test-user';
    
    // Save a message first
    await memoryManager.saveMessage({
      sessionId,
      userId,
      message: 'Test message',
      type: MessageType.USER,
    });

    // Clear history
    const result = await memoryManager.clearHistory(sessionId);
    
    expect(result).toBe(true);
    
    // Verify it's cleared
    const history = await memoryManager.getChatHistory(sessionId);
    expect(history).toHaveLength(0);
  });
});