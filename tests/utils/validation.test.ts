import { describe, it, expect } from 'vitest';
import { z } from 'zod';

describe('Validation Functions', () => {
  it('should validate data with Zod schemas', () => {
    // Create a simple schema
    const userSchema = z.object({
      name: z.string(),
      email: z.string().email(),
      age: z.number().min(18),
    });
    
    // Valid data should parse correctly
    const validData = { name: 'John Doe', email: 'john@example.com', age: 30 };
    const result = userSchema.safeParse(validData);
    
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validData);
    }
    
    // Invalid data should fail validation
    const invalidData = { name: 'John Doe', email: 'not-an-email', age: 16 };
    const invalidResult = userSchema.safeParse(invalidData);
    
    expect(invalidResult.success).toBe(false);
    if (!invalidResult.success) {
      expect(invalidResult.error.errors.length).toBeGreaterThan(0);
      expect(invalidResult.error.errors[0].path.includes('email') || 
             invalidResult.error.errors[0].path.includes('age')).toBe(true);
    }
  });
});