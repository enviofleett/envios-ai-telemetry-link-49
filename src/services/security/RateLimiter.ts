
import { SecurityService } from './SecurityService';

interface RateLimitConfig {
  hours?: number;
  limit?: number;
  windowMs?: number;
  maxRequests?: number;
}

interface SystemHealth {
  cpu: number;
  memory: number;
  responseTime: number;
}

export class RateLimiter {
  private static limits = new Map<string, any>();
  private static securityService = SecurityService;

  static checkLimit(identifier: string, limitType: string = 'default'): boolean {
    const result = this.securityService.checkRateLimit(identifier);
    
    if (!result.allowed) {
      this.securityService.logSecurityEvent({
        type: 'rate_limit',
        severity: 'medium',
        description: 'Rate limit exceeded',
        additionalData: {
          limitType,
          identifier,
          endpoint: 'unknown',
          currentCount: 0,
          limit: 5,
          retryAfter: result.resetTime || 0
        }
      });
    }

    return result.allowed;
  }

  static adjustLimitsBasedOnSystemHealth(systemHealth: SystemHealth): void {
    const baseLimit = 100;
    let multiplier = 1.0;

    // Adjust based on system performance
    if (systemHealth.cpu > 80 || systemHealth.memory > 80) {
      multiplier = 0.5; // Reduce limits when system is stressed
    } else if (systemHealth.responseTime > 1000) {
      multiplier = 0.7;
    }

    const adjustedLimit = Math.floor(baseLimit * multiplier);

    this.securityService.logSecurityEvent({
      type: 'rate_limit',
      severity: 'medium',
      description: 'Rate limits adjusted based on system health',
      additionalData: {
        baseType: 'system_health',
        originalLimit: baseLimit,
        adjustedLimit,
        multiplier,
        systemHealth
      }
    });
  }

  static getConfiguration(limitType: string): RateLimitConfig {
    // Create separate configuration object - no 'type' property here
    const config: RateLimitConfig = {
      hours: 1,
      limit: 100,
      windowMs: 3600000,
      maxRequests: 100
    };

    return config;
  }

  static updateConfiguration(limitType: string, changes: Partial<RateLimitConfig>): void {
    this.securityService.logSecurityEvent({
      type: 'authentication', // This is for authentication/authorization of config changes
      severity: 'medium',
      description: 'Rate limit configuration updated',
      additionalData: {
        limitType,
        changes
      }
    });
  }
}
