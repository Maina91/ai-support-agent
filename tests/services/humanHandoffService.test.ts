import { describe, it, expect, beforeEach, vi } from 'vitest';
import { humanHandoffService } from '../../src/services/humanHandoffService.js';
import { v4 as uuidv4 } from 'uuid';

// Mock UUID for consistent testing
vi.mock('uuid', () => {
  return {
    v4: vi.fn().mockReturnValue('mocked-uuid-1234')
  };
});

// Mock config for testing
vi.mock('../../src/config/index.js', () => {
  return {
    default: {
      server: {
        env: 'test'
      },
      agent: {
        humanHandoff: {
          enabled: true,
          sentimentThreshold: -0.5,
          sensitiveTopics: ['billing', 'refund', 'complaint'],
          defaultWaitTime: 5,
          waitTimeMessage: 'Estimated wait time: {wait_time} minutes.'
        }
      }
    }
  };
});

describe('HumanHandoffService', () => {
  const testSessionId = 'test-session-123';
  const testUserId = 'test-user-456';
  
  // Reset service state before each test
  beforeEach(() => {
    // Clear any existing handoffs and agents
    // @ts-ignore - Access private properties for testing
    humanHandoffService.handoffQueue = [];
    // @ts-ignore
    humanHandoffService.agents = new Map();
    // @ts-ignore
    humanHandoffService.sessionToHandoffMap = new Map();
  });
  
  it('should request a handoff and return an ID and wait time', async () => {
    const result = await humanHandoffService.requestHandoff({
      sessionId: testSessionId,
      userId: testUserId,
      reason: 'Test reason',
      conversationHistory: []
    });
    
    expect(result).toHaveProperty('handoffId');
    expect(result).toHaveProperty('estimatedWaitTime');
    expect(result).toHaveProperty('message');
    expect(result.message).toContain('Estimated wait time');
    
    // Verify the handoff was added to the queue
    // @ts-ignore - Access private properties for testing
    const queue = humanHandoffService.handoffQueue;
    expect(queue.length).toBe(1);
    expect(queue[0].sessionId).toBe(testSessionId);
    expect(queue[0].userId).toBe(testUserId);
  });
  
  it('should not create duplicate handoffs for the same session', async () => {
    // Request first handoff
    const firstResult = await humanHandoffService.requestHandoff({
      sessionId: testSessionId,
      userId: testUserId,
      reason: 'Test reason',
      conversationHistory: []
    });
    
    // Request second handoff for same session
    const secondResult = await humanHandoffService.requestHandoff({
      sessionId: testSessionId,
      userId: testUserId,
      reason: 'Another reason',
      conversationHistory: []
    });
    
    // Should return the same handoff ID
    expect(secondResult.handoffId).toBe(firstResult.handoffId);
    
    // Only one handoff should be in the queue
    // @ts-ignore - Access private properties for testing
    expect(humanHandoffService.handoffQueue.length).toBe(1);
  });
  
  it('should register an agent and make them available', () => {
    const agent = humanHandoffService.registerAgent({
      id: 'test-agent-1',
      name: 'Test Agent',
      status: 'available'
    });
    
    expect(agent.id).toBe('test-agent-1');
    expect(agent.status).toBe('available');
    expect(agent.lastActivity).toBeInstanceOf(Date);
    
    // @ts-ignore - Access private properties for testing
    expect(humanHandoffService.agents.size).toBe(1);
    // @ts-ignore
    expect(humanHandoffService.agents.get('test-agent-1')).toBeTruthy();
  });
  
  it('should update agent status correctly', () => {
    // Register an agent
    humanHandoffService.registerAgent({
      id: 'test-agent-1',
      name: 'Test Agent',
      status: 'available'
    });
    
    // Update status to busy
    const updatedAgent = humanHandoffService.updateAgentStatus('test-agent-1', 'busy');
    
    expect(updatedAgent).toBeTruthy();
    expect(updatedAgent?.status).toBe('busy');
    
    // Update status to offline
    const offlineAgent = humanHandoffService.updateAgentStatus('test-agent-1', 'offline');
    
    expect(offlineAgent).toBeTruthy();
    expect(offlineAgent?.status).toBe('offline');
  });
  
  it('should assign handoffs to available agents', async () => {
    // Register an agent
    humanHandoffService.registerAgent({
      id: 'test-agent-1',
      name: 'Test Agent',
      status: 'available'
    });
    
    // Request a handoff
    await humanHandoffService.requestHandoff({
      sessionId: testSessionId,
      userId: testUserId,
      reason: 'Test reason',
      conversationHistory: []
    });
    
    // The handoff should be assigned to the agent
    // @ts-ignore - Access private properties for testing
    const handoff = humanHandoffService.handoffQueue[0];
    expect(handoff.status).toBe('assigned');
    expect(handoff.assignedAgent).toBe('test-agent-1');
    
    // The agent should be busy
    // @ts-ignore
    const agent = humanHandoffService.agents.get('test-agent-1');
    expect(agent?.status).toBe('busy');
  });
  
  it('should prioritize handoffs by priority level', async () => {
    // Create a high priority and low priority handoff
    await humanHandoffService.requestHandoff({
      sessionId: 'low-priority-session',
      userId: 'user-1',
      reason: 'Low priority reason',
      conversationHistory: [],
      priority: 2
    });
    
    await humanHandoffService.requestHandoff({
      sessionId: 'high-priority-session',
      userId: 'user-2',
      reason: 'High priority reason',
      conversationHistory: [],
      priority: 5
    });
    
    // Register an agent
    humanHandoffService.registerAgent({
      id: 'test-agent-1',
      name: 'Test Agent',
      status: 'available'
    });
    
    // The high priority handoff should be assigned first
    // @ts-ignore - Access private properties for testing
    const assignedHandoff = humanHandoffService.handoffQueue.find(h => h.status === 'assigned');
    expect(assignedHandoff?.sessionId).toBe('high-priority-session');
    
    // The low priority handoff should still be pending
    // @ts-ignore
    const pendingHandoff = humanHandoffService.handoffQueue.find(h => h.status === 'pending');
    expect(pendingHandoff?.sessionId).toBe('low-priority-session');
  });
  
  it('should complete handoffs and make agents available again', async () => {
    // Register an agent
    humanHandoffService.registerAgent({
      id: 'test-agent-1',
      name: 'Test Agent',
      status: 'available'
    });
    
    // Request a handoff
    const handoffResult = await humanHandoffService.requestHandoff({
      sessionId: testSessionId,
      userId: testUserId,
      reason: 'Test reason',
      conversationHistory: []
    });
    
    // Complete the handoff
    const completed = humanHandoffService.completeHandoff(handoffResult.handoffId);
    
    expect(completed).toBe(true);
    
    // @ts-ignore - Access private properties for testing
    const handoff = humanHandoffService.handoffQueue.find(h => h.id === handoffResult.handoffId);
    expect(handoff?.status).toBe('completed');
    
    // The agent should be available again
    // @ts-ignore
    const agent = humanHandoffService.agents.get('test-agent-1');
    expect(agent?.status).toBe('available');
  });
  
  it('should calculate estimated wait time based on queue and priority', async () => {
    // @ts-ignore - Access private method for testing
    const waitTime1 = humanHandoffService.calculateEstimatedWaitTime(3);
    expect(waitTime1).toBeDefined();
    
    // Fill the queue with handoffs
    for (let i = 0; i < 5; i++) {
      await humanHandoffService.requestHandoff({
        sessionId: `session-${i}`,
        userId: `user-${i}`,
        reason: `Reason ${i}`,
        conversationHistory: []
      });
    }
    
    // Wait time should increase with more pending handoffs
    // @ts-ignore
    const waitTime2 = humanHandoffService.calculateEstimatedWaitTime(3);
    expect(waitTime2).toBeGreaterThan(waitTime1);
    
    // Higher priority should have shorter wait time
    // @ts-ignore
    const highPriorityWaitTime = humanHandoffService.calculateEstimatedWaitTime(5);
    expect(highPriorityWaitTime).toBeLessThan(waitTime2);
  });
});