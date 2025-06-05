
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
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
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Position Sync Status
          </span>
          <Button 
            onClick={onForceSync} 
            disabled={isRefreshing}
            size="sm"
          >
            Force Sync
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{syncMetrics.totalVehicles}</div>
            <div className="text-sm text-gray-600">Total Vehicles</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{onlineVehiclesCount}</div>
            <div className="text-sm text-gray-600">Online</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{syncMetrics.positionsUpdated}</div>
            <div className="text-sm text-gray-600">Last Updated</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{syncMetrics.errors}</div>
            <div className="text-sm text-gray-600">Errors</div>
          </div>
        </div>
        <div className="mt-4 text-sm text-gray-600">
          Last sync: {syncMetrics.lastSyncTime.toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );
};

export default SyncStatusCard;
