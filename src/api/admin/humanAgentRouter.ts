import express from 'express';
import { z } from 'zod';
import { validateRequest } from '../../utils/middleware.js';
import { humanHandoffService } from '../../services/humanHandoffService.js';

const router = express.Router();

// Admin authentication middleware (simplified - would use JWT or similar in production)
const authenticateAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const apiKey = req.headers['x-admin-api-key'];
  
  // In a real application, use proper authentication
  if (!apiKey || apiKey !== process.env.ADMIN_API_KEY) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Admin authentication required'
    });
  }
  
  next();
};

// Apply admin authentication to all routes
router.use(authenticateAdmin);

// Schema for agent registration
const agentSchema = z.object({
  name: z.string().min(1, "Agent name is required"),
  status: z.enum(['available', 'busy', 'offline']).default('available'),
});

// Schema for updating agent status
const agentStatusSchema = z.object({
  status: z.enum(['available', 'busy', 'offline']),
});

// Schema for completing a handoff
const completeHandoffSchema = z.object({
  resolution: z.string().optional(),
});

/**
 * Register a human agent
 */
router.post('/register', validateRequest(agentSchema), async (req, res) => {
  const { name, status } = req.body;
  
  const agent = humanHandoffService.registerAgent({
    id: `agent-${Date.now()}`, // Generate a simple ID (in production, use proper ID generation)
    name,
    status,
  });
  
  res.status(201).json({
    message: `Agent '${name}' registered successfully`,
    agent,
  });
});

/**
 * Get all pending handoff requests
 */
router.get('/queue', async (req, res) => {
  const pendingHandoffs = humanHandoffService.getPendingHandoffRequests();
  
  res.json({
    count: pendingHandoffs.length,
    requests: pendingHandoffs.map(h => ({
      id: h.id,
      sessionId: h.sessionId,
      reason: h.reason,
      priority: h.priority,
      timestamp: h.timestamp,
      estimatedWaitTime: h.estimatedWaitTime,
    })),
  });
});

/**
 * Get details for a specific handoff request
 */
router.get('/handoff/:handoffId', async (req, res) => {
  const { handoffId } = req.params;
  
  const handoff = humanHandoffService.getHandoffRequest(handoffId);
  
  if (!handoff) {
    return res.status(404).json({
      error: 'Not Found',
      message: `Handoff request with ID ${handoffId} not found`,
    });
  }
  
  res.json(handoff);
});

/**
 * Accept a handoff request
 */
router.post('/handoff/:handoffId/accept', async (req, res) => {
  const { handoffId } = req.params;
  const agentId = req.headers['x-agent-id'] as string;
  
  if (!agentId) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Agent ID is required (x-agent-id header)'
    });
  }
  
  // Update agent status to busy
  const agent = humanHandoffService.updateAgentStatus(agentId, 'busy');
  
  if (!agent) {
    return res.status(404).json({
      error: 'Not Found',
      message: `Agent with ID ${agentId} not found`,
    });
  }
  
  // Get the handoff request
  const handoff = humanHandoffService.getHandoffRequest(handoffId);
  
  if (!handoff) {
    return res.status(404).json({
      error: 'Not Found',
      message: `Handoff request with ID ${handoffId} not found`,
    });
  }
  
  // If the handoff is already assigned, return error
  if (handoff.status === 'assigned' && handoff.assignedAgent !== agentId) {
    return res.status(400).json({
      error: 'Bad Request',
      message: `Handoff request is already assigned to another agent`
    });
  }
  
  // Assign handoff to agent if not already assigned
  if (handoff.status !== 'assigned') {
    handoff.status = 'assigned';
    handoff.assignedAgent = agentId;
  }
  
  res.json({
    message: `Handoff request ${handoffId} accepted by agent ${agent.name}`,
    handoff,
  });
});

/**
 * Complete a handoff request
 */
router.post('/handoff/:handoffId/complete', validateRequest(completeHandoffSchema), async (req, res) => {
  const { handoffId } = req.params;
  const { resolution } = req.body;
  
  const success = humanHandoffService.completeHandoff(handoffId, resolution);
  
  if (!success) {
    return res.status(404).json({
      error: 'Not Found',
      message: `Handoff request with ID ${handoffId} not found`,
    });
  }
  
  res.json({
    message: `Handoff request ${handoffId} completed successfully`,
  });
});

/**
 * Update agent status
 */
router.put('/agent/:agentId/status', validateRequest(agentStatusSchema), async (req, res) => {
  const { agentId } = req.params;
  const { status } = req.body;
  
  const agent = humanHandoffService.updateAgentStatus(agentId, status);
  
  if (!agent) {
    return res.status(404).json({
      error: 'Not Found',
      message: `Agent with ID ${agentId} not found`,
    });
  }
  
  res.json({
    message: `Agent status updated to ${status}`,
    agent,
  });
});

export const humanAgentRouter = router;