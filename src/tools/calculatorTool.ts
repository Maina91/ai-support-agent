import { z } from 'zod';
import { Tool, ToolResult } from './types.js';

/**
 * Tool for performing calculations
 */
export class CalculatorTool implements Tool {
  name = 'calculator';
  description = 'Performs mathematical calculations';
  
  schema = z.object({
    expression: z.string().min(1, 'Expression cannot be empty'),
  });
  
  async execute(params: Record<string, any>): Promise<ToolResult> {
    try {
      // Validate parameters
      const validatedParams = this.schema.parse(params);
      
      // Sanitize the expression to prevent code injection
      // Only allow basic math operations and numbers
      const sanitizedExpression = this.sanitizeExpression(validatedParams.expression);
      
      // Evaluate the expression
      // Using Function constructor is not safe for user input without sanitization
      const result = Function('"use strict"; return (' + sanitizedExpression + ')')();
      
      return {
        success: true,
        result: String(result),
        metadata: {
          expression: validatedParams.expression,
          sanitizedExpression,
        },
      };
    } catch (error) {
      return {
        success: false,
        result: 'Failed to calculate expression',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
  
  /**
   * Sanitizes a mathematical expression to prevent code injection
   */
  private sanitizeExpression(expression: string): string {
    // Remove all characters except numbers, operators, parentheses, and decimal points
    const sanitized = expression.replace(/[^0-9+\-*/().]/g, '');
    
    // Check if the expression contains valid mathematical operations
    if (!/^[0-9+\-*/().]+$/.test(sanitized)) {
      throw new Error('Expression contains invalid characters');
    }
    
    return sanitized;
  }
}