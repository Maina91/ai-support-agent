import { z } from 'zod';

/**
 * Base interface for all tools
 */
export interface Tool {
  /**
   * Unique name of the tool
   */
  name: string;
  
  /**
   * Human-readable description of what the tool does
   */
  description: string;
  
  /**
   * Zod schema for validating input parameters
   */
  schema: z.ZodObject<any>;
  
  /**
   * Execute the tool with the provided parameters
   */
  execute(params: Record<string, any>): Promise<ToolResult>;
}

/**
 * Result returned by a tool execution
 */
export interface ToolResult {
  /**
   * Whether the tool execution was successful
   */
  success: boolean;
  
  /**
   * The result of the tool execution
   */
  result: string | Record<string, any>;
  
  /**
   * Optional error message if the tool execution failed
   */
  error?: string;
  
  /**
   * Optional metadata about the tool execution
   */
  metadata?: Record<string, any>;
}

/**
 * Tool factory for creating tool instances
 */
export interface ToolFactory {
  /**
   * Creates a new instance of the specified tool
   */
  createTool(name: string): Tool | undefined;
  
  /**
   * Gets all available tools
   */
  getAllTools(): Tool[];
}