
import { supabase } from '@/integrations/supabase/client';

export interface RateLimitConfig {
  endpoint: string;
  maxRequests: number;
  windowSeconds: number;
  skipForRoles?: string[];
}

export interface RateLimitResult {
  allowed: boolean;
  remainingRequests: number;
  resetTime: Date;
  retryAfter?: number;
}

export class RateLimitService {
  private static readonly DEFAULT_CONFIGS: Record<string, RateLimitConfig> = {
    'workshop-search': {
      endpoint: '/api/workshops/search',
      maxRequests: 30,
      windowSeconds: 60,
      skipForRoles: ['admin']
    },
    'workshop-connect': {
      endpoint: '/api/workshops/connect',
      maxRequests: 5,
      windowSeconds: 300, // 5 minutes
      skipForRoles: ['admin']
    },
    'workshop-appointments': {
      endpoint: '/api/workshops/appointments',
      maxRequests: 20,
      windowSeconds: 60,
      skipForRoles: ['admin']
    },
    'maintenance-stats': {
      endpoint: '/api/maintenance/stats',
      maxRequests: 60,
      windowSeconds: 60,
      skipForRoles: ['admin']
    },
    'gp51-polling': {
      endpoint: '/api/gp51/poll',
      maxRequests: 120,
      windowSeconds: 60,
      skipForRoles: ['admin']
    }
  };

  static async checkRateLimit(
    identifier: string,
    endpointKey: string,
    userRole?: string
  ): Promise<RateLimitResult> {
    const config = this.DEFAULT_CONFIGS[endpointKey];
    
    if (!config) {
      throw new Error(`Unknown endpoint: ${endpointKey}`);
    }

    // Skip rate limiting for privileged roles
    if (userRole && config.skipForRoles?.includes(userRole)) {
      return {
        allowed: true,
        remainingRequests: config.maxRequests,
        resetTime: new Date(Date.now() + config.windowSeconds * 1000)
      };
    }

    try {
      // Use database function for rate limiting
      const { data, error } = await supabase.rpc('check_rate_limit', {
        p_identifier: identifier,
        p_endpoint: config.endpoint,
        p_max_requests: config.maxRequests,
        p_window_seconds: config.windowSeconds
      });

      if (error) {
        console.error('Rate limit check failed:', error);
        // Fail open - allow request if we can't check
        return {
          allowed: true,
          remainingRequests: config.maxRequests,
          resetTime: new Date(Date.now() + config.windowSeconds * 1000)
        };
      }

      const allowed = data as boolean;
      
      if (!allowed) {
        // Get current count for remaining calculations
        const { data: rateLimitData } = await supabase
          .from('api_rate_limits')
          .select('request_count, window_start, block_expires_at')
          .eq('identifier', identifier)
          .eq('endpoint', config.endpoint)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        const remainingRequests = Math.max(0, config.maxRequests - (rateLimitData?.request_count || 0));
        const resetTime = rateLimitData?.block_expires_at ? 
          new Date(rateLimitData.block_expires_at) : 
          new Date(Date.now() + config.windowSeconds * 1000);
        
        return {
          allowed: false,
          remainingRequests,
          resetTime,
          retryAfter: Math.ceil((resetTime.getTime() - Date.now()) / 1000)
        };
      }

      // Calculate remaining requests for successful case
      const { data: currentData } = await supabase
        .from('api_rate_limits')
        .select('request_count')
        .eq('identifier', identifier)
        .eq('endpoint', config.endpoint)
        .single();

      const usedRequests = currentData?.request_count || 0;
      const remainingRequests = Math.max(0, config.maxRequests - usedRequests);

      return {
        allowed: true,
        remainingRequests,
        resetTime: new Date(Date.now() + config.windowSeconds * 1000)
      };

    } catch (error) {
      console.error('Rate limiting error:', error);
      // Fail open
      return {
        allowed: true,
        remainingRequests: config.maxRequests,
        resetTime: new Date(Date.now() + config.windowSeconds * 1000)
      };
    }
  }

  static async logRateLimitViolation(
    identifier: string,
    endpoint: string,
    additionalData?: Record<string, any>
  ): Promise<void> {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      
      await supabase.rpc('log_security_event', {
        p_user_id: user?.id || null,
        p_action_type: 'api_access',
        p_resource_type: 'rate_limit',
        p_resource_id: endpoint,
        p_request_details: {
          identifier,
          endpoint,
          violation: true,
          ...additionalData
        },
        p_risk_level: 'medium',
        p_success: false
      });
    } catch (error) {
      console.error('Failed to log rate limit violation:', error);
    }
  }

  // Middleware-like function for API calls
  static async withRateLimit<T>(
    identifier: string,
    endpointKey: string,
    apiCall: () => Promise<T>,
    userRole?: string
  ): Promise<T> {
    const rateLimitResult = await this.checkRateLimit(identifier, endpointKey, userRole);

    if (!rateLimitResult.allowed) {
      await this.logRateLimitViolation(identifier, endpointKey, {
        remainingRequests: rateLimitResult.remainingRequests,
        retryAfter: rateLimitResult.retryAfter
      });

      const error = new Error('Rate limit exceeded');
      (error as any).status = 429;
      (error as any).retryAfter = rateLimitResult.retryAfter;
      throw error;
    }

    return apiCall();
  }

  // Get rate limit status for display
  static async getRateLimitStatus(
    identifier: string,
    endpointKey: string
  ): Promise<RateLimitResult | null> {
    const config = this.DEFAULT_CONFIGS[endpointKey];
    if (!config) return null;

    try {
      const { data } = await supabase
        .from('api_rate_limits')
        .select('request_count, window_start, is_blocked, block_expires_at')
        .eq('identifier', identifier)
        .eq('endpoint', config.endpoint)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!data) {
        return {
          allowed: true,
          remainingRequests: config.maxRequests,
          resetTime: new Date(Date.now() + config.windowSeconds * 1000)
        };
      }

      const remainingRequests = Math.max(0, config.maxRequests - data.request_count);
      const resetTime = data.block_expires_at ? 
        new Date(data.block_expires_at) : 
        new Date(Date.now() + config.windowSeconds * 1000);

      return {
        allowed: !data.is_blocked,
        remainingRequests,
        resetTime,
        retryAfter: data.is_blocked ? 
          Math.ceil((resetTime.getTime() - Date.now()) / 1000) : 
          undefined
      };

    } catch (error) {
      console.error('Failed to get rate limit status:', error);
      return null;
    }
  }
}
