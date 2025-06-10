
import { useState, useEffect } from 'react';
import { RateLimitService, RateLimitResult } from '@/services/rateLimiting/RateLimitService';
import { useAuth } from '@/contexts/AuthContext';

export const useRateLimit = (endpointKey: string) => {
  const { user } = useAuth();
  const [rateLimitStatus, setRateLimitStatus] = useState<RateLimitResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const identifier = user?.id || `anonymous-${navigator.userAgent.slice(0, 20)}`;

  useEffect(() => {
    const fetchStatus = async () => {
      const status = await RateLimitService.getRateLimitStatus(identifier, endpointKey);
      setRateLimitStatus(status);
    };

    fetchStatus();
  }, [identifier, endpointKey]);

  const executeWithRateLimit = async <T,>(
    apiCall: () => Promise<T>,
    userRole?: string
  ): Promise<T> => {
    setIsLoading(true);
    try {
      const result = await RateLimitService.withRateLimit(
        identifier,
        endpointKey,
        apiCall,
        userRole
      );
      
      // Refresh status after successful call
      const newStatus = await RateLimitService.getRateLimitStatus(identifier, endpointKey);
      setRateLimitStatus(newStatus);
      
      return result;
    } catch (error) {
      if ((error as any).status === 429) {
        // Update status to show rate limit hit
        const newStatus = await RateLimitService.getRateLimitStatus(identifier, endpointKey);
        setRateLimitStatus(newStatus);
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const checkRateLimit = async (userRole?: string): Promise<RateLimitResult> => {
    const result = await RateLimitService.checkRateLimit(identifier, endpointKey, userRole);
    setRateLimitStatus(result);
    return result;
  };

  return {
    rateLimitStatus,
    isLoading,
    executeWithRateLimit,
    checkRateLimit,
    isRateLimited: rateLimitStatus ? !rateLimitStatus.allowed : false,
    remainingRequests: rateLimitStatus?.remainingRequests || 0,
    resetTime: rateLimitStatus?.resetTime
  };
};
