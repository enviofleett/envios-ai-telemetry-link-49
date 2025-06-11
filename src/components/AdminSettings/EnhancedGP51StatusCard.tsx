
import React from 'react';
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
  Zap, 
  Activity,
  Clock,
  User,
  Shield
} from 'lucide-react';
import { useGP51Session } from '@/contexts/GP51SessionContext';
import { useGP51ConnectionHealth } from '@/hooks/useGP51ConnectionHealth';

const EnhancedGP51StatusCard: React.FC = () => {
  const { session, health, isLoading, error, refreshSession } = useGP51Session();
  const { performHealthCheck, attemptReconnection, isLoading: healthLoading } = useGP51ConnectionHealth();

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'connecting':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'disconnected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'auth_error':
        return <Shield className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'connected': return 'default';
      case 'degraded': return 'secondary';
      case 'connecting': return 'secondary';
      case 'disconnected': return 'destructive';
      case 'auth_error': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'connected': return 'Connected';
      case 'degraded': return 'Degraded';
      case 'connecting': return 'Connecting...';
      case 'disconnected': return 'Disconnected';
      case 'auth_error': return 'Auth Error';
      default: return 'Unknown';
    }
  };

  // Map health status to connection status for comparison
  const getConnectionStatusFromHealth = () => {
    if (!health) return 'disconnected';
    
    switch (health.status) {
      case 'healthy': return 'connected';
      case 'degraded': return 'degraded';
      case 'critical': return health.isAuthError ? 'auth_error' : 'disconnected';
      default: return 'disconnected';
    }
  };

  const connectionStatus = getConnectionStatusFromHealth();

  const calculateTimeUntilExpiry = () => {
    if (!session?.expiresAt) return null;
    
    const now = new Date();
    const expiry = new Date(session.expiresAt);
    const timeLeft = expiry.getTime() - now.getTime();
    
    if (timeLeft <= 0) return 'Expired';
    
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const getExpiryProgress = () => {
    if (!session?.expiresAt) return 0;
    
    const now = new Date();
    const expiry = new Date(session.expiresAt);
    const total = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
    const remaining = expiry.getTime() - now.getTime();
    
    return Math.max(0, Math.min(100, (remaining / total) * 100));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            GP51 Connection Status
            <Badge variant={getStatusColor(connectionStatus)} className="flex items-center gap-1">
              {getStatusIcon(connectionStatus)}
              {getStatusText(connectionStatus)}
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={performHealthCheck}
              disabled={healthLoading}
            >
              <Activity className={`h-4 w-4 ${healthLoading ? 'animate-spin' : ''}`} />
              Test
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshSession}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {(connectionStatus === 'disconnected' || connectionStatus === 'auth_error') && (
              <Button
                variant="outline"
                size="sm"
                onClick={attemptReconnection}
                disabled={healthLoading}
              >
                <Zap className="h-4 w-4" />
                Reconnect
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Session Information */}
        {session && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Username:</span>
                <span>{session.username}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4 text-gray-500" />
                <span className="font-medium">User ID:</span>
                <span className="font-mono text-xs">{session.userId.slice(0, 8)}...</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Expires in:</span>
                <span>{calculateTimeUntilExpiry()}</span>
              </div>
              {health?.latency && (
                <div className="flex items-center gap-2 text-sm">
                  <Activity className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">Latency:</span>
                  <span>{health.latency}ms</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Session Expiry Progress */}
        {session && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Session Validity</span>
              <span>{Math.round(getExpiryProgress())}%</span>
            </div>
            <Progress value={getExpiryProgress()} className="h-2" />
          </div>
        )}

        {/* Health Information */}
        {health?.lastCheck && (
          <div className="text-sm text-gray-600">
            Last checked: {health.lastCheck.toLocaleTimeString()}
          </div>
        )}

        {/* Error Messages */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* No Session Alert */}
        {!session && !isLoading && (
          <Alert>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <AlertDescription>
              No GP51 session found. Please configure your GP51 credentials above to establish a connection.
            </AlertDescription>
          </Alert>
        )}

        {/* Session Needs Refresh Warning */}
        {health?.needsRefresh && session && (
          <Alert>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <AlertDescription>
              Your GP51 session may need attention. Consider refreshing the connection if you experience issues.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedGP51StatusCard;
