
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  RefreshCw,
  Wifi,
  WifiOff,
  Activity
} from 'lucide-react';

interface GP51HealthStatus {
  isConnected: boolean;
  lastChecked: Date;
  deviceCount: number;
  groupCount: number;
  error?: string;
  apiResponseTime?: number;
}

// Add props interface to support the props being passed from AdminSetup
interface GP51HealthIndicatorProps {
  compact?: boolean;
  onStatusChange?: (status: GP51HealthStatus | null) => void;
}

const GP51HealthIndicator: React.FC<GP51HealthIndicatorProps> = ({ 
  compact = false, 
  onStatusChange 
}) => {
  const [healthStatus, setHealthStatus] = useState<GP51HealthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const checkGP51Health = async () => {
    setIsLoading(true);
    try {
      console.log('🔍 Checking GP51 health status...');
      
      const response = await fetch('/functions/v1/gp51-secure-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'test_connection',
          username: 'octopus', // Default test username
          password: 'your_password', // You'll need to update this
          apiUrl: 'https://www.gps51.com/webapi'
        })
      });

      const result = await response.json();
      console.log('🔍 GP51 Health Check Result:', result);

      let newHealthStatus: GP51HealthStatus;

      if (result.success) {
        newHealthStatus = {
          isConnected: true,
          lastChecked: new Date(),
          deviceCount: result.deviceCount || 0,
          groupCount: result.groupCount || 0,
          apiResponseTime: Date.now() - performance.now()
        };
      } else {
        newHealthStatus = {
          isConnected: false,
          lastChecked: new Date(),
          deviceCount: 0,
          groupCount: 0,
          error: result.error || 'Connection failed'
        };
      }

      setHealthStatus(newHealthStatus);
      
      // Call onStatusChange callback if provided
      if (onStatusChange) {
        onStatusChange(newHealthStatus);
      }
    } catch (error) {
      console.error('❌ GP51 health check failed:', error);
      const errorStatus: GP51HealthStatus = {
        isConnected: false,
        lastChecked: new Date(),
        deviceCount: 0,
        groupCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      
      setHealthStatus(errorStatus);
      
      if (onStatusChange) {
        onStatusChange(errorStatus);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkGP51Health();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(checkGP51Health, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = () => {
    if (isLoading) return <RefreshCw className="h-5 w-5 animate-spin" />;
    if (!healthStatus) return <AlertCircle className="h-5 w-5 text-gray-400" />;
    if (healthStatus.isConnected) return <CheckCircle className="h-5 w-5 text-green-500" />;
    return <XCircle className="h-5 w-5 text-red-500" />;
  };

  const getStatusColor = () => {
    if (!healthStatus) return 'secondary';
    return healthStatus.isConnected ? 'success' : 'destructive';
  };

  const getStatusText = () => {
    if (isLoading) return 'Checking...';
    if (!healthStatus) return 'Unknown';
    return healthStatus.isConnected ? 'Connected' : 'Failed';
  };

  // Compact mode for smaller displays
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {getStatusIcon()}
        <Badge variant={getStatusColor() as any}>
          {getStatusText()}
        </Badge>
        <Button
          variant="outline"
          size="sm"
          onClick={checkGP51Health}
          disabled={isLoading}
        >
          <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {healthStatus?.isConnected ? (
              <Wifi className="h-5 w-5 text-green-500" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-500" />
            )}
            GP51 Connection Status
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={checkGP51Health}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="font-medium">Status</span>
          </div>
          <Badge variant={getStatusColor() as any}>
            {getStatusText()}
          </Badge>
        </div>

        {healthStatus && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-500" />
                <div>
                  <div className="text-sm text-gray-600">Devices</div>
                  <div className="font-semibold">{healthStatus.deviceCount}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-purple-500" />
                <div>
                  <div className="text-sm text-gray-600">Groups</div>
                  <div className="font-semibold">{healthStatus.groupCount}</div>
                </div>
              </div>
            </div>

            <div className="text-xs text-gray-500">
              Last checked: {healthStatus.lastChecked.toLocaleTimeString()}
              {healthStatus.apiResponseTime && (
                <span className="ml-2">
                  • Response time: {Math.round(healthStatus.apiResponseTime)}ms
                </span>
              )}
            </div>
          </>
        )}

        {healthStatus?.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Connection Error:</strong> {healthStatus.error}
              <div className="mt-2 text-sm">
                Please check your GP51 credentials and ensure the API is accessible.
              </div>
            </AlertDescription>
          </Alert>
        )}

        {healthStatus?.isConnected && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Connection Successful!</strong> GP51 integration is working properly.
              {healthStatus.deviceCount > 0 && (
                <div className="mt-1">
                  Successfully connected to {healthStatus.deviceCount} devices across {healthStatus.groupCount} groups.
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default GP51HealthIndicator;
