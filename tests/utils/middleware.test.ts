import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  rateLimiterMiddleware,
  notFoundHandler,
  errorHandler 
} from '../../src/utils/middleware';
import { z } from 'zod';
import { Request, Response } from 'express';

const validateSchema = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: () => void) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          errors: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message,
          }))
        });
      } else {
        next();
      }
    }
  };
};

describe('Middleware', () => {
  describe('rateLimiterMiddleware', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockNext: vi.Mock;
    
    beforeEach(() => {
      mockReq = {
        ip: '127.0.0.1',
        path: '/test',
      };
      mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
        setHeader: vi.fn(),
      };
      mockNext = vi.fn();
    });
    
    it('should call next if request is not rate limited', async () => {
      await rateLimiterMiddleware(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    // In a real test, we would need to simulate rate limiting
    // but this is complex as it depends on Redis or other store
    // For now, we just ensure the function structure works
  });
  
  describe('validateSchema', () => {
    const schema = z.object({
      name: z.string(),
      age: z.number().min(18),
    });
    
    const validator = validateSchema(schema);
    
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockNext: vi.Mock;
    
    beforeEach(() => {
      mockReq = {
        body: {},
      };
      mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
      };
      mockNext = vi.fn();
    });
    
    it('should call next if validation passes', () => {
      mockReq.body = { name: 'John', age: 25 };
      
      validator(mockReq as Request, mockRes as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
    
    it('should return 400 if validation fails', () => {
      mockReq.body = { name: 'John', age: 16 };
      
      validator(mockReq as Request, mockRes as Response, mockNext);
      
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        errors: expect.arrayContaining([
          expect.objectContaining({ message: expect.stringContaining('age') })
        ])
      }));
    });
  });
  
  describe('notFoundHandler', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    
    beforeEach(() => {
      mockReq = {
        path: '/nonexistent',
      };
      mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
      };
    });
    
    it('should return 404 with appropriate message', () => {
      notFoundHandler(mockReq as Request, mockRes as Response);
      
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Not Found',
        message: expect.stringContaining('/nonexistent'),
      });
    });
  });
  
  describe('errorHandler', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockNext: vi.Mock;
    let mockError: Error;
    
    beforeEach(() => {
      mockReq = {};
      mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
      };
      mockNext = vi.fn();
      mockError = new Error('Test error');
    });
    
    it('should handle errors and return 500', () => {
      errorHandler(mockError, mockReq as Request, mockRes as Response, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      });
    });
  });
});