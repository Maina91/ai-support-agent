import express from 'express';
import { z } from 'zod';
import { validateRequest } from '../../utils/middleware.js';
import config from '../../config/index.js';

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

// Schema for creating/updating tools
const toolSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  parameters: z.record(z.string(), z.any()),
  enabled: z.boolean().default(true),
});

/**
 * Get all registered tools
 */
router.get('/tools', async (req, res) => {
  // In a real application, this would retrieve from a database
  // For now, we'll return a mock response
  res.json({
    tools: [
      {
        name: 'search_knowledge_base',
        description: 'Search the knowledge base for information',
        parameters: {
          query: {
            type: 'string',
            description: 'The search query'
          }
        },
        enabled: true
      },
      {
        name: 'get_customer_info',
        description: 'Get information about a customer',
        parameters: {
          customerId: {
            type: 'string',
            description: 'The customer ID'
          }
        },
        enabled: true
      }
    ]
  });
});

/**
 * Add or update a tool
 */
router.post('/tools', validateRequest(toolSchema), async (req, res) => {
  const tool = req.body;
  
  // In a real application, this would save to a database
  res.json({
    message: `Tool '${tool.name}' ${req.body.id ? 'updated' : 'created'} successfully`,
    tool
  });
});

/**
 * Get system metrics and stats
 */
router.get('/metrics', async (req, res) => {
  // In a real application, this would retrieve actual metrics
  res.json({
    metrics: {
      totalConversations: 1245,
      activeConversations: 23,
      avgResponseTime: 1.2, // seconds
      toolUsage: {
        search_knowledge_base: 567,
        get_customer_info: 432,
        create_ticket: 198
      },
      userSatisfaction: 4.7, // out of 5
      escalationRate: 0.08 // 8% of conversations escalated to human
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * Update agent configuration
 */
router.put('/config', async (req, res) => {
  // In a real application, this would update configuration in a database
  res.json({
    message: 'Configuration updated successfully',
    config: {
      ...req.body,
      updatedAt: new Date().toISOString()
    }
  });
});

/**
 * Get current system configuration
 */
router.get('/config', (req, res) => {
  // Return safe config (without sensitive values)
  const safeConfig = {
    agent: config.agent,
    server: {
      env: config.server.env,
      apiPrefix: config.server.apiPrefix
    },
    openai: {
      model: config.openai.model,
      temperature: config.openai.temperature,
      streamMode: config.openai.streamMode
    }
  };
  
  res.json(safeConfig);
});

export const adminRouter = router;