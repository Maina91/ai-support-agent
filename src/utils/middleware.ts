import { Request, Response, NextFunction } from "express";
import { AnyZodObject, z } from "zod";
import { RateLimiterRedis } from "rate-limiter-flexible";
import Redis from "ioredis";
import config from "../config/index.js";


const redisClient = new Redis(config.redis.url, {
  enableOfflineQueue: false,
});

const limiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "rlflx", // Optional prefix for Redis keys
  points: config.security.rateLimiting.maxRequests, // Number of points
  duration: config.security.rateLimiting.windowMs / 1000, // Per X seconds
  blockDuration: 60, // Block for 1 min if consumed more than points
});

/**
 * Creates a middleware that validates request body against a Zod schema
 * @param schema The Zod schema to validate against
 */
// export function validateRequest(schema: AnyZodObject) {
//   return async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       req.body = schema.parse(req.body);
//       next();
//     } catch (error) {
//       if (error instanceof z.ZodError) {
//         return res.status(400).json({
//           error: 'Validation Error',
//           details: error.errors.map(err => ({
//             path: err.path.join('.'),
//             message: err.message
//           }))
//         });
//       }
//       next(error);
//     }
//   };
// }
export function validateRequest(schema: {
  body?: AnyZodObject;
  query?: AnyZodObject;
  params?: AnyZodObject;
}) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schema.body) req.body = schema.body.parse(req.body);
      if (schema.query) req.query = schema.query.parse(req.query);
      if (schema.params) req.params = schema.params.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Validation Error",
          details: error.errors.map((err) => ({
            path: err.path.join("."),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
}

/**
 * Middleware to log API requests
 */
// export function errorHandler(req: Request, res: Response, next: NextFunction) {
//   const start = Date.now();

//   // Log when the request finishes
//   res.on("finish", () => {
//     const duration = Date.now() - start;
//     console.log(
//       `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`
//     );
//   });

//   next();
// }
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error("Unhandled Error:", err);

  res.status(500).json({
    error: "Internal Server Error",
    message: err.message,
  });
}

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(
      `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`
    );
  });

  next();
}

/**
 * Middleware to ensure a user is authenticated
 * In a real app, this would validate JWT tokens or session cookies
 */
// export function authenticate(req: Request, res: Response, next: NextFunction) {
//   const authHeader = req.headers.authorization;

//   if (!authHeader) {
//     return res.status(401).json({
//       error: 'Unauthorized',
//       message: 'Authentication required'
//     });
//   }

//   // Simplified auth check - in a real app, validate tokens properly
//   if (!authHeader.startsWith('Bearer ')) {
//     return res.status(401).json({
//       error: 'Unauthorized',
//       message: 'Invalid authentication format'
//     });
//   }

//   // Extract and validate token (simplified)
//   const token = authHeader.split(' ')[1];

//   try {
//     // In a real app, verify the token and extract user info
//     // For now, we'll just assume it's valid if it exists
//     if (!token) {
//       throw new Error('Invalid token');
//     }

//     // Attach user info to request for downstream use
//     (req as any).user = {
//       id: 'user-123', // Would come from token verification
//       role: 'user'
//     };

//     next();
//   } catch (error) {
//     return res.status(401).json({
//       error: 'Unauthorized',
//       message: 'Invalid authentication token'
//     });
//   }
// }
export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Missing or invalid Authorization header",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    // TODO: Replace this block with actual JWT validation logic
    // e.g., using jsonwebtoken.verify()
    if (!token || token === "invalid") {
      throw new Error("Invalid token");
    }

    // Simulate user extraction from a valid token
    (req as any).user = {
      id: "user-123",
      email: "user@example.com",
      role: "user",
    };

    next();
  } catch (err) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Invalid or expired token",
    });
  }
}

/**
 * Middleware for handling unknown routes
 */
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: "Not Found",
    message: `Route ${req.originalUrl} not found`,
  });
}

export function applyRateLimit(req: Request, res: Response, next: NextFunction) {
  const key = req.ip;

  limiter
    .consume(key)
    .then(() => {
      next();
    })
    .catch(() => {
      res.status(429).json({
        error: "Too Many Requests",
        message: "You have exceeded the request limit. Please try again later.",
      });
    });
}

/**
 * Middleware to validate JWT tokens
 * Note: This is a simplified implementation - in a real app, use a proper JWT library
 */
export function validateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
    });
  }

  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid authentication format',
    });
  }

  const token = authHeader.split(' ')[1];

  // In a real app, verify the token using a JWT library
  // This is a placeholder implementation
  if (!token || token === 'invalid') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid authentication token',
    });
  }

  // Attach user info to request for downstream use
  (req as any).user = {
    id: 'user-123', // Would come from token verification
    role: 'user',
  };

  next();
}

/**
 * Middleware to validate request origin
 */
export function validateOrigin(allowedOrigins: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const origin = req.get('origin');

    if (!origin) {
      return next();
    }

    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      return next();
    }

    return res.status(403).json({
      error: 'Forbidden',
      message: 'Origin not allowed',
    });
  };
}

/**
 * Middleware to sanitize request inputs
 */
export function sanitizeInputs(req: Request, res: Response, next: NextFunction) {
  // Basic sanitation for request body
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        // Sanitize strings by removing script tags
        req.body[key] = req.body[key].replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      }
    });
  }

  next();
}


/**
 * Detect and redact PII in text
 * @param text The text to scan for PII
 * @returns The text with PII redacted
 */
export function redactPII(text: string): string {
  // Redact email addresses
  text = text.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL REDACTED]');

  // Redact phone numbers (various formats)
  text = text.replace(/(\+\d{1,3}[- ]?)?\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4}/g, '[PHONE REDACTED]');

  // Redact credit card numbers
  text = text.replace(/\b(?:\d{4}[ -]?){3}\d{4}\b/g, '[CREDIT CARD REDACTED]');

  // Redact Social Security Numbers (US)
  text = text.replace(/\b\d{3}[-]?\d{2}[-]?\d{4}\b/g, '[SSN REDACTED]');

  return text;
}