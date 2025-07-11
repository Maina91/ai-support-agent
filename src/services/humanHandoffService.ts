import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import config from '../config/index.js';
import { ChatHistoryItem } from '../memory/types.js';

// Define types for the human handoff system
interface HandoffRequest {
  id: string;
  sessionId: string;
  userId: string;
  reason: string;
  priority: number;
  timestamp: Date;
  status: 'pending' | 'assigned' | 'completed';
  conversationHistory: ChatHistoryItem[];
  assignedAgent?: string;
  estimatedWaitTime: number; // in minutes
}

interface HumanAgent {
  id: string;
  name: string;
  status: 'available' | 'busy' | 'offline';
  activeSessionId?: string;
  lastActivity: Date;
}

/**
 * Service to manage human handoffs
 */
class HumanHandoffService extends EventEmitter {
  private handoffQueue: HandoffRequest[] = [];
  private agents: Map<string, HumanAgent> = new Map();
  private sessionToHandoffMap: Map<string, string> = new Map(); // Maps sessionId -> handoffId
  
  constructor() {
    super();
    
    // Initialize with mock agents for development/testing
    if (config.server.env === 'development') {
      this.registerMockAgents();
    }
  }
  
  /**
   * Request a handoff to a human agent
   */
  async requestHandoff(options: {
    sessionId: string;
    userId: string;
    reason: string;
    conversationHistory: ChatHistoryItem[];
    priority?: number;
  }): Promise<{
    handoffId: string;
    estimatedWaitTime: number;
    message: string;
  }> {
    const { sessionId, userId, reason, conversationHistory, priority = 3 } = options;
    
    // Check if there's already a handoff for this session
    const existingHandoffId = this.sessionToHandoffMap.get(sessionId);
    if (existingHandoffId) {
      const existingHandoff = this.handoffQueue.find(h => h.id === existingHandoffId);
      if (existingHandoff && existingHandoff.status === 'pending') {
        return {
          handoffId: existingHandoffId,
          estimatedWaitTime: existingHandoff.estimatedWaitTime,
          message: this.getWaitTimeMessage(existingHandoff.estimatedWaitTime)
        };
      }
    }
    
    // Create a new handoff request
    const handoffId = uuidv4();
    const estimatedWaitTime = this.calculateEstimatedWaitTime(priority);
    
    const handoffRequest: HandoffRequest = {
      id: handoffId,
      sessionId,
      userId,
      reason,
      priority,
      timestamp: new Date(),
      status: 'pending',
      conversationHistory,
      estimatedWaitTime,
    };
    
    // Add to queue and map
    this.handoffQueue.push(handoffRequest);
    this.sessionToHandoffMap.set(sessionId, handoffId);
    
    // Sort the queue by priority and then timestamp
    this.sortQueue();
    
    // Emit event for new handoff request
    this.emit('handoff:requested', handoffRequest);
    
    // Try to assign an agent if available
    this.assignNextAvailableAgent();
    
    // Return handoff info
    return {
      handoffId,
      estimatedWaitTime,
      message: this.getWaitTimeMessage(estimatedWaitTime)
    };
  }
  
  /**
   * Register a human agent with the system
   */
  registerAgent(agent: Omit<HumanAgent, 'lastActivity'>): HumanAgent {
    const fullAgent: HumanAgent = {
      ...agent,
      lastActivity: new Date()
    };
    
    this.agents.set(agent.id, fullAgent);
    
    // Emit event for agent registration
    this.emit('agent:registered', fullAgent);
    
    // Try to assign requests to this agent if they're available
    if (fullAgent.status === 'available') {
      this.assignNextAvailableAgent();
    }
    
    return fullAgent;
  }
  
  /**
   * Update agent status
   */
  updateAgentStatus(agentId: string, status: HumanAgent['status']): HumanAgent | null {
    const agent = this.agents.get(agentId);
    if (!agent) return null;
    
    agent.status = status;
    agent.lastActivity = new Date();
    
    // If agent becomes available, try to assign a handoff
    if (status === 'available') {
      this.assignNextAvailableAgent();
    }
    
    // Emit event for status change
    this.emit('agent:statusChanged', agent);
    
    return agent;
  }
  
