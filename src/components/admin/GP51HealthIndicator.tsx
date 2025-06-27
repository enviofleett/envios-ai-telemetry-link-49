
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Activity, AlertCircle, CheckCircle, Clock, Wifi, WifiOff } from 'lucide-react';
import { gp51DataService } from '@/services/gp51/GP51DataService';
import { gp51AuthService } from '@/services/gp51/GP51AuthService';
import type { GP51HealthStatus } from '@/types/gp51-unified';

interface GP51HealthIndicatorProps {
  compact?: boolean;
  onStatusChange?: (status: GP51HealthStatus) => void;
}

const GP51HealthIndicator: React.FC<GP51HealthIndicatorProps> = ({ 
  compact = false, 
  onStatusChange 
}) => {
  const [healthStatus, setHealthStatus] = useState<GP51HealthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  // Load existing session on component mount
  useEffect(() => {
    const initializeSession = async () => {
      setIsLoading(true);
      try {
        const sessionLoaded = await gp51AuthService.loadExistingSession();
        if (sessionLoaded) {
          console.log('✅ Existing GP51 session loaded');
          await checkHealth();
        } else {
          console.log('ℹ️ No existing GP51 session found');
          // Set initial status when not authenticated
          const initialStatus: GP51HealthStatus = {
            status: 'failed',
            lastCheck: new Date(),
            isConnected: false,
            lastPingTime: new Date(),
            tokenValid: false,
            sessionValid: false,
            activeDevices: 0,
            isHealthy: false,
            connectionStatus: 'disconnected',
            errorMessage: 'Not authenticated'
          };
          setHealthStatus(initialStatus);
          onStatusChange?.(initialStatus);
        }
      } catch (error) {
        console.error('Error initializing GP51 session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeSession();
  }, [onStatusChange]);

  const checkHealth = async () => {
    if (!gp51AuthService.isAuthenticated) {
      const notAuthStatus: GP51HealthStatus = {
        status: 'failed',
        lastCheck: new Date(),
        isConnected: false,
        lastPingTime: new Date(),
        tokenValid: false,
        sessionValid: false,
        activeDevices: 0,
        isHealthy: false,
        connectionStatus: 'disconnected',
        errorMessage: 'Not authenticated with GP51'
      };
      setHealthStatus(notAuthStatus);
      onStatusChange?.(notAuthStatus);
      return;
    }

    setIsLoading(true);
    try {
      console.log('🔍 Running GP51 health check...');
      const status = await gp51DataService.getHealthStatus();
      setHealthStatus(status);
      setLastCheck(new Date());
      onStatusChange?.(status);
      
      console.log('✅ Health check completed:', {
        isHealthy: status.isHealthy,
        activeDevices: status.activeDevices,
        responseTime: status.responseTime
      });
    } catch (error) {
      console.error('❌ Health check failed:', error);
      const errorStatus: GP51HealthStatus = {
        status: 'failed',
        lastCheck: new Date(),
        isConnected: false,
        lastPingTime: new Date(),
        tokenValid: false,
        sessionValid: false,
        activeDevices: 0,
        isHealthy: false,
        connectionStatus: 'error',
        errorMessage: error instanceof Error ? error.message : 'Health check failed'
      };
      setHealthStatus(errorStatus);
      onStatusChange?.(errorStatus);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = () => {
    if (!healthStatus) return 'gray';
    if (healthStatus.isHealthy) return 'green';
    if (healthStatus.isConnected) return 'yellow';
    return 'red';
  };

  const getStatusIcon = () => {
    if (isLoading) return <Clock className="h-4 w-4 animate-spin" />;
    if (!healthStatus) return <AlertCircle className="h-4 w-4" />;
    if (healthStatus.isHealthy) return <CheckCircle className="h-4 w-4" />;
    if (healthStatus.isConnected) return <Wifi className="h-4 w-4" />;
    return <WifiOff className="h-4 w-4" />;
  };

  const getStatusText = () => {
    if (isLoading) return 'Checking...';
    if (!healthStatus) return 'Unknown';
    if (!gp51AuthService.isAuthenticated) return 'Not Authenticated';
    if (healthStatus.isHealthy) return 'Healthy';
    if (healthStatus.isConnected) return 'Connected';
    return 'Disconnected';
  };

  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        <Badge variant={getStatusColor() === 'green' ? 'default' : 'destructive'}>
          <div className="flex items-center space-x-1">
            {getStatusIcon()}
            <span className="text-xs">GP51: {getStatusText()}</span>
          </div>
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          onClick={checkHealth}
          disabled={isLoading}
          className="h-6 px-2"
        >
          <Activity className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <span>GP51 Health Status</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={checkHealth}
            disabled={isLoading}
          >
            <Activity className="h-4 w-4 mr-2" />
            {isLoading ? 'Checking...' : 'Check Now'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium">Status</p>
            <Badge variant={getStatusColor() === 'green' ? 'default' : 'destructive'}>
              {getStatusText()}
            </Badge>
          </div>
          <div>
            <p className="text-sm font-medium">Active Devices</p>
            <p className="text-2xl font-bold">{healthStatus?.activeDevices || 0}</p>
          </div>
        </div>

        {healthStatus && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium">Response Time</p>
              <p>{healthStatus.responseTime ? `${healthStatus.responseTime}ms` : 'N/A'}</p>
            </div>
            <div>
              <p className="font-medium">Connection</p>
              <p className="capitalize">{healthStatus.connectionStatus}</p>
            </div>
            <div>
              <p className="font-medium">Session Valid</p>
              <p>{healthStatus.sessionValid ? 'Yes' : 'No'}</p>
            </div>
            <div>
              <p className="font-medium">Token Valid</p>
              <p>{healthStatus.tokenValid ? 'Yes' : 'No'}</p>
            </div>
          </div>
        )}

        {lastCheck && (
          <div className="text-xs text-gray-500 border-t pt-2">
            Last checked: {lastCheck.toLocaleTimeString()}
          </div>
        )}

        {healthStatus?.errorMessage && (
          <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
            Error: {healthStatus.errorMessage}
          </div>
        )}

        {!gp51AuthService.isAuthenticated && (
          <div className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded">
            ⚠️ Please authenticate with GP51 to enable health monitoring
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GP51HealthIndicator;
