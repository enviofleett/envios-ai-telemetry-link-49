
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Wifi,
  Clock,
  Activity,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { useGP51ConnectionHealth } from '@/hooks/useGP51ConnectionHealth';
import { ConnectionHealthStatus } from '@/services/gp51ConnectionHealthService';

const GP51HealthDashboard: React.FC = () => {
  const { 
    status, 
    healthHistory, 
    isLoading, 
    performHealthCheck, 
    attemptReconnection, 
    loadHealthHistory 
  } = useGP51ConnectionHealth();

  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    loadHealthHistory(20);
  }, []);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'connected': return 'default';
      case 'connecting': return 'secondary';
      case 'degraded': return 'secondary';
      case 'disconnected': return 'destructive';
      case 'auth_error': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'connecting':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'disconnected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'auth_error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <RefreshCw className="h-4 w-4 animate-spin" />;
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting...';
      case 'degraded': return 'Degraded';
      case 'disconnected': return 'Disconnected';
      case 'auth_error': return 'Auth Error';
      default: return 'Unknown';
    }
  };

  const getLatencyColor = (latency?: number) => {
    if (!latency) return 'text-gray-500';
    if (latency < 500) return 'text-green-500';
    if (latency < 1000) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getConnectionUptime = () => {
    if (!healthHistory.length) return 0;
    const successfulChecks = healthHistory.filter(h => h.success).length;
    return Math.round((successfulChecks / healthHistory.length) * 100);
  };

  const getAverageLatency = () => {
    if (!healthHistory.length) return 0;
    const latencies = healthHistory.filter(h => h.latency > 0).map(h => h.latency);
    if (!latencies.length) return 0;
    return Math.round(latencies.reduce((sum, l) => sum + l, 0) / latencies.length);
  };

  if (!status) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Loading GP51 Connection Status...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Wifi className="h-5 w-5" />
              GP51 Connection Health
              <Badge variant={getStatusColor(status.status)} className="flex items-center gap-1">
                {getStatusIcon(status.status)}
                {getStatusText(status.status)}
              </Badge>
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={performHealthCheck}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Test Connection
              </Button>
              {(status.status === 'disconnected' || status.status === 'auth_error') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={attemptReconnection}
                  disabled={isLoading}
                >
                  <Wifi className="h-4 w-4" />
                  Reconnect
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Connection Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-500" />
                  <div>
                    <div className="text-2xl font-bold">
                      {status.latency ? `${status.latency}ms` : 'N/A'}
                    </div>
                    <div className="text-sm text-gray-500">Current Latency</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <div>
                    <div className="text-2xl font-bold">
                      {getAverageLatency()}ms
                    </div>
                    <div className="text-sm text-gray-500">Avg Latency</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <div className="text-2xl font-bold">
                      {getConnectionUptime()}%
                    </div>
                    <div className="text-sm text-gray-500">Uptime</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-purple-500" />
                  <div>
                    <div className="text-sm font-bold">
                      {status.lastCheck.toLocaleTimeString()}
                    </div>
                    <div className="text-sm text-gray-500">Last Check</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Session Information */}
          {status.sessionInfo && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium">Active Session</div>
                <div className="mt-1 space-y-1 text-sm">
                  <div>Username: {status.sessionInfo.username}</div>
                  <div>Expires: {new Date(status.sessionInfo.expiresAt).toLocaleString()}</div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Error Information */}
          {status.errorMessage && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium">Connection Error</div>
                <div className="mt-1 text-sm">{status.errorMessage}</div>
              </AlertDescription>
            </Alert>
          )}

          {/* Connection History */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Connection History</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHistory(!showHistory)}
              >
                {showHistory ? 'Hide' : 'Show'} Details
              </Button>
            </div>

            {healthHistory.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Last 20 checks:</span>
                  <Progress value={getConnectionUptime()} className="flex-1" />
                  <span className="text-sm font-medium">{getConnectionUptime()}% success</span>
                </div>

                {showHistory && (
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {healthHistory.map((metric, index) => (
                      <div key={index} className="flex items-center justify-between text-sm p-2 border rounded">
                        <div className="flex items-center gap-2">
                          {metric.success ? 
                            <CheckCircle className="h-3 w-3 text-green-500" /> : 
                            <XCircle className="h-3 w-3 text-red-500" />
                          }
                          <span>{metric.timestamp.toLocaleTimeString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={getLatencyColor(metric.latency)}>
                            {metric.latency}ms
                          </span>
                          {metric.errorDetails && (
                            <span className="text-red-500 text-xs truncate max-w-32">
                              {metric.errorDetails}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="text-xs text-gray-500">
            Last updated: {status.lastCheck.toLocaleString()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GP51HealthDashboard;
