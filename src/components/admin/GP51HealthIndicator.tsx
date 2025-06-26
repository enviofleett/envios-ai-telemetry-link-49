
import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, XCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { useUnifiedGP51Service } from '@/hooks/useUnifiedGP51Service';
import type { GP51HealthStatus } from '@/types/gp51-unified';

interface GP51HealthIndicatorProps {
  onStatusChange?: (status: any) => void;
  compact?: boolean;
}

const GP51HealthIndicator: React.FC<GP51HealthIndicatorProps> = ({ 
  onStatusChange, 
  compact = false 
}) => {
  const [healthStatus, setHealthStatus] = useState<GP51HealthStatus | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  
  const { session, isConnected, getConnectionHealth } = useUnifiedGP51Service();

  const checkHealth = async () => {
    setIsCheckingHealth(true);
    
    try {
      const health = await getConnectionHealth();
      setHealthStatus(health);
      
      if (onStatusChange) {
        onStatusChange({
          isConnected: health.isConnected,
          isAuthenticated: health.sessionValid,
          sessionHealth: health.sessionValid ? 'healthy' : 'invalid',
          lastCheck: health.lastCheck.toISOString(),
          username: session?.username,
          error: health.errorMessage
        });
      }
    } catch (error) {
      console.error('❌ Health check failed:', error);
      const errorStatus: GP51HealthStatus = {
        status: 'failed',
        lastCheck: new Date(),
        responseTime: 0,
        isConnected: false,
        lastPingTime: new Date(),
        tokenValid: false,
        sessionValid: false,
        activeDevices: 0,
        errors: [error instanceof Error ? error.message : 'Health check failed'],
        errorMessage: error instanceof Error ? error.message : 'Health check failed'
      };
      
      setHealthStatus(errorStatus);
      
      if (onStatusChange) {
        onStatusChange({
          isConnected: false,
          isAuthenticated: false,
          sessionHealth: 'invalid',
          lastCheck: new Date().toISOString(),
          error: errorStatus.errorMessage
        });
      }
    } finally {
      setIsCheckingHealth(false);
    }
  };

  useEffect(() => {
    if (session) {
      checkHealth();
    }
  }, [session]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (session) {
        checkHealth();
      }
    }, 120000);

    return () => clearInterval(interval);
  }, [session]);

  const getHealthIcon = () => {
    if (isCheckingHealth) {
      return <RefreshCw className="h-4 w-4 animate-spin" />;
    }
    
    if (!healthStatus) {
      return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
    
    if (healthStatus.isConnected && healthStatus.sessionValid) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    
    if (healthStatus.sessionValid && healthStatus.tokenValid) {
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
    
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getHealthBadge = () => {
    if (isCheckingHealth) {
      return <Badge variant="outline">Checking...</Badge>;
    }
    
    if (!healthStatus) {
      return <Badge variant="secondary">Unknown</Badge>;
    }
    
    if (healthStatus.isConnected && healthStatus.sessionValid) {
      return <Badge variant="default" className="bg-green-500">Healthy</Badge>;
    }
    
    if (healthStatus.sessionValid && healthStatus.tokenValid) {
      return <Badge variant="outline" className="border-yellow-500 text-yellow-700">Degraded</Badge>;
    }
    
    return <Badge variant="destructive">Disconnected</Badge>;
  };

  const getStatusText = () => {
    if (!healthStatus) {
      return "Status unknown - click refresh to check";
    }
    
    if (healthStatus.isConnected && healthStatus.sessionValid) {
      return `Connected with ${healthStatus.activeDevices || 0} devices`;
    }
    
    if (healthStatus.sessionValid && healthStatus.tokenValid) {
      return "API reachable but data flow issues detected";
    }
    
    if (healthStatus.sessionValid && !healthStatus.tokenValid) {
      return "Session valid but API unreachable";
    }
    
    return healthStatus.errorMessage || "Connection failed";
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {getHealthIcon()}
        {getHealthBadge()}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          {session ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
          <span className="font-medium">GP51 Connection Status</span>
        </div>
        {getHealthBadge()}
      </div>
      
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium">
            {session ? session.username : 'Not Connected'}
          </p>
          <p className="text-xs text-muted-foreground">
            {getStatusText()}
          </p>
          {healthStatus?.lastCheck && (
            <p className="text-xs text-muted-foreground">
              Last check: {new Date(healthStatus.lastCheck).toLocaleTimeString()}
            </p>
          )}
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={checkHealth}
          disabled={isCheckingHealth}
        >
          {getHealthIcon()}
        </Button>
      </div>
    </div>
  );
};

export default GP51HealthIndicator;
