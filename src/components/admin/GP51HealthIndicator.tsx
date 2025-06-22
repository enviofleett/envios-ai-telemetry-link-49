
import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, XCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface HealthStatus {
  isConnected: boolean;
  isAuthenticated: boolean;
  sessionHealth: 'healthy' | 'expired' | 'invalid';
  lastCheck: string;
  error?: string;
  username?: string;
}

interface GP51HealthIndicatorProps {
  onStatusChange?: (status: HealthStatus) => void;
  compact?: boolean;
}

const GP51HealthIndicator: React.FC<GP51HealthIndicatorProps> = ({ 
  onStatusChange, 
  compact = false 
}) => {
  const [status, setStatus] = useState<HealthStatus>({
    isConnected: false,
    isAuthenticated: false,
    sessionHealth: 'invalid',
    lastCheck: new Date().toISOString()
  });
  const [isChecking, setIsChecking] = useState(false);

  const checkHealth = async () => {
    setIsChecking(true);
    try {
      console.log('🏥 Checking GP51 health status...');
      
      // Check connection status
      const { data: statusData, error: statusError } = await supabase.functions.invoke('settings-management', {
        body: { action: 'get-gp51-status' }
      });

      if (statusError) {
        throw new Error(`Status check failed: ${statusError.message}`);
      }

      // Test actual API connectivity
      const { data: testData, error: testError } = await supabase.functions.invoke('gp51-service-management', {
        body: { action: 'test_gp51_api' }
      });

      const now = new Date();
      const expiresAt = statusData.expiresAt ? new Date(statusData.expiresAt) : null;
      const isExpired = expiresAt && expiresAt <= now;
      
      const healthStatus: HealthStatus = {
        isConnected: !testError && testData?.success === true,
        isAuthenticated: statusData.connected && !isExpired,
        sessionHealth: !statusData.connected ? 'invalid' : (isExpired ? 'expired' : 'healthy'),
        lastCheck: now.toISOString(),
        error: testError?.message || statusData.error,
        username: statusData.username
      };

      setStatus(healthStatus);
      onStatusChange?.(healthStatus);

      console.log('✅ GP51 health check completed:', healthStatus);
    } catch (error) {
      console.error('❌ GP51 health check failed:', error);
      const errorStatus: HealthStatus = {
        isConnected: false,
        isAuthenticated: false,
        sessionHealth: 'invalid',
        lastCheck: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Health check failed'
      };
      setStatus(errorStatus);
      onStatusChange?.(errorStatus);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkHealth();
    // Auto-refresh every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = () => {
    if (isChecking) {
      return <RefreshCw className="h-4 w-4 animate-spin" />;
    }
    
    if (status.isConnected && status.isAuthenticated && status.sessionHealth === 'healthy') {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    
    if (status.sessionHealth === 'expired') {
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
    
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusColor = () => {
    if (status.isConnected && status.isAuthenticated && status.sessionHealth === 'healthy') {
      return 'bg-green-100 text-green-800 border-green-200';
    }
    
    if (status.sessionHealth === 'expired') {
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
    
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getStatusText = () => {
    if (isChecking) return 'Checking...';
    
    if (status.isConnected && status.isAuthenticated && status.sessionHealth === 'healthy') {
      return 'Healthy';
    }
    
    if (status.sessionHealth === 'expired') {
      return 'Session Expired';
    }
    
    if (!status.isAuthenticated) {
      return 'Not Authenticated';
    }
    
    return 'Disconnected';
  };

  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        {getStatusIcon()}
        <Badge className={getStatusColor()}>
          {getStatusText()}
        </Badge>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-3 bg-white border rounded-lg">
      <div className="flex items-center space-x-3">
        {status.isConnected ? (
          <Wifi className="h-5 w-5 text-green-500" />
        ) : (
          <WifiOff className="h-5 w-5 text-red-500" />
        )}
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-medium">GP51 Status</span>
            <Badge className={getStatusColor()}>
              {getStatusText()}
            </Badge>
          </div>
          {status.username && (
            <p className="text-sm text-gray-600">User: {status.username}</p>
          )}
          {status.error && (
            <p className="text-xs text-red-600">Error: {status.error}</p>
          )}
        </div>
      </div>
      
      <Button
        variant="outline"
        size="sm"
        onClick={checkHealth}
        disabled={isChecking}
      >
        <RefreshCw className={`h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
      </Button>
    </div>
  );
};

export default GP51HealthIndicator;
