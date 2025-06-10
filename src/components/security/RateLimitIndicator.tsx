
import React from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useRateLimit } from '@/hooks/useRateLimit';

interface RateLimitIndicatorProps {
  endpointKey: string;
  maxRequests?: number;
  showProgress?: boolean;
}

const RateLimitIndicator: React.FC<RateLimitIndicatorProps> = ({
  endpointKey,
  maxRequests = 100,
  showProgress = false
}) => {
  const { rateLimitStatus, isRateLimited, remainingRequests, resetTime } = useRateLimit(endpointKey);

  if (!rateLimitStatus) return null;

  const usedRequests = maxRequests - remainingRequests;
  const usagePercentage = (usedRequests / maxRequests) * 100;

  if (isRateLimited) {
    const retryAfter = resetTime ? Math.ceil((resetTime.getTime() - Date.now()) / 1000) : 0;
    
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          <div className="space-y-2">
            <p className="font-medium">Rate limit exceeded</p>
            <p className="text-sm">
              Too many requests. Please wait {retryAfter} seconds before trying again.
            </p>
            {resetTime && (
              <p className="text-xs">
                Reset at: {resetTime.toLocaleTimeString()}
              </p>
            )}
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  if (showProgress && usagePercentage > 50) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="h-4 w-4 text-yellow-600" />
          <span className="text-sm font-medium text-yellow-800">
            API Usage: {remainingRequests} requests remaining
          </span>
        </div>
        <Progress 
          value={usagePercentage} 
          className="h-2"
        />
        {resetTime && (
          <p className="text-xs text-yellow-700 mt-1">
            Resets at: {resetTime.toLocaleTimeString()}
          </p>
        )}
      </div>
    );
  }

  return null;
};

export default RateLimitIndicator;
