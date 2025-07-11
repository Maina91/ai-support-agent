import config from '../config/index.js';
import { SupabaseMemoryManager } from './supabaseMemory.js';
import { InMemoryManager } from './inMemoryManager.js';
import { MemoryManager, FeedbackManager } from './types.js';

/**
 * Factory function to create the appropriate memory manager based on configuration
 */
export function createMemoryManager(): MemoryManager & FeedbackManager {
  // Check if Supabase is configured
  const hasSupabaseConfig = !!(config.supabase.url && config.supabase.apiKey);
  
  if (hasSupabaseConfig) {
    console.log('Using Supabase memory manager');
    return new SupabaseMemoryManager();
  } else {
    console.log('Using in-memory manager (data will be lost on restart)');
    return new InMemoryManager();
  }
}

// Export memory manager instance for use throughout the application
export const memoryManager = createMemoryManager();

// Re-export types
export * from './types.js';