
// Comprehensive input validation utilities
import { z } from 'zod';

// Email validation schema
export const emailSchema = z.string()
  .email('Invalid email format')
  .min(5, 'Email must be at least 5 characters')
  .max(254, 'Email must be less than 254 characters');

// Password validation schema
export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be less than 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

// Device ID validation
export const deviceIdSchema = z.string()
  .min(3, 'Device ID must be at least 3 characters')
  .max(50, 'Device ID must be less than 50 characters')
  .regex(/^[A-Za-z0-9_-]+$/, 'Device ID can only contain letters, numbers, hyphens, and underscores');

// Vehicle name validation
export const vehicleNameSchema = z.string()
  .min(2, 'Vehicle name must be at least 2 characters')
  .max(100, 'Vehicle name must be less than 100 characters')
  .regex(/^[A-Za-z0-9\s_-]+$/, 'Vehicle name can only contain letters, numbers, spaces, hyphens, and underscores');

// Coordinates validation
export const coordinatesSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180)
});

// Generic sanitization function
export const sanitizeInput = (input: string): string => {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .slice(0, 1000); // Limit length
};

// Rate limiting helper
export class RateLimiter {
  private static requests = new Map<string, number[]>();
  private static readonly WINDOW_MS = 60 * 1000; // 1 minute
  private static readonly MAX_REQUESTS = 10; // requests per window

  static isRateLimited(identifier: string): boolean {
    const now = Date.now();
    const windowStart = now - this.WINDOW_MS;
    
    if (!this.requests.has(identifier)) {
      this.requests.set(identifier, []);
    }
    
    const userRequests = this.requests.get(identifier)!;
    
    // Remove old requests outside the window
    const validRequests = userRequests.filter(time => time > windowStart);
    
    if (validRequests.length >= this.MAX_REQUESTS) {
      return true; // Rate limited
    }
    
    // Add current request
    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    
    return false;
  }
}

// Input validation middleware for edge functions
export const validateEdgeFunctionInput = (schema: z.ZodSchema, data: any) => {
  try {
    return {
      success: true,
      data: schema.parse(data)
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
      };
    }
    return {
      success: false,
      error: 'Validation failed'
    };
  }
};
