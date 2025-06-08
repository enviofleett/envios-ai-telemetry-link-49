
import React, { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { productionGP51SessionManager, SessionHealth } from '@/services/productionGP51SessionManager';
import { errorHandler } from '@/services/errorHandling';

const SystemHealthMonitor: React.FC = () => {
  const [gp51Health, setGp51Health] = useState<SessionHealth | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [recentErrors, setRecentErrors] = useState(0);

  useEffect(() => {
    // Subscribe to GP51 health updates
    const unsubscribe = productionGP51SessionManager.subscribeToHealth((health) => {
      setGp51Health(health);
    });

    // Start health monitoring
    productionGP51SessionManager.startHealthMonitoring(30000); // Check every 30 seconds

    // Count recent errors
    const errors = errorHandler.getRecentErrors(10);
    setRecentErrors(errors.length);

    return () => {
      unsubscribe();
      productionGP51SessionManager.stopHealthMonitoring();
    };
  }, []);

  const handleRefreshHealth = async () => {
    setIsRefreshing(true);
    try {
      await productionGP51SessionManager.performHealthCheck();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleReconnect = async () => {
    setIsRefreshing(true);
    try {
      await productionGP51SessionManager.attemptReconnection();
    } finally {
      setIsRefreshing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Connected</Badge>;
      case 'connecting':
        return <Badge className="bg-yellow-500"><RefreshCw className="w-3 h-3 mr-1 animate-spin" />Connecting</Badge>;
      case 'degraded':
        return <Badge className="bg-orange-500"><AlertCircle className="w-3 h-3 mr-1" />Degraded</Badge>;
      case 'disconnected':
        return <Badge className="bg-red-500"><XCircle className="w-3 h-3 mr-1" />Disconnected</Badge>;
      case 'auth_error':
        return <Badge className="bg-red-600"><XCircle className="w-3 h-3 mr-1" />Auth Error</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          System Health
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshHealth}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* GP51 Connection Status */}
        <div className="flex items-center justify-between">
          <span className="font-medium">GP51 Connection</span>
          {gp51Health ? getStatusBadge(gp51Health.status) : <Badge variant="secondary">Checking...</Badge>}
        </div>

        {gp51Health?.latency && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Response Time</span>
            <span className="text-sm">{gp51Health.latency}ms</span>
          </div>
        )}

        {gp51Health?.sessionInfo && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Session User</span>
            <span className="text-sm">{gp51Health.sessionInfo.username}</span>
          </div>
        )}

        {/* Error Count */}
        <div className="flex items-center justify-between">
          <span className="font-medium">Recent Errors</span>
          <Badge variant={recentErrors > 5 ? "destructive" : recentErrors > 0 ? "secondary" : "outline"}>
            {recentErrors}
          </Badge>
        </div>

        {/* Actions */}
        {gp51Health?.status === 'disconnected' || gp51Health?.status === 'auth_error' ? (
          <Button
            onClick={handleReconnect}
            disabled={isRefreshing}
            className="w-full"
            size="sm"
          >
            {isRefreshing ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Reconnecting...
              </>
            ) : (
              'Reconnect'
            )}
          </Button>
        ) : null}

        {gp51Health?.errorMessage && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              {gp51Health.errorMessage}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default SystemHealthMonitor;
