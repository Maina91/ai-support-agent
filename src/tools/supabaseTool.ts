import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { Tool, ToolResult } from './types.js';
import config from '../config/index.js';

/**
 * Tool for querying Supabase database
 */
export class SupabaseTool implements Tool {
  name = 'query_database';
  description = 'Queries the database for information';
  
  schema = z.object({
    query: z.string().min(1, 'Query cannot be empty'),
    table: z.string().min(1, 'Table name is required'),
    filters: z.record(z.string(), z.any()).optional(),
    limit: z.number().int().positive().optional(),
  });
  
  private supabase;
  
  constructor() {
    this.supabase = createClient(
      config.supabase.url,
      config.supabase.apiKey
    );
  }
  
  async execute(params: Record<string, any>): Promise<ToolResult> {
    try {
      // Validate parameters
      const validatedParams = this.schema.parse(params);
      
      // Start query builder
      let query = this.supabase
        .from(validatedParams.table)
        .select(validatedParams.query);
      
      // Apply filters if provided
      if (validatedParams.filters) {
        Object.entries(validatedParams.filters).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }
      
      // Apply limit if provided
      if (validatedParams.limit) {
        query = query.limit(validatedParams.limit);
      }
      
      // Execute query
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      return {
        success: true,
        result: data,
        metadata: {
          table: validatedParams.table,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('Error querying database:', error);
      
      return {
        success: false,
        result: 'Failed to query database',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}