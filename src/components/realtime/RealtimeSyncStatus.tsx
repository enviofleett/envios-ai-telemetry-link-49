
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Activity,
  Zap
} from 'lucide-react';
import { useRealtimeVehicleData } from '@/hooks/useRealtimeVehicleData';
import { vehiclePositionSyncService } from '@/services/realtime/vehiclePositionSyncService';

const RealtimeSyncStatus: React.FC = () => {
  const { syncStatus, isConnected, lastUpdate, forceSync } = useRealtimeVehicleData();
  const syncProgress = vehiclePositionSyncService.getSyncProgress();

  const getSyncStatusIcon = () => {
    switch (syncStatus) {
      case 'running':
      case 'syncing':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'idle':
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSyncStatusColor = () => {
    switch (syncStatus) {
      case 'running':
      case 'syncing':
        return 'default';
      case 'completed':
        return 'success';
      case 'error':
        return 'destructive';
      case 'idle':
      default:
        return 'secondary';
    }
  };

  const getSyncStatusText = () => {
    switch (syncStatus) {
      case 'running':
      case 'syncing':
        return 'Syncing...';
      case 'completed':
        return 'Up to date';
      case 'error':
        return 'Sync failed';
      case 'idle':
      default:
        return 'Idle';
    }
  };

  const formatLastUpdate = () => {
    if (!lastUpdate) return 'Never';
    
    const now = new Date();
    const diff = now.getTime() - lastUpdate.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return lastUpdate.toLocaleDateString();
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Real-time Sync
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isConnected ? 'default' : 'secondary'}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Sync Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getSyncStatusIcon()}
            <span className="text-sm font-medium">{getSyncStatusText()}</span>
          </div>
          <Badge variant={getSyncStatusColor()}>
            {syncStatus}
          </Badge>
        </div>

        {/* Sync Progress */}
        {(syncStatus === 'running' || syncStatus === 'syncing') && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{syncProgress.processedVehicles}/{syncProgress.totalVehicles}</span>
            </div>
            <Progress value={syncProgress.percentage} className="h-2" />
          </div>
        )}

        {/* Last Update */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Last updated:</span>
          <span>{formatLastUpdate()}</span>
        </div>

        {/* Errors */}
        {syncProgress.errors.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span>{syncProgress.errors.length} error(s) occurred</span>
            </div>
            <div className="text-xs text-muted-foreground max-h-20 overflow-y-auto">
              {syncProgress.errors.slice(0, 3).map((error, index) => (
                <div key={index} className="truncate">
                  • {error}
                </div>
              ))}
              {syncProgress.errors.length > 3 && (
                <div>+ {syncProgress.errors.length - 3} more...</div>
              )}
            </div>
          </div>
        )}

        {/* Manual Sync Button */}
        <Button
          onClick={forceSync}
          disabled={syncStatus === 'running' || syncStatus === 'syncing'}
          variant="outline"
          size="sm"
          className="w-full"
        >
          <Zap className="h-4 w-4 mr-2" />
          Force Sync
        </Button>
      </CardContent>
    </Card>
  );
};

export default RealtimeSyncStatus;
