import express from 'express';
import { agentRouter } from './agent/router.js';
import { adminRouter } from './admin/router.js';
import { humanAgentRouter } from './admin/humanAgentRouter.js';

const router = express.Router();

// Mount routers
router.use('/agent', agentRouter);
router.use('/admin', adminRouter);
router.use('/human-agent', humanAgentRouter);

export const apiRouter = router;