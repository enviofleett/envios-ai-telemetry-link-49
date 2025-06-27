
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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
      console.log('🔍 Testing GP51 connection...');
      
      // Use proper GP51 credentials - replace with your actual credentials
      const testCredentials = {
        username: 'octopus',
        password: 'your_actual_password_here', // IMPORTANT: Replace this with your real GP51 password
        apiUrl: 'https://www.gps51.com/webapi'
      };

      const startTime = Date.now();

      // Call the corrected edge function
      const { data, error } = await supabase.functions.invoke('gp51-secure-auth', {
        body: testCredentials
      });

      const responseTime = Date.now() - startTime;

      if (error) {
        throw new Error(error.message);
      }

      console.log('🔍 GP51 Health Check Result:', data);

      let newHealthStatus: GP51HealthStatus;

      if (data?.success) {
        // If auth successful, try to get device count
        try {
          const { data: deviceData, error: deviceError } = await supabase.functions.invoke('gp51-query-devices', {
            body: testCredentials
          });

          newHealthStatus = {
            isConnected: true,
            lastChecked: new Date(),
            deviceCount: deviceData?.summary?.totalDevices || 0,
            groupCount: deviceData?.summary?.totalGroups || 0,
            apiResponseTime: responseTime
          };
        } catch (deviceError) {
          // Auth worked but device query failed
          newHealthStatus = {
            isConnected: true,
            lastChecked: new Date(),
            deviceCount: 0,
            groupCount: 0,
            apiResponseTime: responseTime,
            error: 'Connected but device query failed'
          };
        }
      } else {
        newHealthStatus = {
          isConnected: false,
          lastChecked: new Date(),
          deviceCount: 0,
          groupCount: 0,
          apiResponseTime: responseTime,
          error: data?.error || 'Connection failed'
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
  }, []);

  const getStatusIcon = () => {
    if (isLoading) return <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />;
    if (!healthStatus) return <AlertCircle className="h-5 w-5 text-gray-500" />;
    
    return healthStatus.isConnected 
      ? <CheckCircle className="h-5 w-5 text-green-500" />
      : <XCircle className="h-5 w-5 text-red-500" />;
  };

  const getStatusColor = () => {
    if (isLoading) return 'secondary';
    if (!healthStatus) return 'secondary';
    return healthStatus.isConnected ? 'default' : 'destructive';
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
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">GP51 Connection Status</CardTitle>
        {getStatusIcon()}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Status:</span>
            <Badge variant={getStatusColor() as any}>
              {getStatusText()}
            </Badge>
          </div>
          
          {healthStatus && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Devices:</span>
                <span className="text-sm font-medium">{healthStatus.deviceCount}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Groups:</span>
                <span className="text-sm font-medium">{healthStatus.groupCount}</span>
              </div>
              
              {healthStatus.apiResponseTime && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Response Time:</span>
                  <span className="text-sm font-medium">{healthStatus.apiResponseTime}ms</span>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Last Checked:</span>
                <span className="text-sm font-medium">
                  {healthStatus.lastChecked.toLocaleTimeString()}
                </span>
              </div>
              
              {healthStatus.error && (
                <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-600">
                  {healthStatus.error}
                </div>
              )}
            </>
          )}
          
          <Button 
            onClick={checkGP51Health} 
            disabled={isLoading}
            className="w-full mt-4"
            size="sm"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Testing Connection...
              </>
            ) : (
              <>
                <Activity className="h-4 w-4 mr-2" />
                Test Connection
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default GP51HealthIndicator;
