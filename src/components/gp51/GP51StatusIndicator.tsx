
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useGP51ConnectionHealth } from '@/hooks/useGP51ConnectionHealth';
import { CheckCircle, XCircle, AlertTriangle, Loader2, RefreshCw, Activity } from 'lucide-react';

export const GP51StatusIndicator: React.FC = () => {
  const { status, isLoading, performHealthCheck, attemptReconnection } = useGP51ConnectionHealth();
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);

  useEffect(() => {
    if (autoRefreshEnabled) {
      const interval = setInterval(() => {
        performHealthCheck();
      }, 30000); // Check every 30 seconds

      return () => clearInterval(interval);
    }
  }, [autoRefreshEnabled, performHealthCheck]);

  const getStatusColor = () => {
    if (!status) return 'bg-gray-100 text-gray-800';
    
    switch (status.status) {
      case 'connected':
        return 'bg-green-100 text-green-800';
      case 'connecting':
        return 'bg-blue-100 text-blue-800';
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800';
      case 'auth_error':
      case 'disconnected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = () => {
    if (isLoading) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }
    
    if (!status) return <XCircle className="h-4 w-4" />;
    
    switch (status.status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4" />;
      case 'connecting':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'degraded':
        return <AlertTriangle className="h-4 w-4" />;
      case 'auth_error':
      case 'disconnected':
        return <XCircle className="h-4 w-4" />;
      default:
        return <XCircle className="h-4 w-4" />;
    }
  };

  const getStatusText = () => {
    if (!status) return 'Unknown';
    
    switch (status.status) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'degraded':
        return 'Degraded';
      case 'auth_error':
        return 'Authentication Error';
      case 'disconnected':
        return 'Disconnected';
      default:
        return 'Unknown';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5" />
              GP51 Connection Status
            </CardTitle>
            <CardDescription>
              Real-time monitoring of GP51 API connection health
            </CardDescription>
          </div>
          <Badge className={`${getStatusColor()} flex items-center gap-1`}>
            {getStatusIcon()}
            {getStatusText()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {status && (
          <div className="grid gap-3">
            {status.username && (
              <div className="flex justify-between">
                <span className="text-sm font-medium">Username:</span>
                <span className="text-sm text-muted-foreground">{status.username}</span>
              </div>
            )}
            
            {status.expiresAt && (
              <div className="flex justify-between">
                <span className="text-sm font-medium">Session Expires:</span>
                <span className="text-sm text-muted-foreground">
                  {status.expiresAt.toLocaleString()}
                </span>
              </div>
            )}
            
            <div className="flex justify-between">
              <span className="text-sm font-medium">Last Check:</span>
              <span className="text-sm text-muted-foreground">
                {status.lastCheck.toLocaleString()}
              </span>
            </div>

            {status.latency && (
              <div className="flex justify-between">
                <span className="text-sm font-medium">Response Time:</span>
                <span className="text-sm text-muted-foreground">
                  {status.latency}ms
                </span>
              </div>
            )}

            {status.consecutiveFailures > 0 && (
              <div className="flex justify-between">
                <span className="text-sm font-medium">Failed Attempts:</span>
                <span className="text-sm text-red-600">
                  {status.consecutiveFailures}
                </span>
              </div>
            )}

            {status.errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded">
                <p className="text-sm text-red-700">
                  <strong>Error:</strong> {status.errorMessage}
                </p>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2 pt-4">
          <Button
            onClick={performHealthCheck}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Check Now
          </Button>

          {status?.status === 'disconnected' || status?.status === 'auth_error' ? (
            <Button
              onClick={attemptReconnection}
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              <Activity className="h-4 w-4 mr-2" />
              Reconnect
            </Button>
          ) : null}
        </div>

        <div className="text-xs text-muted-foreground">
          Auto-refresh: {autoRefreshEnabled ? 'Enabled' : 'Disabled'} • 
          Last updated: {status?.lastCheck.toLocaleTimeString() || 'Never'}
        </div>
      </CardContent>
    </Card>
  );
};
