
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  RefreshCw, 
  Wifi, 
  WifiOff,
  Clock,
  Activity
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface GP51HealthStatus {
  isConnected: boolean;
  lastChecked: Date;
  deviceCount?: number;
  groupCount?: number;
  error?: string;
  apiResponseTime?: number;
}

interface GP51HealthIndicatorProps {
  compact?: boolean;
  onStatusChange?: (status: GP51HealthStatus) => void;
}

const GP51HealthIndicator: React.FC<GP51HealthIndicatorProps> = ({ 
  compact = false, 
  onStatusChange 
}) => {
  const [healthStatus, setHealthStatus] = useState<GP51HealthStatus | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const { toast } = useToast();

  const checkHealth = async () => {
    setIsChecking(true);
    
    try {
      console.log('🔍 Starting GP51 health check...');
      
      const startTime = Date.now();
      
      // Test GP51 connection with actual credentials
      const { data, error } = await supabase.functions.invoke('gp51-secure-auth', {
        body: {
          username: 'octopus', // Using actual GP51 credentials
          password: 'bdb5f67d0bc5ee3468b4d2ef00e311f4eef48974be2a8cc8b4dde538d45e346a',
          apiUrl: 'https://www.gps51.com/webapi'
        }
      });

      const responseTime = Date.now() - startTime;

      let status: GP51HealthStatus;

      if (error) {
        console.error('❌ GP51 health check error:', error);
        status = {
          isConnected: false,
          lastChecked: new Date(),
          error: error.message,
          apiResponseTime: responseTime
        };
      } else if (data?.success) {
        console.log('✅ GP51 health check successful');
        status = {
          isConnected: true,
          lastChecked: new Date(),
          deviceCount: 0, // Will be updated when device data is available
          groupCount: 0,
          apiResponseTime: responseTime
        };
      } else {
        console.warn('⚠️ GP51 health check returned unsuccessful response:', data);
        status = {
          isConnected: false,
          lastChecked: new Date(),
          error: data?.error || 'Unknown error',
          apiResponseTime: responseTime
        };
      }

      setHealthStatus(status);
      if (onStatusChange) {
        onStatusChange(status);
      }

      // Show toast for significant status changes
      if (status.isConnected) {
        toast({
          title: "GP51 Connection Healthy",
          description: `API responding in ${status.apiResponseTime}ms`,
        });
      } else {
        toast({
          title: "GP51 Connection Issues",
          description: status.error || "Unable to connect to GP51 API",
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('💥 GP51 health check exception:', error);
      const status: GP51HealthStatus = {
        isConnected: false,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Health check failed'
      };
      
      setHealthStatus(status);
      if (onStatusChange) {
        onStatusChange(status);
      }
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkHealth();
    
    // Auto-refresh every 2 minutes
    const interval = setInterval(checkHealth, 120000);
    return () => clearInterval(interval);
  }, [onStatusChange]);

  const getStatusIcon = () => {
    if (isChecking) {
      return <RefreshCw className="h-4 w-4 animate-spin" />;
    }
    
    if (!healthStatus) {
      return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
    
    return healthStatus.isConnected ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  const getStatusBadge = () => {
    if (isChecking) {
      return <Badge variant="outline">Checking...</Badge>;
    }
    
    if (!healthStatus) {
      return <Badge variant="outline">Unknown</Badge>;
    }
    
    return healthStatus.isConnected ? (
      <Badge className="bg-green-100 text-green-800 border-green-300">
        <Wifi className="h-3 w-3 mr-1" />
        Connected
      </Badge>
    ) : (
      <Badge variant="destructive">
        <WifiOff className="h-3 w-3 mr-1" />
        Disconnected
      </Badge>
    );
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {getStatusIcon()}
        {getStatusBadge()}
        <Button
          variant="ghost"
          size="sm"
          onClick={checkHealth}
          disabled={isChecking}
        >
          <RefreshCw className={`h-3 w-3 ${isChecking ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            GP51 System Health
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={checkHealth}
            disabled={isChecking}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
            {isChecking ? 'Checking...' : 'Refresh'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Connection Status</span>
          {getStatusBadge()}
        </div>

        {healthStatus && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Last Checked</span>
              <div className="flex items-center gap-1 text-sm">
                <Clock className="h-3 w-3" />
                {healthStatus.lastChecked.toLocaleTimeString()}
              </div>
            </div>

            {healthStatus.apiResponseTime && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Response Time</span>
                <span className="text-sm font-mono">
                  {healthStatus.apiResponseTime}ms
                </span>
              </div>
            )}

            {healthStatus.error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-700">{healthStatus.error}</p>
              </div>
            )}

            {healthStatus.isConnected && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-700">
                  GP51 API is responding normally
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default GP51HealthIndicator;
