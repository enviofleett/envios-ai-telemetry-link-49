
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Clock,
  Database
} from 'lucide-react';
import type { SyncMetrics } from '@/services/vehiclePosition/types';

interface SyncStatusCardProps {
  syncMetrics: SyncMetrics;
  onlineVehiclesCount: number;
  isRefreshing: boolean;
  onForceSync: () => void;
}

const SyncStatusCard: React.FC<SyncStatusCardProps> = ({
  syncMetrics,
  onlineVehiclesCount,
  isRefreshing,
  onForceSync
}) => {
  const syncSuccessRate = syncMetrics.totalVehicles > 0 
    ? ((syncMetrics.positionsUpdated / syncMetrics.totalVehicles) * 100).toFixed(1)
    : '0';

  const lastSyncText = syncMetrics.lastSyncTime 
    ? new Date(syncMetrics.lastSyncTime).toLocaleString()
    : 'Never';

  const getSyncStatus = () => {
    if (syncMetrics.errors > 0) {
      return { status: 'warning', icon: AlertCircle, color: 'bg-yellow-100 text-yellow-800' };
    }
    if (syncMetrics.positionsUpdated > 0) {
      return { status: 'success', icon: CheckCircle, color: 'bg-green-100 text-green-800' };
    }
    return { status: 'idle', icon: Clock, color: 'bg-gray-100 text-gray-800' };
  };

  const { status, icon: StatusIcon, color } = getSyncStatus();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium">Position Sync Status</CardTitle>
        <Button
          onClick={onForceSync}
          disabled={isRefreshing}
          size="sm"
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Syncing...' : 'Force Sync'}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Total Vehicles</span>
            </div>
            <div className="text-2xl font-bold">{syncMetrics.totalVehicles}</div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Online Now</span>
            </div>
            <div className="text-2xl font-bold text-green-600">{onlineVehiclesCount}</div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Last Sync</span>
            </div>
            <div className="text-lg font-semibold">{syncMetrics.positionsUpdated}</div>
            <div className="text-xs text-gray-500">positions updated</div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <StatusIcon className="h-4 w-4" />
              <span className="text-sm font-medium">Success Rate</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-lg font-semibold">{syncSuccessRate}%</div>
              <Badge variant="outline" className={color}>
                {status}
              </Badge>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Last sync: {lastSyncText}</span>
            {syncMetrics.errors > 0 && (
              <Badge variant="destructive" className="text-xs">
                {syncMetrics.errors} errors
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SyncStatusCard;
