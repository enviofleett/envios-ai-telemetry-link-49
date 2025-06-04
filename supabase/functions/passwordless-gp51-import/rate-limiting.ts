
// Simple in-memory rate limiter as fallback
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export const rateLimit = {
  check: async (identifier: string) => {
    const now = Date.now();
    const windowMs = 1000; // 1 second window
    const maxRequests = 10; // 10 requests per second
    
    const key = `rate_limit_${identifier}`;
    const current = requestCounts.get(key);
    
    // Clean up expired entries
    if (current && now > current.resetTime) {
      requestCounts.delete(key);
    }
    
    const entry = requestCounts.get(key) || { count: 0, resetTime: now + windowMs };
    
    if (entry.count >= maxRequests) {
      return {
        success: false,
        limit: maxRequests,
        remaining: 0,
        reset: new Date(entry.resetTime)
      };
    }
    
    entry.count++;
    requestCounts.set(key, entry);
    
    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests - entry.count,
      reset: new Date(entry.resetTime)
    };
  }
};
