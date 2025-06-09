
import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { sessionHealthMonitor } from '@/services/gp51/sessionHealthMonitor';
import { realTimePositionService } from '@/services/gp51/realTimePositionService';
import { CheckCircle, AlertCircle, Wifi, WifiOff, RefreshCw } from 'lucide-react';

interface SessionHealth {
  isValid: boolean;
  expiresAt: Date | null;
  username: string | null;
  lastCheck: Date;
  needsRefresh: boolean;
  consecutiveFailures: number;
}

export const GP51StatusIndicator: React.FC = () => {
  const [sessionHealth, setSessionHealth] = useState<SessionHealth | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Subscribe to health updates
    const unsubscribeHealth = sessionHealthMonitor.onHealthUpdate(setSessionHealth);
    
    // Get initial health status
    setSessionHealth(sessionHealthMonitor.getHealthStatus());
    
    // Check polling status
    setIsPolling(realTimePositionService.isCurrentlyPolling());
    
    // Start monitoring
    sessionHealthMonitor.startMonitoring();

    return () => {
      unsubscribeHealth();
    };
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await sessionHealthMonitor.forceHealthCheck();
    } finally {
      setIsRefreshing(false);
    }
  };

  const getSessionStatusBadge = () => {
    if (!sessionHealth) return null;

    if (sessionHealth.isValid) {
      return (
        <Badge className="bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Connected
        </Badge>
      );
    } else {
      return (
        <Badge variant="destructive">
          <AlertCircle className="h-3 w-3 mr-1" />
          Disconnected
        </Badge>
      );
    }
  };

  const getPollingStatusBadge = () => {
    if (isPolling) {
      return (
        <Badge className="bg-blue-100 text-blue-800">
          <Wifi className="h-3 w-3 mr-1" />
          Live Updates
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline">
          <WifiOff className="h-3 w-3 mr-1" />
          Offline
        </Badge>
      );
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  if (!sessionHealth) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="outline">Loading...</Badge>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {getSessionStatusBadge()}
        {getPollingStatusBadge()}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {sessionHealth.username && (
        <div className="text-sm text-muted-foreground">
          Connected as: <strong>{sessionHealth.username}</strong>
        </div>
      )}

      {sessionHealth.lastCheck && (
        <div className="text-xs text-muted-foreground">
          Last checked: {formatTimeAgo(sessionHealth.lastCheck)}
        </div>
      )}

      {sessionHealth.needsRefresh && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            GP51 connection issues detected. 
            {sessionHealth.consecutiveFailures > 0 && (
              <span className="ml-1">
                ({sessionHealth.consecutiveFailures} consecutive failures)
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {sessionHealth.expiresAt && sessionHealth.isValid && (
        <div className="text-xs text-muted-foreground">
          Session expires: {sessionHealth.expiresAt.toLocaleString()}
        </div>
      )}
    </div>
  );
};
