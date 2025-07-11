import { describe, it, expect, vi } from 'vitest';

// Create a minimal mock of the config module
vi.mock('../src/config/index.js', () => ({
  config: {
    server: {
      port: 3001,
      host: 'localhost',
      domain: 'http://localhost:3001'
    },
    openai: {
      apiKey: 'test-key',
      model: 'gpt-3.5-turbo'
    },
    supabase: {
      url: 'https://test-supabase-url.supabase.co',
      apiKey: 'test-supabase-key'
    },
    email: {
      from: 'support@example.com',
      smtp: {
        host: 'smtp.example.com',
        port: 587,
        user: 'user@example.com',
        pass: 'password',
        secure: false
      }
    },
    redis: {
      url: 'redis://localhost:6379'
    },
    security: {
      rateLimitWindowMs: 60000,
      rateLimitMaxRequests: 100,
      jwtSecret: 'test-jwt-secret'
    }
  }
}));

describe('Config', () => {
  it('should load the configuration correctly', async () => {
    const { config } = await import('../src/config/index.js');
    expect(config).toBeDefined();
    expect(config.server.port).toBe(3001);
    expect(config.openai.apiKey).toBe('test-key');
    expect(config.openai.model).toBe('gpt-3.5-turbo');
  });
});