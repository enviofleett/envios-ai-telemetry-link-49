
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, Activity } from 'lucide-react';
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'idle': return 'bg-yellow-500';
      default: return 'bg-gray-400';
    }
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
              Fleet Map View
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-100 rounded-lg p-8 text-center min-h-[500px] flex flex-col items-center justify-center">
              <MapPin className="h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Interactive Map Coming Soon</h3>
              <p className="text-gray-500 mb-6">
                Real-time vehicle positions will be displayed on an interactive map
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{vehiclesWithPosition.length}</div>
                  <div>Vehicles with GPS</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{statusCounts.online || 0}</div>
                  <div>Currently Online</div>
                </div>
              </div>
            </div>
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
                            {vehicle.lastPosition?.speed} km/h
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
