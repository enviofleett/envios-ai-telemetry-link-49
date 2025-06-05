
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { VehicleMetrics, Vehicle } from '@/services/unifiedVehicleData';
import type { SyncMetrics } from '@/services/vehiclePosition/types';

interface FleetPerformanceTabProps {
  metrics: VehicleMetrics;
  syncMetrics: SyncMetrics;
  vehicles: Vehicle[];
}

const FleetPerformanceTab: React.FC<FleetPerformanceTabProps> = ({
  metrics,
  syncMetrics,
  vehicles
}) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Sync Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{syncMetrics.totalVehicles}</div>
              <div className="text-xs text-gray-600">Total Vehicles</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">{syncMetrics.positionsUpdated}</div>
              <div className="text-xs text-gray-600">Positions Updated</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-red-600">{syncMetrics.errors}</div>
              <div className="text-xs text-gray-600">Sync Errors</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {new Date(metrics.lastUpdateTime).toLocaleTimeString()}
              </div>
              <div className="text-xs text-gray-600">Last Update</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Vehicle Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {vehicles.slice(0, 10).map((vehicle, index) => (
              <div key={vehicle.deviceid} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">{vehicle.devicename}</div>
                  <div className="text-sm text-gray-600">ID: {vehicle.deviceid}</div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-medium">
                      {vehicle.lastPosition?.speed ? `${vehicle.lastPosition.speed.toFixed(1)} km/h` : 'N/A'}
                    </div>
                    <div className="text-xs text-gray-600">Speed</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">
                      {vehicle.lastPosition?.updatetime ? 
                        new Date(vehicle.lastPosition.updatetime).toLocaleTimeString() : 'N/A'}
                    </div>
                    <div className="text-xs text-gray-600">Last Update</div>
                  </div>
                  <div className="text-center">
                    <div className={`w-3 h-3 rounded-full mx-auto ${
                      vehicle.lastPosition?.updatetime && 
                      new Date(vehicle.lastPosition.updatetime) > new Date(Date.now() - 30 * 60 * 1000) 
                        ? 'bg-green-500' : 'bg-gray-400'
                    }`}></div>
                    <div className="text-xs text-gray-600">Status</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FleetPerformanceTab;
