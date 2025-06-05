
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Car } from 'lucide-react';
import type { VehicleMetrics, Vehicle } from '@/services/unifiedVehicleData';

interface VehicleStatusDistributionProps {
  metrics: VehicleMetrics;
  vehiclesByStatus: {
    online: Vehicle[];
    offline: Vehicle[];
    alerts: Vehicle[];
  };
  isLoading: boolean;
}

const VehicleStatusDistribution: React.FC<VehicleStatusDistributionProps> = ({
  metrics,
  vehiclesByStatus,
  isLoading
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Fleet Status Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-6 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Car className="h-5 w-5" />
          Fleet Status Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span>Online Vehicles</span>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="font-medium">{metrics.online}</span>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span>Offline Vehicles</span>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
              <span className="font-medium">{metrics.offline}</span>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span>Maintenance Alerts</span>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="font-medium">{metrics.alerts}</span>
            </div>
          </div>
          
          {/* Progress bars */}
          <div className="mt-6 space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Online</span>
                <span>{metrics.total > 0 ? ((metrics.online / metrics.total) * 100).toFixed(1) : 0}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${metrics.total > 0 ? (metrics.online / metrics.total) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Offline</span>
                <span>{metrics.total > 0 ? ((metrics.offline / metrics.total) * 100).toFixed(1) : 0}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gray-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${metrics.total > 0 ? (metrics.offline / metrics.total) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VehicleStatusDistribution;
