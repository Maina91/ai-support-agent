import '@testing-library/jest-dom';
import { config } from '../src/config/index.js';
import { vi } from 'vitest';

// Mock process.env for testing
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

// Extend expect with jest-dom matchers
import { expect } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

// Mock for the window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Mock for IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor(private readonly callback: IntersectionObserverCallback) {}
  
  observe() {
    return null;
  }
  
  unobserve() {
    return null;
  }
  
  disconnect() {
    return null;
  }
};

// Mock process.exit to prevent tests from actually exiting
process.exit = vi.fn() as any;