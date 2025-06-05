
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';
import type { VehicleMetrics, Vehicle } from '@/services/unifiedVehicleData';

interface FleetQuickStatsProps {
  metrics: VehicleMetrics;
  vehicles: Vehicle[];
  isLoading: boolean;
}

const FleetQuickStats: React.FC<FleetQuickStatsProps> = ({
  metrics,
  vehicles,
  isLoading
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Quick Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-6 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate average speed from vehicles with recent position data
  const vehiclesWithSpeed = vehicles.filter(v => 
    v.lastPosition?.speed !== undefined && 
    v.lastPosition?.updatetime &&
    new Date(v.lastPosition.updatetime) > new Date(Date.now() - 30 * 60 * 1000)
  );
  
  const averageSpeed = vehiclesWithSpeed.length > 0 
    ? vehiclesWithSpeed.reduce((sum, v) => sum + (v.lastPosition?.speed || 0), 0) / vehiclesWithSpeed.length
    : 0;

  const utilizationRate = metrics.total > 0 ? (metrics.online / metrics.total) * 100 : 0;

  // Calculate vehicles with position data
  const vehiclesWithPositionData = vehicles.filter(v => v.lastPosition?.updatetime).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Quick Stats
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span>Fleet Utilization</span>
            <span className="font-medium">{utilizationRate.toFixed(1)}%</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Average Speed</span>
            <span className="font-medium">{averageSpeed.toFixed(1)} km/h</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Vehicles with Data</span>
            <span className="font-medium">{vehiclesWithPositionData} / {metrics.total}</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Data Coverage</span>
            <span className="font-medium">
              {metrics.total > 0 ? ((vehiclesWithPositionData / metrics.total) * 100).toFixed(1) : 0}%
            </span>
          </div>
          
          {/* Additional insights */}
          <div className="mt-6 pt-4 border-t">
            <div className="text-sm text-gray-600 space-y-2">
              <div className="flex justify-between">
                <span>Last sync:</span>
                <span>{metrics.lastUpdateTime.toLocaleTimeString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Active tracking:</span>
                <span className={vehiclesWithSpeed.length > 0 ? 'text-green-600' : 'text-gray-400'}>
                  {vehiclesWithSpeed.length} vehicles
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FleetQuickStats;