  /**
   * Get handoff request by ID
   */
  getHandoffRequest(handoffId: string): HandoffRequest | null {
    return this.handoffQueue.find(h => h.id === handoffId) || null;
  }
  
  /**
   * Get handoff request by session ID
   */
  getHandoffRequestBySessionId(sessionId: string): HandoffRequest | null {
    const handoffId = this.sessionToHandoffMap.get(sessionId);
    if (!handoffId) return null;
    
    return this.getHandoffRequest(handoffId);
  }
  
  /**
   * Get all pending handoff requests
   */
  getPendingHandoffRequests(): HandoffRequest[] {
    return this.handoffQueue.filter(h => h.status === 'pending');
  }
  
  /**
   * Complete a handoff request
   */
  completeHandoff(handoffId: string, resolution?: string): boolean {
    const handoff = this.getHandoffRequest(handoffId);
    if (!handoff) return false;
    
    // Update handoff status
    handoff.status = 'completed';
    
    // Update agent if one was assigned
    if (handoff.assignedAgent) {
      const agent = this.agents.get(handoff.assignedAgent);
      if (agent) {
        agent.status = 'available';
        agent.activeSessionId = undefined;
        
        // Try to assign next handoff to this agent
        this.assignNextAvailableAgent();
      }
    }
    
    // Emit event for completion
    this.emit('handoff:completed', handoff, resolution);
    
    return true;
  }
  
  /**
   * Calculate estimated wait time based on queue length and priority
   */
  private calculateEstimatedWaitTime(priority: number): number {
    const pendingCount = this.handoffQueue.filter(h => h.status === 'pending').length;
    const availableAgents = Array.from(this.agents.values()).filter(a => a.status === 'available').length;
    
    // Base wait time is the default wait time from config
    let waitTime = config.agent.humanHandoff.defaultWaitTime;
    
    // Adjust based on queue length and available agents
    if (availableAgents > 0) {
      // If agents are available, wait time is shorter
      waitTime = Math.max(1, Math.floor(waitTime / 2));
    } else if (pendingCount > 0) {
      // If no agents available and queue exists, add time based on position
      waitTime += Math.min(20, pendingCount * 5);
    }
    
    // Adjust based on priority (higher priority = less wait time)
    waitTime = Math.max(1, waitTime - (priority - 3));
    
    return waitTime;
  }
  
  /**
   * Get formatted wait time message
   */
  private getWaitTimeMessage(waitTime: number): string {
    return config.agent.humanHandoff.waitTimeMessage.replace('{wait_time}', waitTime.toString());
  }
  
  /**
   * Sort the queue by priority and timestamp
   */
  private sortQueue(): void {
    this.handoffQueue.sort((a, b) => {
      // Higher priority (5) comes before lower priority (1)
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      
      // Earlier timestamp comes before later timestamp
      return a.timestamp.getTime() - b.timestamp.getTime();
    });
  }
  
  /**
   * Assign next available agent to highest priority handoff
   */
  private assignNextAvailableAgent(): boolean {
    // Find an available agent
    const availableAgent = Array.from(this.agents.values()).find(a => a.status === 'available');
    if (!availableAgent) return false;
    
    // Find the highest priority pending handoff
    const pendingHandoff = this.handoffQueue.find(h => h.status === 'pending');
    if (!pendingHandoff) return false;
    
    // Assign agent to handoff
    pendingHandoff.assignedAgent = availableAgent.id;
    pendingHandoff.status = 'assigned';
    
    // Update agent status
    availableAgent.status = 'busy';
    availableAgent.activeSessionId = pendingHandoff.sessionId;
    availableAgent.lastActivity = new Date();
    
    // Emit event for assignment
    this.emit('handoff:assigned', pendingHandoff, availableAgent);
    
    return true;
  }
  
  /**
   * Register mock agents for development/testing
   */
  private registerMockAgents(): void {
    this.registerAgent({
      id: 'agent-1',
      name: 'Support Agent 1',
      status: 'available',
    });
    
    this.registerAgent({
      id: 'agent-2',
      name: 'Support Agent 2',
      status: 'available',
    });
  }
}

// Export singleton instance
export const humanHandoffService = new HumanHandoffService();