
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Activity,
  TrendingUp,
  Clock,
  Zap
} from 'lucide-react';
import { useGP51ConnectionHealth } from '@/hooks/useGP51ConnectionHealth';
import { SessionHealth } from '@/services/unifiedGP51SessionManager';

interface HealthHistoryEntry {
  timestamp: Date;
  status: string;
  latency?: number;
  errorMessage?: string;
}

const GP51HealthDashboard: React.FC = () => {
  const { status, isLoading, performHealthCheck, attemptReconnection } = useGP51ConnectionHealth();
  const [healthHistory, setHealthHistory] = useState<HealthHistoryEntry[]>([]);

  useEffect(() => {
    if (status) {
      setHealthHistory(prev => [...prev.slice(-9), {
        timestamp: new Date(),
        status: status.status,
        latency: status.latency,
        errorMessage: status.errorMessage
      }]);
    }
  }, [status]);

  const getStatusIcon = (statusStr: string) => {
    switch (statusStr) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'connecting':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'disconnected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'auth_error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (statusStr: string) => {
    switch (statusStr) {
      case 'connected': return 'default';
      case 'degraded': return 'secondary';
      case 'connecting': return 'secondary';
      case 'disconnected': return 'destructive';
      case 'auth_error': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              GP51 Connection Health
              {status && (
                <Badge variant={getStatusColor(status.status)} className="flex items-center gap-1">
                  {getStatusIcon(status.status)}
                  {status.status}
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={performHealthCheck}
                disabled={isLoading}
              >
                <Activity className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Test Connection
              </Button>
              {status?.status === 'disconnected' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={attemptReconnection}
                  disabled={isLoading}
                >
                  <Zap className="h-4 w-4" />
                  Reconnect
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {status && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {status.latency ? `${status.latency}ms` : 'N/A'}
                </div>
                <div className="text-sm text-gray-500">Latency</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {status.lastCheck ? status.lastCheck.toLocaleTimeString() : 'N/A'}
                </div>
                <div className="text-sm text-gray-500">Last Check</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {healthHistory.filter(h => h.status === 'connected').length}
                </div>
                <div className="text-sm text-gray-500">Success Count</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {Math.round((healthHistory.filter(h => h.status === 'connected').length / Math.max(healthHistory.length, 1)) * 100)}%
                </div>
                <div className="text-sm text-gray-500">Uptime</div>
              </div>
            </div>
          )}

          {status?.errorMessage && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{status.errorMessage}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Health History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Connection History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {healthHistory.slice(-10).reverse().map((entry, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(entry.status)}
                  <span className="font-medium capitalize">{entry.status.replace('_', ' ')}</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  {entry.latency && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {entry.latency}ms
                    </span>
                  )}
                  <span>{entry.timestamp.toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
            {healthHistory.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                No health check history available. Run a health check to start monitoring.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GP51HealthDashboard;
