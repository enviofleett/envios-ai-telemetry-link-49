
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useRealGP51Connection } from '@/hooks/useRealGP51Connection';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Loader2, 
  RefreshCw, 
  Activity,
  Wifi,
  Database,
  Timer
} from 'lucide-react';

export const RealConnectionStatusCard: React.FC = () => {
  const { 
    connectionHealth, 
    isLoading, 
    lastChecked, 
    performRealConnectionTest,
    isHealthy,
    isDegraded,
    isCritical
  } = useRealGP51Connection();

  const getOverallStatusBadge = () => {
    if (isLoading) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          Testing...
        </Badge>
      );
    }

    if (isHealthy) {
      return (
        <Badge variant="default" className="flex items-center gap-1 bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="h-3 w-3" />
          Healthy
        </Badge>
      );
    }

    if (isDegraded) {
      return (
        <Badge variant="outline" className="flex items-center gap-1 bg-yellow-100 text-yellow-800 border-yellow-200">
          <AlertTriangle className="h-3 w-3" />
          Degraded
        </Badge>
      );
    }

    return (
      <Badge variant="destructive" className="flex items-center gap-1">
        <XCircle className="h-3 w-3" />
        Critical
      </Badge>
    );
  };

  const getStatusIcon = (status: boolean | undefined) => {
    if (status === true) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (status === false) return <XCircle className="h-4 w-4 text-red-500" />;
    return <Loader2 className="h-4 w-4 animate-spin text-gray-400" />;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Real GP51 Connection Status
          </CardTitle>
          {getOverallStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Health Indicators */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            {getStatusIcon(connectionHealth?.sessionValid)}
            <span className="text-sm">Session Valid</span>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon(connectionHealth?.apiReachable)}
            <span className="text-sm">API Reachable</span>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon(connectionHealth?.dataFlowing)}
            <span className="text-sm">Data Flowing</span>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon(connectionHealth?.isConnected)}
            <span className="text-sm">Overall Connected</span>
          </div>
        </div>

        {/* Performance Metrics */}
        {connectionHealth && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Response Time:</span>
              </div>
              <span className="text-sm">
                {connectionHealth.apiResponseTime ? `${connectionHealth.apiResponseTime}ms` : 'N/A'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Device Count:</span>
              </div>
              <span className="text-sm">
                {connectionHealth.deviceCount ?? 'Unknown'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wifi className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Last Ping:</span>
              </div>
              <span className="text-sm">
                {connectionHealth.lastSuccessfulPing 
                  ? connectionHealth.lastSuccessfulPing.toLocaleTimeString()
                  : 'Never'
                }
              </span>
            </div>
          </div>
        )}

        {/* Error Messages */}
        {connectionHealth?.errorMessage && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Connection Error:</strong> {connectionHealth.errorMessage}
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={performRealConnectionTest}
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Test Connection
          </Button>
        </div>

        {/* Last Checked */}
        <div className="text-xs text-gray-500 text-center">
          Last checked: {lastChecked ? lastChecked.toLocaleTimeString() : 'Never'}
        </div>
      </CardContent>
    </Card>
  );
};
