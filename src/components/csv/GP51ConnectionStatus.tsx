
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  RefreshCw, 
  Satellite,
  ArrowRight,
  AlertTriangle
} from 'lucide-react';
import { GP51ConnectionStatus as ConnectionStatusType } from '@/hooks/useGP51LiveImport';

interface GP51ConnectionStatusProps {
  connectionStatus: ConnectionStatusType | null;
  isLoading: boolean;
  onTestConnection: () => void;
  onProceed: () => void;
}

const GP51ConnectionStatus: React.FC<GP51ConnectionStatusProps> = ({
  connectionStatus,
  isLoading,
  onTestConnection,
  onProceed
}) => {
  const getStatusIcon = () => {
    if (isLoading) return <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />;
    if (connectionStatus?.connected) return <CheckCircle className="h-5 w-5 text-green-600" />;
    return <XCircle className="h-5 w-5 text-red-600" />;
  };

  const getStatusText = () => {
    if (isLoading) return 'Testing Connection...';
    if (connectionStatus?.connected) return 'Connected';
    if (connectionStatus?.error) return 'Connection Failed';
    return 'Not Tested';
  };

  const getStatusColor = () => {
    if (isLoading) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (connectionStatus?.connected) return 'bg-green-50 text-green-700 border-green-200';
    return 'bg-red-50 text-red-700 border-red-200';
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Satellite className="h-5 w-5" />
            GP51 Platform Connection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon()}
              <div>
                <p className="font-medium">{getStatusText()}</p>
                {connectionStatus?.username && (
                  <p className="text-sm text-muted-foreground">
                    Connected as: {connectionStatus.username}
                  </p>
                )}
              </div>
            </div>
            
            <Badge variant="outline" className={getStatusColor()}>
              {connectionStatus?.connected ? 'Online' : 'Offline'}
            </Badge>
          </div>

          {connectionStatus?.lastCheck && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Last checked: {new Date(connectionStatus.lastCheck).toLocaleString()}
            </p>
          )}

          <div className="flex gap-2">
            <Button
              onClick={onTestConnection}
              disabled={isLoading}
              variant="outline"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Test Connection
            </Button>

            <Button
              onClick={onProceed}
              disabled={!connectionStatus?.connected || isLoading}
            >
              Proceed to Data Selection
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {connectionStatus?.error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p><strong>Connection Error:</strong> {connectionStatus.error}</p>
              <p className="text-sm">
                Please check your GP51 integration settings in Admin Settings and ensure:
              </p>
              <ul className="text-sm list-disc list-inside space-y-1">
                <li>Valid GP51 username and password are configured</li>
                <li>GP51 API URL is correct</li>
                <li>Your GP51 account has appropriate permissions</li>
                <li>Network connectivity to GP51 platform is available</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {!connectionStatus && (
        <Alert>
          <Satellite className="h-4 w-4" />
          <AlertDescription>
            Click "Test Connection" to verify your GP51 platform connectivity before proceeding with live data import.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default GP51ConnectionStatus;
