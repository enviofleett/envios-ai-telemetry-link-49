
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Car, 
  Activity, 
  Clock, 
  MapPin,
  Wifi,
  AlertTriangle
} from 'lucide-react';
import type { VehicleMetrics } from '@/services/unifiedVehicleData';
import type { SyncMetrics } from '@/services/vehiclePosition/types';
import type { Vehicle } from '@/services/unifiedVehicleData';

interface LiveTrackingStatsProps {
  metrics: VehicleMetrics;
  syncMetrics: SyncMetrics;
  vehiclesByStatus: {
    online: Vehicle[];
    offline: Vehicle[];
    alerts: Vehicle[];
  };
}

const LiveTrackingStats: React.FC<LiveTrackingStatsProps> = ({
  metrics,
  syncMetrics,
  vehiclesByStatus
}) => {
  const onlinePercentage = metrics.total > 0 ? ((metrics.online / metrics.total) * 100).toFixed(1) : '0';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Vehicles</p>
              <p className="text-2xl font-bold">{metrics.total}</p>
            </div>
            <Car className="h-8 w-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Online Now</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-green-600">{metrics.online}</p>
                <Badge variant="secondary" className="text-xs">
                  {onlinePercentage}%
                </Badge>
              </div>
            </div>
            <Activity className="h-8 w-8 text-green-500" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Offline</p>
              <p className="text-2xl font-bold text-gray-600">{metrics.offline}</p>
            </div>
            <MapPin className="h-8 w-8 text-gray-500" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Sync Status</p>
              <div className="flex items-center gap-2">
                <Badge 
                  variant={syncMetrics.errors === 0 ? "default" : "destructive"}
                  className="text-xs"
                >
                  <Wifi className="h-3 w-3 mr-1" />
                  {syncMetrics.errors === 0 ? 'Healthy' : `${syncMetrics.errors} Errors`}
                </Badge>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Last sync: {syncMetrics.lastSyncTime.toLocaleTimeString()}
              </p>
            </div>
            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
              syncMetrics.errors === 0 ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {syncMetrics.errors === 0 ? (
                <Activity className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-600" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LiveTrackingStats;
