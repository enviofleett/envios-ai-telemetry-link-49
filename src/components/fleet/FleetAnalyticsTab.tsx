
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { VehicleMetrics, Vehicle } from '@/services/unifiedVehicleData';
import type { SyncMetrics } from '@/services/vehiclePosition/types';

interface FleetAnalyticsTabProps {
  metrics: VehicleMetrics;
  syncMetrics: SyncMetrics;
  vehicles: Vehicle[];
}

const FleetAnalyticsTab: React.FC<FleetAnalyticsTabProps> = ({
  metrics,
  syncMetrics,
  vehicles
}) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Fleet Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {metrics.total > 0 ? ((metrics.online / metrics.total) * 100).toFixed(1) : 0}%
              </div>
              <div className="text-xs text-gray-600">Fleet Utilization</div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {vehicles.length} / {metrics.total}
              </div>
              <div className="text-xs text-gray-600">Vehicles with Data</div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {syncMetrics.lastSyncTime.toLocaleTimeString()}
              </div>
              <div className="text-xs text-gray-600">Last Sync</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Real-Time Vehicle Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Online Vehicles</span>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="font-bold">{metrics.online}</span>
                  </div>
                </div>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Offline Vehicles</span>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    <span className="font-bold">{metrics.offline}</span>
                  </div>
                </div>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Alerts</span>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="font-bold">{metrics.alerts}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FleetAnalyticsTab;
