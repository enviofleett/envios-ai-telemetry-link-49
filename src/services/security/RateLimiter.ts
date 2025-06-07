
import { SecurityService } from './SecurityService';

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (identifier: string, context: RateLimitContext) => string;
}

export interface RateLimitContext {
  endpoint: string;
  method: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  userRole?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: Date;
  retryAfter?: number;
}

export class RateLimiter {
  private static rateLimitStore = new Map<string, { count: number; resetTime: number }>();
  private static cleanupInterval: NodeJS.Timeout | null = null;

  // Different rate limit tiers
  private static readonly RATE_LIMITS: Record<string, RateLimitConfig> = {
    // IP-based limits
    'ip:default': {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100
    },
    'ip:auth': {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5 // Stricter for auth endpoints
    },
    
    // User-based limits
    'user:default': {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 60
    },
    'user:gp51_api': {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 30 // GP51 API specific limit
    },
    
    // Endpoint-specific limits
    'endpoint:gp51_login': {
      windowMs: 5 * 60 * 1000, // 5 minutes
      maxRequests: 3 // Very strict for login attempts
    },
    'endpoint:gp51_data': {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 20
    },
    
    // Role-based limits
    'role:admin': {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 120 // Higher limits for admins
    },
    'role:user': {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 30
    },
    'role:viewer': {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 15 // Lower limits for viewers
    }
  };

  static initialize(): void {
    // Start cleanup interval to remove expired entries
    if (!this.cleanupInterval) {
      this.cleanupInterval = setInterval(() => {
        this.cleanup();
      }, 5 * 60 * 1000); // Clean up every 5 minutes
    }
  }

