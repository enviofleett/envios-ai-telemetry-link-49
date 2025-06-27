
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, XCircle, RefreshCw } from 'lucide-react';
import { useUnifiedGP51Service } from '@/hooks/useUnifiedGP51Service';
import type { GP51HealthIndicatorProps } from '@/types/gp51-unified';

const GP51HealthIndicator: React.FC<GP51HealthIndicatorProps> = ({ 
  compact = false, 
  onStatusChange 
}) => {
  const { healthStatus, getConnectionHealth, loading } = useUnifiedGP51Service();

  useEffect(() => {
    // Initial health check
    getConnectionHealth();
    
    // Set up periodic health checks
    const interval = setInterval(() => {
      getConnectionHealth();
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [getConnectionHealth]);

  // Call onStatusChange when health status changes
  useEffect(() => {
    if (onStatusChange && healthStatus) {
      onStatusChange(healthStatus);
    }
  }, [healthStatus, onStatusChange]);

  const getStatusIcon = () => {
    if (loading) return <RefreshCw className="h-4 w-4 animate-spin" />;
    if (!healthStatus) return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    
    switch (healthStatus.status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusVariant = () => {
    if (!healthStatus) return 'secondary';
    
    switch (healthStatus.status) {
      case 'healthy':
        return 'default';
      case 'warning':
        return 'secondary';
      case 'failed':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {getStatusIcon()}
        <Badge variant={getStatusVariant()}>
          {healthStatus?.status || 'Unknown'}
        </Badge>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">GP51 Connection Health</CardTitle>
          {getStatusIcon()}
        </div>
        <CardDescription className="text-xs">
          Real-time connection status monitoring
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status</span>
            <Badge variant={getStatusVariant()}>
              {healthStatus?.status || 'Unknown'}
            </Badge>
          </div>
          
          {healthStatus && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm">Connected</span>
                <Badge variant={healthStatus.isConnected ? 'default' : 'destructive'}>
                  {healthStatus.isConnected ? 'Yes' : 'No'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Active Devices</span>
                <span className="text-sm font-medium">{healthStatus.activeDevices}</span>
              </div>
              
              {healthStatus.responseTime && (
                <div className="flex items-center justify-between">
                  <span className="text-sm">Response Time</span>
                  <span className="text-sm font-medium">{healthStatus.responseTime}ms</span>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Last Check</span>
                <span className="text-xs text-muted-foreground">
                  {healthStatus.lastCheck.toLocaleTimeString()}
                </span>
              </div>
              
              {healthStatus.errorMessage && (
                <div className="pt-2 border-t">
                  <span className="text-xs text-red-600">{healthStatus.errorMessage}</span>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default GP51HealthIndicator;
