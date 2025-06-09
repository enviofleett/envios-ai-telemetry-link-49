
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Gauge, Navigation, Zap } from 'lucide-react';
import type { Vehicle } from '@/services/unifiedVehicleData';

interface VehicleInfoPanelProps {
  vehicle: Vehicle | null;
  address: string;
}

const VehicleInfoPanel: React.FC<VehicleInfoPanelProps> = ({ vehicle, address }) => {
  if (!vehicle) {
    return (
      <Card className="bg-white border border-gray-lighter shadow-sm">
        <CardContent className="p-4">
          <div className="text-center text-gray-500">
            <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">Select a vehicle to view details</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getVehicleStatus = (vehicle: Vehicle) => {
    if (!vehicle.lastPosition?.updatetime) return 'offline';
    
    const lastUpdate = new Date(vehicle.lastPosition.updatetime);
    const now = new Date();
    const minutesSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);
    
    if (minutesSinceUpdate > 5) return 'offline';
    if (vehicle.lastPosition.speed > 0) return 'moving';
    return 'online';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'moving':
        return <Badge className="bg-blue-100 text-blue-800 text-xs">Moving</Badge>;
      case 'online':
        return <Badge className="bg-green-100 text-green-800 text-xs">Online</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">Offline</Badge>;
    }
  };

  const getIgnitionStatus = (vehicle: Vehicle) => {
    const statusText = vehicle.lastPosition?.statusText?.toLowerCase() || '';
    const speed = vehicle.lastPosition?.speed || 0;
    
    if (statusText.includes('ignition on') || statusText.includes('engine on')) return 'ON';
    if (statusText.includes('ignition off') || statusText.includes('engine off')) return 'OFF';
    if (speed > 0) return 'ON';
    
    if (vehicle.lastPosition?.updatetime) {
      const lastUpdate = new Date(vehicle.lastPosition.updatetime);
      const now = new Date();
      const minutesSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);
      if (minutesSinceUpdate <= 5) return 'ON';
    }
    
    return 'OFF';
  };

  const formatLastUpdate = (updatetime: string) => {
    const date = new Date(updatetime);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const status = getVehicleStatus(vehicle);
  const ignitionStatus = getIgnitionStatus(vehicle);
  const plateNumber = vehicle.plateNumber || vehicle.devicename;

  return (
    <Card className="bg-white border border-gray-lighter shadow-sm">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                status === 'moving' ? 'bg-blue-500' :
                status === 'online' ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <div>
                <h3 className="font-semibold text-base">{vehicle.devicename}</h3>
                <p className="text-sm text-gray-600">{plateNumber}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(status)}
              <div className="flex items-center gap-1 text-xs">
                <Zap className={`h-3 w-3 ${ignitionStatus === 'ON' ? 'text-green-500' : 'text-gray-400'}`} />
                <span className={ignitionStatus === 'ON' ? 'text-green-700' : 'text-gray-500'}>
                  IGN {ignitionStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">Location</p>
                <p className="text-sm text-gray-600">{address}</p>
                {vehicle.lastPosition && (
                  <p className="text-xs text-gray-500 mt-1">
                    {vehicle.lastPosition.lat.toFixed(6)}, {vehicle.lastPosition.lon.toFixed(6)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Vehicle Stats */}
          <div className="grid grid-cols-3 gap-4 pt-2 border-t border-gray-200">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Gauge className="h-3 w-3 text-gray-400" />
                <span className="text-xs text-gray-500">Speed</span>
              </div>
              <p className="text-sm font-medium">{vehicle.lastPosition?.speed || 0} km/h</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Navigation className="h-3 w-3 text-gray-400" />
                <span className="text-xs text-gray-500">Course</span>
              </div>
              <p className="text-sm font-medium">{vehicle.lastPosition?.course || 0}°</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Clock className="h-3 w-3 text-gray-400" />
                <span className="text-xs text-gray-500">Updated</span>
              </div>
              <p className="text-sm font-medium">
                {vehicle.lastPosition?.updatetime 
                  ? formatLastUpdate(vehicle.lastPosition.updatetime)
                  : 'No data'
                }
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VehicleInfoPanel;
