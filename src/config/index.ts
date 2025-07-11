import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env file
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define configuration schema with Zod
const configSchema = z.object({
  // OpenAI
  openai: z.object({
    apiKey: z.string().min(1, "OpenAI API key is required"),
    model: z.string().default("gpt-4o"),
    temperature: z.number().min(0).max(1).default(0.2),
    streamMode: z.boolean().default(true),
  }),

  // Supabase (for vector store)
  supabase: z.object({
    url: z.string().url("Supabase URL must be a valid URL"),
    apiKey: z.string().min(1, "Supabase API key is required"),
    embeddings: z.object({
      table: z.string().default("embeddings"),
      namespace: z.string().default("ai_support_agent"),
      model: z.string().default("intfloat/e5-large-v2"),
    }),
  }),

  // Redis (for state management)
  redis: z.object({
    url: z.string().url("Redis URL must be a valid URL"),
    ttl: z.number().int().positive().default(60 * 60 * 24), // 24 hours in seconds
  }),

  // Email (for notifications)
  email: z.object({
    smtp: z.object({
      host: z.string().min(1, "SMTP host is required"),
      port: z.number().int().positive().default(587),
      secure: z.boolean().default(false),
      user: z.string().min(1, "SMTP user is required"),
      pass: z.string().min(1, "SMTP password is required"),
    }),
    from: z.string().email("From email must be a valid email address"),
  }),

  // Server
  server: z.object({
    port: z.coerce.number().int().positive().default(3000),
    env: z.enum(["development", "test", "production"]).default("development"),
    apiPrefix: z.string().default("/api"),
  }),

  // Agent
  agent: z.object({
    memory: z.object({
      shortTerm: z.object({
        maxSize: z.number().int().positive().default(10),
      }),
      longTerm: z.object({
        similarityThreshold: z.number().min(0).max(1).default(0.75),
        maxResults: z.number().int().positive().default(5),
      }),
    }),
    feedback: z.object({
      confidenceThreshold: z.number().min(0).max(1).default(0.7),
    }),
    humanHandoff: z.object({
      // New configuration section for human handoff
      enabled: z.boolean().default(true),
      sentimentThreshold: z.number().min(0).max(1).default(0.3), // Low sentiment triggers handoff
      sensitiveTopics: z.array(z.string()).default([
        "billing dispute", 
        "refund request", 
        "account cancellation", 
        "legal", 
        "security breach",
        "data privacy",
        "complaint"
      ]),
      notifications: z.object({
        email: z.boolean().default(false),
        slack: z.boolean().default(false),
      }),
      waitTimeMessage: z.string().default("A support agent will be with you shortly. The current estimated wait time is {wait_time} minutes."),
      defaultWaitTime: z.number().int().min(1).default(5), // in minutes
    }),
  }),

  // Security
  security: z.object({
    rateLimiting: z.object({
      maxRequests: z.number().int().positive().default(100),
      windowMs: z.number().int().positive().default(15 * 60 * 1000), // 15 minutes in milliseconds
    }),
  }),
});

// Parse environment variables
const config = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4o',
    temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.2'),
    streamMode: process.env.OPENAI_STREAM_MODE === 'true',
  },
  supabase: {
    url: process.env.SUPABASE_URL || '',
    apiKey: process.env.SUPABASE_API_KEY || '',
    embeddings: {
      table: process.env.SUPABASE_EMBEDDINGS_TABLE || 'embeddings',
      namespace: process.env.SUPABASE_EMBEDDINGS_NAMESPACE || 'ai_support_agent',
      model: process.env.EMBEDDING_MODEL || 'intfloat/e5-large-v2',
    },
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    ttl: parseInt(process.env.REDIS_TTL || '86400', 10),
  },
  email: {
    smtp: {
      host: process.env.SMTP_HOST || '',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
    from: process.env.EMAIL_FROM || 'ai-support@example.com',
  },
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    env: (process.env.NODE_ENV || 'development') as 'development' | 'test' | 'production',
    apiPrefix: process.env.API_PREFIX || '/api',
  },
  agent: {
    memory: {
      shortTerm: {
        maxSize: parseInt(process.env.SHORT_TERM_MEMORY_MAX_SIZE || '10', 10),
      },
      longTerm: {
        similarityThreshold: parseFloat(process.env.LONG_TERM_MEMORY_SIMILARITY_THRESHOLD || '0.75'),
        maxResults: parseInt(process.env.LONG_TERM_MEMORY_MAX_RESULTS || '5', 10),
      },
    },
    feedback: {
      confidenceThreshold: parseFloat(process.env.CONFIDENCE_THRESHOLD || '0.7'),
    },
    humanHandoff: {
      enabled: process.env.HUMAN_HANDOFF_ENABLED !== 'false',
      sentimentThreshold: parseFloat(process.env.SENTIMENT_THRESHOLD || '0.3'),
      sensitiveTopics: process.env.SENSITIVE_TOPICS ? 
        process.env.SENSITIVE_TOPICS.split(',') : 
        ["billing dispute", "refund request", "account cancellation", "legal", "security breach", "data privacy", "complaint"],
      notifications: {
        email: process.env.NOTIFICATION_EMAIL === 'true',
        slack: process.env.NOTIFICATION_SLACK === 'true',
      },
      waitTimeMessage: process.env.WAIT_TIME_MESSAGE || "A support agent will be with you shortly. The current estimated wait time is {wait_time} minutes.",
      defaultWaitTime: parseInt(process.env.DEFAULT_WAIT_TIME || '5', 10),
    },
  },
  security: {
    rateLimiting: {
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    },
  },
  paths: {
    root: path.resolve(__dirname, '../..'),
  },
};

// Validate configuration
try {
  configSchema.parse(config);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error("Configuration validation failed:");
    error.errors.forEach(err => {
      console.error(`- ${err.path.join('.')}: ${err.message}`);
    });
    process.exit(1);
  }
  throw error;
}

export default config;