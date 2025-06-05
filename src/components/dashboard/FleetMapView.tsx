
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, Navigation, TrendingUp } from 'lucide-react';
import MapTilerMap from '@/components/map/MapTilerMap';
import type { Vehicle } from '@/services/unifiedVehicleData';

interface FleetMapViewProps {
  vehicles: Vehicle[];
  onVehicleSelect: (vehicle: Vehicle) => void;
}

const FleetMapView: React.FC<FleetMapViewProps> = ({ vehicles, onVehicleSelect }) => {
  const vehiclesWithPosition = vehicles.filter(v => v.lastPosition?.lat && v.lastPosition?.lon);
  
  const getVehicleStatus = (vehicle: Vehicle) => {
    if (!vehicle.lastPosition?.updatetime) return 'offline';
    
    const lastUpdate = new Date(vehicle.lastPosition.updatetime);
    const now = new Date();
    const minutesSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);
    
    if (minutesSinceUpdate <= 5) return 'online';
    if (minutesSinceUpdate <= 30) return 'idle';
    return 'offline';
  };

  const statusCounts = vehicles.reduce((acc, vehicle) => {
    const status = getVehicleStatus(vehicle);
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Map Container */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Navigation className="h-5 w-5" />
              Live Fleet Map
              <Badge variant="outline" className="ml-2">
                {vehiclesWithPosition.length} vehicles
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <MapTilerMap
              vehicles={vehiclesWithPosition}
              onVehicleSelect={onVehicleSelect}
              height="500px"
              className="rounded-none border-0"
            />
          </CardContent>
        </Card>
      </div>

      {/* Vehicle Status Panel */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Live Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span>Online</span>
                </div>
                <Badge variant="outline">{statusCounts.online || 0}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span>Idle</span>
                </div>
                <Badge variant="outline">{statusCounts.idle || 0}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                  <span>Offline</span>
                </div>
                <Badge variant="outline">{statusCounts.offline || 0}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fleet Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Fleet Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Vehicles:</span>
                <span className="font-semibold">{vehicles.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">With GPS:</span>
                <span className="font-semibold">{vehiclesWithPosition.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Moving:</span>
                <span className="font-semibold">
                  {vehiclesWithPosition.filter(v => 
                    v.lastPosition?.speed && v.lastPosition.speed > 0
                  ).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">GPS Coverage:</span>
                <span className="font-semibold">
                  {vehicles.length > 0 ? 
                    ((vehiclesWithPosition.length / vehicles.length) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {vehiclesWithPosition
                .sort((a, b) => {
                  const timeA = new Date(a.lastPosition?.updatetime || 0).getTime();
                  const timeB = new Date(b.lastPosition?.updatetime || 0).getTime();
                  return timeB - timeA;
                })
                .slice(0, 10)
                .map((vehicle) => {
                  const status = getVehicleStatus(vehicle);
                  const getStatusColor = (status: string) => {
                    switch (status) {
                      case 'online': return 'bg-green-500';
                      case 'idle': return 'bg-yellow-500';
                      default: return 'bg-gray-400';
                    }
                  };

                  return (
                    <div 
                      key={vehicle.deviceid}
                      className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                      onClick={() => onVehicleSelect(vehicle)}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(status)}`}></div>
                        <div>
                          <div className="font-medium text-sm">{vehicle.devicename}</div>
                          <div className="text-xs text-gray-500">
                            {vehicle.lastPosition?.speed || 0} km/h
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {vehicle.lastPosition?.updatetime 
                          ? new Date(vehicle.lastPosition.updatetime).toLocaleTimeString()
                          : 'No data'
                        }
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FleetMapView;
