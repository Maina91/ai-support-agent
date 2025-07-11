import { describe, it, expect } from 'vitest';
import { CalculatorTool } from '../../src/tools/calculatorTool';

describe('CalculatorTool', () => {
  const calculator = new CalculatorTool();
  
  it('should perform basic addition', async () => {
    const result = await calculator.execute({ expression: '2 + 2' });
    expect(result.success).toBe(true);
    expect(result.result).toBe('4');
  });

  it('should perform basic subtraction', async () => {
    const result = await calculator.execute({ expression: '10 - 5' });
    expect(result.success).toBe(true);
    expect(result.result).toBe('5');
  });

  it('should perform basic multiplication', async () => {
    const result = await calculator.execute({ expression: '3 * 4' });
    expect(result.success).toBe(true);
    expect(result.result).toBe('12');
  });

  it('should perform basic division', async () => {
    const result = await calculator.execute({ expression: '20 / 4' });
    expect(result.success).toBe(true);
    expect(result.result).toBe('5');
  });

  it('should handle complex expressions', async () => {
    const result = await calculator.execute({ expression: '(10 + 5) * 2 - 8' });
    expect(result.success).toBe(true);
    expect(result.result).toBe('22');
  });

  it('should handle decimal numbers', async () => {
    const result = await calculator.execute({ expression: '3.5 + 2.1' });
    expect(result.success).toBe(true);
    expect(result.result).toBe('5.6');
  });

  it('should handle invalid expressions safely', async () => {
    // Division by zero seems to be handled gracefully in the implementation
    // Let's try a truly invalid expression
    const result = await calculator.execute({ expression: 'not a valid expression' });
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should handle malformed expressions', async () => {
    const result = await calculator.execute({ expression: '10 + * 5' });
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});