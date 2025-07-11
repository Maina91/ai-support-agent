import express from 'express';
import { authRouter } from './auth/router.js';
import { agentRouter } from './agent/router.js';
import { adminRouter } from './admin/router.js';
import { humanAgentRouter } from './admin/humanAgentRouter.js';
import { userRouter } from './auth/userRoute.js';


const router = express.Router();

// Mount routers
router.use("/auth", authRouter);
router.use("/agent", agentRouter);
router.use("/admin", adminRouter);
router.use("/human-agent", humanAgentRouter);
router.use("/user", userRouter);

export const apiRouter = router;