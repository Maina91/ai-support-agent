import { CalculatorTool } from './calculatorTool.js';
import { EmailTool } from './emailTool.js';
import { SupabaseTool } from './supabaseTool.js';
import { Tool, ToolFactory } from './types.js';
import config from '../config/index.js';

/**
 * Implementation of the ToolFactory interface
 */
class ToolFactoryImpl implements ToolFactory {
  private tools: Map<string, Tool> = new Map();
  
  constructor() {
    // Register built-in tools
    this.registerTool(new CalculatorTool());
    
    // Register tools that require configuration
    if (config.email.smtp.host && config.email.smtp.user) {
      this.registerTool(new EmailTool());
    }
    
    if (config.supabase.url && config.supabase.apiKey) {
      this.registerTool(new SupabaseTool());
    }
  }
  
  /**
   * Registers a tool with the factory
   */
  registerTool(tool: Tool): void {
    this.tools.set(tool.name, tool);
  }
  
  /**
   * Creates a new instance of the specified tool
   */
  createTool(name: string): Tool | undefined {
    return this.tools.get(name);
  }
  
  /**
   * Gets all available tools
   */
  getAllTools(): Tool[] {
    return Array.from(this.tools.values());
  }
}

// Export factory instance for use throughout the application
export const toolFactory = new ToolFactoryImpl();

// Re-export types
export * from './types.js';