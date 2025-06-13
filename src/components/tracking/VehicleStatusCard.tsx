
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Car, 
  MapPin, 
  Clock, 
  Gauge,
  Eye,
  Route,
  Bell
} from 'lucide-react';
import type { VehicleData } from '@/types/vehicle';

interface VehicleStatusCardProps {
  vehicle: VehicleData;
  onViewDetails?: (vehicle: VehicleData) => void;
  onViewRoute?: (vehicle: VehicleData) => void;
  onSendAlert?: (vehicle: VehicleData) => void;
  className?: string;
}

const VehicleStatusCard: React.FC<VehicleStatusCardProps> = ({
  vehicle,
  onViewDetails,
  onViewRoute,
  onSendAlert,
  className
}) => {
  const getVehicleStatus = (vehicle: VehicleData) => {
    if (!vehicle.last_position?.timestamp) return 'offline';
    
    const lastUpdate = new Date(vehicle.last_position.timestamp);
    const now = new Date();
    const minutesSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);
    
    if (minutesSinceUpdate <= 5) return 'online';
    if (minutesSinceUpdate <= 30) return 'idle';
    return 'offline';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
        return <Badge className="bg-green-100 text-green-800">Online</Badge>;
      case 'idle':
        return <Badge className="bg-yellow-100 text-yellow-800">Idle</Badge>;
      case 'offline':
        return <Badge className="bg-red-100 text-red-800">Offline</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const formatLastUpdate = (timestamp: string) => {
    const now = new Date();
    const updateTime = new Date(timestamp);
    const diffMinutes = Math.floor((now.getTime() - updateTime.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return updateTime.toLocaleDateString();
  };

  const formatCoordinates = (lat: number, lng: number) => {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  };

  const status = getVehicleStatus(vehicle);
  const speed = vehicle.last_position?.speed || 0;
  const position = vehicle.last_position;

  return (
    <Card className={`hover:shadow-lg transition-shadow ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            <span>{vehicle.device_name}</span>
          </div>
          {getStatusBadge(status)}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Location Info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="flex items-center gap-1 mb-1">
              <MapPin className="h-3 w-3 text-gray-400" />
              <span className="text-gray-600">Location</span>
            </div>
            {position?.lat && position?.lng ? (
              <p className="font-mono text-xs">
                {formatCoordinates(position.lat, position.lng)}
              </p>
            ) : (
              <p className="text-gray-400 text-xs">No location data</p>
            )}
          </div>

          <div>
            <div className="flex items-center gap-1 mb-1">
              <Gauge className="h-3 w-3 text-gray-400" />
              <span className="text-gray-600">Speed</span>
            </div>
            <p className="font-medium">{speed} km/h</p>
          </div>
        </div>

        {/* Last Update */}
        <div>
          <div className="flex items-center gap-1 mb-1">
            <Clock className="h-3 w-3 text-gray-400" />
            <span className="text-gray-600 text-sm">Last Update</span>
          </div>
          <p className="text-sm">
            {position?.timestamp 
              ? formatLastUpdate(position.timestamp)
              : 'No data'
            }
          </p>
        </div>

        {/* Additional Info */}
        <div className="text-xs text-gray-500">
          <p>Device ID: {vehicle.device_id}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails?.(vehicle)}
            className="flex-1"
          >
            <Eye className="h-3 w-3 mr-1" />
            Details
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewRoute?.(vehicle)}
            className="flex-1"
          >
            <Route className="h-3 w-3 mr-1" />
            Route
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSendAlert?.(vehicle)}
            className="flex-1"
          >
            <Bell className="h-3 w-3 mr-1" />
            Alert
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default VehicleStatusCard;
