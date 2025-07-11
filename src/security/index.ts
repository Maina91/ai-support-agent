// src/middlewares/security.ts
import { Express } from "express";
import helmet from "helmet";
import cors from "cors";
import {
  validateOrigin,
  sanitizeInputs,
  validateToken,
  applyRateLimit,
} from "../utils/middleware.js"; // adjust import path as needed
import config from "../config/index.js";

export function setupSecurity(app: Express) {
  const allowedOrigins = process.env.CORS_ORIGINS?.split(",") || ["*"];

  // 1. Secure HTTP headers
  app.use(helmet());

  // 2. CORS origin validation
  app.use(validateOrigin(allowedOrigins));

  // 3. CORS actual middleware
  app.use(
    cors({
      origin: allowedOrigins.includes("*")
        ? true
        : (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
              callback(null, true);
            } else {
              callback(new Error("Not allowed by CORS"));
            }
          },
      credentials: true,
    })
  );

  // 4. Input sanitization
  app.use(sanitizeInputs);

  // 5. Global rate limiting (Memory or Redis-backed)
  app.use(applyRateLimit);

  // 6. Token validation – apply **per route**, not globally
  // app.use(validateToken); ❌ Don't enable globally unless your entire API is private
  app.use(validateToken);
}
