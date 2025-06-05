
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MapPin, 
  Navigation, 
  Clock, 
  Gauge,
  User,
  Wifi,
  WifiOff,
  AlertTriangle
} from 'lucide-react';
import type { Vehicle } from '@/services/unifiedVehicleData';

interface LiveVehicleCardProps {
  vehicle: Vehicle;
}

const LiveVehicleCard: React.FC<LiveVehicleCardProps> = ({ vehicle }) => {
  const getVehicleStatus = () => {
    if (!vehicle.lastPosition?.updatetime) return 'offline';
    
    const lastUpdate = new Date(vehicle.lastPosition.updatetime);
    const now = new Date();
    const minutesSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);
    
    if (minutesSinceUpdate <= 5) return 'online';
    if (minutesSinceUpdate <= 30) return 'idle';
    return 'offline';
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      online: { 
        label: 'Online', 
        variant: 'default' as const, 
        icon: <Wifi className="h-3 w-3" />,
        color: 'bg-green-500'
      },
      idle: { 
        label: 'Idle', 
        variant: 'secondary' as const, 
        icon: <Clock className="h-3 w-3" />,
        color: 'bg-yellow-500'
      },
      offline: { 
        label: 'Offline', 
        variant: 'secondary' as const, 
        icon: <WifiOff className="h-3 w-3" />,
        color: 'bg-gray-400'
      }
    };
    
    const config = configs[status as keyof typeof configs] || configs.offline;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <div className={`w-2 h-2 rounded-full ${config.color}`}></div>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const formatCoordinates = (lat: number, lon: number) => {
    return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
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

  const status = getVehicleStatus();
  const position = vehicle.lastPosition;
  const hasAlert = vehicle.status?.toLowerCase().includes('alert') || 
                  vehicle.status?.toLowerCase().includes('alarm');

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{vehicle.devicename}</h3>
            <p className="text-sm text-gray-600">ID: {vehicle.deviceid}</p>
            {vehicle.envio_users && (
              <div className="flex items-center gap-1 mt-1">
                <User className="h-3 w-3 text-gray-400" />
                <span className="text-xs text-gray-500">{vehicle.envio_users.name}</span>
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            {getStatusBadge(status)}
            {hasAlert && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Alert
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="flex items-center gap-1 mb-1">
              <MapPin className="h-3 w-3 text-gray-400" />
              <span className="text-gray-600">Location</span>
            </div>
            {position?.lat && position?.lon ? (
              <p className="font-mono text-xs">
                {formatCoordinates(position.lat, position.lon)}
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
            <p className="font-medium">
              {position?.speed !== undefined ? `${position.speed} km/h` : 'N/A'}
            </p>
          </div>

          <div>
            <div className="flex items-center gap-1 mb-1">
              <Navigation className="h-3 w-3 text-gray-400" />
              <span className="text-gray-600">Course</span>
            </div>
            <p className="font-medium">
              {position?.course !== undefined ? `${position.course}°` : 'N/A'}
            </p>
          </div>

          <div>
            <div className="flex items-center gap-1 mb-1">
              <Clock className="h-3 w-3 text-gray-400" />
              <span className="text-gray-600">Last Update</span>
            </div>
            <p className="text-xs">
              {position?.updatetime 
                ? formatLastUpdate(position.updatetime)
                : 'No data'
              }
            </p>
          </div>
        </div>

        {position?.statusText && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs text-gray-600">
              Status: <span className="font-medium">{position.statusText}</span>
            </p>
          </div>
        )}

        {status === 'online' && position?.lat && position?.lon && (
          <div className="mt-3 pt-3 border-t">
            <Button size="sm" variant="outline" className="w-full">
              <MapPin className="h-3 w-3 mr-1" />
              View on Map
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LiveVehicleCard;
