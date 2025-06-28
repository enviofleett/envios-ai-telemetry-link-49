import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertTriangle, Loader2, RefreshCw, Activity } from 'lucide-react';
import { gp51AuthStateManager } from '@/services/gp51/GP51AuthStateManager';

interface GP51StatusIndicatorState {
  status: 'connected' | 'connecting' | 'disconnected' | 'auth_error';
  username?: string;
  expiresAt?: Date;
  lastCheck: Date;
  errorMessage?: string;
  consecutiveFailures: number;
  latency?: number;
  isConnected: boolean;
  sessionId?: string;
}

export const GP51StatusIndicator: React.FC = () => {
  const [status, setStatus] = useState<GP51StatusIndicatorState>({
    status: 'disconnected',
    lastCheck: new Date(),
    consecutiveFailures: 0,
    isConnected: false
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Subscribe to centralized auth state
    const unsubscribe = gp51AuthStateManager.subscribe((authState) => {
      const newStatus: GP51StatusIndicatorState = {
        status: authState.isAuthenticating ? 'connecting' : 
                authState.isAuthenticated ? 'connected' :
                authState.error ? 'auth_error' : 'disconnected',
        username: authState.username,
        expiresAt: authState.tokenExpiresAt,
        lastCheck: authState.lastValidated || new Date(),
        errorMessage: authState.error,
        consecutiveFailures: authState.error ? 1 : 0,
        isConnected: authState.isAuthenticated,
        sessionId: authState.sessionId
      };

      console.log('🔄 [StatusIndicator] Auth state updated:', newStatus);
      setStatus(newStatus);
      setIsLoading(authState.isAuthenticating);
    });

    return unsubscribe;
  }, []);

  const performHealthCheck = useCallback(async () => {
    // Don't perform health check if authentication is in progress
    if (gp51AuthStateManager.isLocked()) {
      console.log('🔒 [StatusIndicator] Skipping health check - auth in progress');
      return;
    }

    setIsLoading(true);
    
    try {
      // Perform safe status check through the auth manager
      const result = await gp51AuthStateManager.safeStatusCheck(async () => {
        console.log('🏥 [StatusIndicator] Performing health check...');
        
        // Simple health check that doesn't interfere with auth state
        const currentState = gp51AuthStateManager.getState();
        return {
          success: currentState.isAuthenticated,
          username: currentState.username,
          sessionId: currentState.sessionId
        };
      });
      
      console.log('🏥 [StatusIndicator] Health check result:', result);
    } catch (error) {
      console.error('❌ [StatusIndicator] Health check failed:', error);
    } finally {
      setTimeout(() => {
        setIsLoading(false);
      }, 1000);
    }
  }, []);

  const attemptReconnection = useCallback(async () => {
    console.log('🔄 [StatusIndicator] Attempting reconnection...');
    setIsLoading(true);
    
    try {
      // Clear any existing error
      gp51AuthStateManager.clearError();
      
      // Trigger a session validation
      await gp51AuthStateManager.validateSession();
    } catch (error) {
      console.error('❌ [StatusIndicator] Reconnection failed:', error);
    } finally {
      setTimeout(() => {
        setIsLoading(false);
      }, 1000);
    }
  }, []);

  const getStatusIcon = () => {
    if (isLoading) return <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />;
    if (status.isConnected) return <CheckCircle className="h-5 w-5 text-green-600" />;
    return <XCircle className="h-5 w-5 text-red-600" />;
  };

  const getStatusColor = () => {
    if (status.isConnected) return 'bg-green-100 text-green-800';
    return 'bg-red-100 text-red-800';
  };

  const getStatusText = () => {
    switch (status.status) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
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
        <div className="grid gap-3">
          {status.username && (
            <div className="flex justify-between">
              <span className="text-sm font-medium">Username:</span>
              <span className="text-sm text-muted-foreground">{status.username}</span>
            </div>
          )}

          {status.sessionId && (
            <div className="flex justify-between">
              <span className="text-sm font-medium">Session:</span>
              <span className="text-sm text-muted-foreground font-mono">
                {status.sessionId.substring(0, 8)}...
              </span>
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

        <div className="flex gap-2 pt-4">
          <Button
            onClick={performHealthCheck}
            disabled={isLoading || gp51AuthStateManager.isLocked()}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Check Now
          </Button>

          {(status.status === 'disconnected' || status.status === 'auth_error') && (
            <Button
              onClick={attemptReconnection}
              disabled={isLoading || gp51AuthStateManager.isLocked()}
              variant="outline"
              size="sm"
            >
              <Activity className="h-4 w-4 mr-2" />
              Reconnect
            </Button>
          )}
        </div>

        <div className="text-xs text-muted-foreground">
          Enhanced Auth State • Last updated: {status.lastCheck.toLocaleTimeString()}
          {gp51AuthStateManager.isLocked() && (
            <span className="ml-2 text-blue-600">🔒 Auth in progress</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