  static shutdown(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  static async checkRateLimit(
    identifier: string,
    limitType: string,
    context: RateLimitContext
  ): Promise<RateLimitResult> {
    const config = this.RATE_LIMITS[limitType];
    
    if (!config) {
      console.warn(`Unknown rate limit type: ${limitType}`);
      return {
        allowed: true,
        limit: 0,
        remaining: 0,
        resetTime: new Date(Date.now() + 60000)
      };
    }

    const key = config.keyGenerator ? 
      config.keyGenerator(identifier, context) : 
      `${limitType}:${identifier}`;

    const now = Date.now();
    const resetTime = now + config.windowMs;
    
    // Get current count
    const current = this.rateLimitStore.get(key);
    
    if (!current || current.resetTime <= now) {
      // First request or window expired
      this.rateLimitStore.set(key, { count: 1, resetTime });
      
      return {
        allowed: true,
        limit: config.maxRequests,
        remaining: config.maxRequests - 1,
        resetTime: new Date(resetTime)
      };
    }

    // Check if limit exceeded
    if (current.count >= config.maxRequests) {
      const retryAfter = Math.ceil((current.resetTime - now) / 1000);
      
      // Log rate limit exceeded
      SecurityService.logSecurityEvent({
        type: 'rate_limit',
        severity: this.getSeverityForLimitType(limitType),
        description: `Rate limit exceeded for ${limitType}`,
        userId: context.userId,
        ipAddress: context.ipAddress,
        additionalData: {
          limitType,
          identifier,
          endpoint: context.endpoint,
          currentCount: current.count,
          limit: config.maxRequests,
          retryAfter
        }
      });

      return {
        allowed: false,
        limit: config.maxRequests,
        remaining: 0,
        resetTime: new Date(current.resetTime),
        retryAfter
      };
    }

    // Increment count
    current.count++;
    this.rateLimitStore.set(key, current);

    return {
      allowed: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - current.count,
      resetTime: new Date(current.resetTime)
    };
  }

  // Multi-tier rate limiting check
  static async checkMultiTierRateLimit(context: RateLimitContext): Promise<{
    allowed: boolean;
    failedChecks: Array<{ type: string; result: RateLimitResult }>;
    headers: Record<string, string>;
  }> {
    const checks = [];
    const failedChecks: Array<{ type: string; result: RateLimitResult }> = [];
    const headers: Record<string, string> = {};

    // IP-based check
    if (context.ipAddress) {
      const ipType = context.endpoint.includes('auth') ? 'ip:auth' : 'ip:default';
      const ipResult = await this.checkRateLimit(context.ipAddress, ipType, context);
      checks.push({ type: ipType, result: ipResult });
      
      if (!ipResult.allowed) {
        failedChecks.push({ type: ipType, result: ipResult });
      }
      
      headers['X-RateLimit-Limit-IP'] = ipResult.limit.toString();
      headers['X-RateLimit-Remaining-IP'] = ipResult.remaining.toString();
      headers['X-RateLimit-Reset-IP'] = Math.ceil(ipResult.resetTime.getTime() / 1000).toString();
    }

    // User-based check
    if (context.userId) {
      const userType = context.endpoint.startsWith('gp51') ? 'user:gp51_api' : 'user:default';
      const userResult = await this.checkRateLimit(context.userId, userType, context);
      checks.push({ type: userType, result: userResult });
      
      if (!userResult.allowed) {
        failedChecks.push({ type: userType, result: userResult });
      }
      
      headers['X-RateLimit-Limit-User'] = userResult.limit.toString();
      headers['X-RateLimit-Remaining-User'] = userResult.remaining.toString();
      headers['X-RateLimit-Reset-User'] = Math.ceil(userResult.resetTime.getTime() / 1000).toString();
    }

    // Endpoint-specific check
    const endpointKey = this.getEndpointKey(context.endpoint);
    if (endpointKey && this.RATE_LIMITS[endpointKey]) {
      const identifier = context.userId || context.ipAddress || 'anonymous';
      const endpointResult = await this.checkRateLimit(identifier, endpointKey, context);
      checks.push({ type: endpointKey, result: endpointResult });
      
      if (!endpointResult.allowed) {
        failedChecks.push({ type: endpointKey, result: endpointResult });
      }
      
      headers['X-RateLimit-Limit-Endpoint'] = endpointResult.limit.toString();
      headers['X-RateLimit-Remaining-Endpoint'] = endpointResult.remaining.toString();
      headers['X-RateLimit-Reset-Endpoint'] = Math.ceil(endpointResult.resetTime.getTime() / 1000).toString();
    }

    // Role-based check
    if (context.userRole) {
      const roleType = `role:${context.userRole}`;
      if (this.RATE_LIMITS[roleType] && context.userId) {
        const roleResult = await this.checkRateLimit(context.userId, roleType, context);
        checks.push({ type: roleType, result: roleResult });
        
        if (!roleResult.allowed) {
          failedChecks.push({ type: roleType, result: roleResult });
        }
        
        headers['X-RateLimit-Limit-Role'] = roleResult.limit.toString();
        headers['X-RateLimit-Remaining-Role'] = roleResult.remaining.toString();
        headers['X-RateLimit-Reset-Role'] = Math.ceil(roleResult.resetTime.getTime() / 1000).toString();
      }
    }

    // If any check failed, request is not allowed
    const allowed = failedChecks.length === 0;

    // Add retry-after header if blocked
    if (!allowed) {
      const shortestRetryAfter = Math.min(
        ...failedChecks.map(check => check.result.retryAfter || 60)
      );
      headers['Retry-After'] = shortestRetryAfter.toString();
    }

    return {
      allowed,
      failedChecks,
      headers
    };
  }

  // Adaptive rate limiting based on system health
  static async checkAdaptiveRateLimit(
    identifier: string,
    baseType: string,
    context: RateLimitContext,
    systemHealth?: { cpu: number; memory: number; responseTime: number }
  ): Promise<RateLimitResult> {
    let config = { ...this.RATE_LIMITS[baseType] };
    
    if (!config) {
      return this.checkRateLimit(identifier, baseType, context);
    }

    // Adjust limits based on system health
    if (systemHealth) {
      let multiplier = 1.0;
      
      // Reduce limits if CPU is high
      if (systemHealth.cpu > 80) {
        multiplier *= 0.5;
      } else if (systemHealth.cpu > 60) {
        multiplier *= 0.7;
      }
      
      // Reduce limits if memory is high
      if (systemHealth.memory > 85) {
        multiplier *= 0.5;
      } else if (systemHealth.memory > 70) {
        multiplier *= 0.8;
      }
      
      // Reduce limits if response time is high
      if (systemHealth.responseTime > 2000) {
        multiplier *= 0.6;
      } else if (systemHealth.responseTime > 1000) {
        multiplier *= 0.8;
      }
      
      config.maxRequests = Math.floor(config.maxRequests * multiplier);
      
      if (multiplier < 1.0) {
        SecurityService.logSecurityEvent({
          type: 'rate_limit',
          severity: 'medium',
          description: 'Adaptive rate limiting activated',
          additionalData: {
            baseType,
            originalLimit: this.RATE_LIMITS[baseType].maxRequests,
            adjustedLimit: config.maxRequests,
            multiplier,
            systemHealth
          }
        });
      }
    }

    return this.checkRateLimit(identifier, baseType, context);
  }

  // Get rate limit statistics
  static getRateLimitStats(hours = 24): {
    totalBlocked: number;
    blocksByType: Record<string, number>;
    topBlockedIPs: Array<{ ip: string; count: number }>;
    topBlockedUsers: Array<{ userId: string; count: number }>;
  } {
    const events = SecurityService.getSecurityEvents({
      type: 'rate_limit',
      hours
    });

    const blocksByType: Record<string, number> = {};
    const ipBlocks = new Map<string, number>();
    const userBlocks = new Map<string, number>();

    events.forEach(event => {
      const limitType = event.additionalData?.limitType;
      if (limitType) {
        blocksByType[limitType] = (blocksByType[limitType] || 0) + 1;
      }

      const ip = event.ipAddress;
      if (ip) {
        ipBlocks.set(ip, (ipBlocks.get(ip) || 0) + 1);
      }

      const userId = event.userId;
      if (userId) {
        userBlocks.set(userId, (userBlocks.get(userId) || 0) + 1);
      }
    });

    const topBlockedIPs = Array.from(ipBlocks.entries())
      .map(([ip, count]) => ({ ip, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const topBlockedUsers = Array.from(userBlocks.entries())
      .map(([userId, count]) => ({ userId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalBlocked: events.length,
      blocksByType,
      topBlockedIPs,
      topBlockedUsers
    };
  }

  private static cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, data] of this.rateLimitStore.entries()) {
      if (data.resetTime <= now) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => {
      this.rateLimitStore.delete(key);
    });

    if (keysToDelete.length > 0) {
      console.log(`Rate limiter cleaned up ${keysToDelete.length} expired entries`);
    }
  }

  private static getSeverityForLimitType(limitType: string): 'low' | 'medium' | 'high' | 'critical' {
    if (limitType.includes('auth') || limitType.includes('login')) {
      return 'high';
    }
    if (limitType.includes('ip')) {
      return 'medium';
    }
    return 'low';
  }

  private static getEndpointKey(endpoint: string): string | null {
    const endpointMappings: Record<string, string> = {
      'login': 'endpoint:gp51_login',
      'querymonitorlist': 'endpoint:gp51_data',
      'lastposition': 'endpoint:gp51_data',
      'adduser': 'endpoint:gp51_login',
      'chargedevices': 'endpoint:gp51_data'
    };

    return endpointMappings[endpoint] || null;
  }

  // Dynamic rate limit configuration
  static updateRateLimit(limitType: string, config: Partial<RateLimitConfig>): void {
    if (this.RATE_LIMITS[limitType]) {
      this.RATE_LIMITS[limitType] = { ...this.RATE_LIMITS[limitType], ...config };
      
      SecurityService.logSecurityEvent({
        type: 'authentication',
        severity: 'medium',
        description: `Rate limit configuration updated for ${limitType}`,
        additionalData: { limitType, changes: config }
      });
    }
  }
}

// Initialize on module load
RateLimiter.initialize();
