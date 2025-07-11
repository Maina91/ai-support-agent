import express from 'express';
import { z } from 'zod';
import { supportAgent } from '../../agent/index.js';
import { validateRequest } from '../../utils/middleware.js';

const router = express.Router();

// Schema for the chat message request
const chatMessageSchema = z.object({
  message: z.string().min(1, "Message cannot be empty"),
  sessionId: z.string().uuid("Session ID must be a valid UUID"),
  userId: z.string().min(1, "User ID is required"),
  metadata: z.record(z.string(), z.any()).optional(),
  stream: z.boolean().optional().default(true),
});

/**
 * Process a new chat message from the user
 */
router.post('/chat', validateRequest(chatMessageSchema), async (req, res) => {
  const { message, sessionId, userId, metadata, stream } = req.body;

  if (stream) {
    // Set up SSE for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // Process the message with streaming response
    await supportAgent.processMessageStream({
      message,
      sessionId,
      userId,
      metadata,
      onTokenStream: (token) => {
        res.write(`data: ${JSON.stringify({ token })}\n\n`);
      },
      onToolCall: (toolCall) => {
        res.write(`data: ${JSON.stringify({ toolCall })}\n\n`);
      },
      onCompletion: (completion) => {
        res.write(`data: ${JSON.stringify({ completion })}\n\n`);
        res.end();
      }
    });
  } else {
    // Process the message and return the full response
    try {
      const response = await supportAgent.processMessage({
        message,
        sessionId,
        userId,
        metadata,
      });
      res.json(response);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({
          error: 'Processing Error',
          message: error.message
        });
      } else {
        res.status(500).json({
          error: 'Unknown Error',
          message: 'An unknown error occurred'
        });
      }
    }
  }
});

/**
 * Upload a file to provide context for the conversation
 */
router.post('/upload', async (req, res) => {
  // File upload logic would go here
  // Using a library like multer to handle file uploads
  
  res.status(501).json({
    message: "File upload feature not yet implemented"
  });
});

/**
 * Get conversation history for a specific session
 */
router.get('/history/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  
  try {
    const history = await supportAgent.getConversationHistory(sessionId);
    res.json({ history });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({
        error: 'History Retrieval Error',
        message: error.message
      });
    } else {
      res.status(500).json({
        error: 'Unknown Error',
        message: 'An unknown error occurred'
      });
    }
  }
});

/**
 * Provide feedback on an agent response
 */
router.post('/feedback', async (req, res) => {
  const { sessionId, messageId, rating, feedback } = req.body;
  
  try {
    await supportAgent.recordFeedback({
      sessionId, 
      messageId, 
      rating, 
      feedback
    });
    
    res.json({ success: true });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({
        error: 'Feedback Error',
        message: error.message
      });
    } else {
      res.status(500).json({
        error: 'Unknown Error',
        message: 'An unknown error occurred'
      });
    }
  }
});

export const agentRouter = router;