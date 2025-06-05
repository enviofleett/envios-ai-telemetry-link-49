
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Navigation, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { locationServices } from '@/services/locationServices';
import type { Vehicle } from '@/services/unifiedVehicleData';

interface VehicleLocationCardProps {
  vehicle: Vehicle;
  showMap?: boolean;
  compact?: boolean;
}

const VehicleLocationCard: React.FC<VehicleLocationCardProps> = ({
  vehicle,
  showMap = false,
  compact = false
}) => {
  const [address, setAddress] = useState<string>('');
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);

  useEffect(() => {
    if (vehicle.lastPosition?.lat && vehicle.lastPosition?.lon) {
      setIsLoadingAddress(true);
      locationServices.reverseGeocode(
        vehicle.lastPosition.lat,
        vehicle.lastPosition.lon
      ).then(addr => {
        setAddress(addr);
        setIsLoadingAddress(false);
      }).catch(() => {
        setIsLoadingAddress(false);
      });
    }
  }, [vehicle.lastPosition]);

  const getStatusBadge = () => {
    if (!vehicle.lastPosition?.updatetime) return 'offline';
    
    const lastUpdate = new Date(vehicle.lastPosition.updatetime);
    const now = new Date();
    const minutesSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);
    
    if (minutesSinceUpdate <= 5) return 'online';
    if (minutesSinceUpdate <= 30) return 'idle';
    return 'offline';
  };

  const status = getStatusBadge();
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'idle': return 'bg-yellow-500';
      default: return 'bg-gray-400';
    }
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

  if (compact) {
    return (
      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
        <div className={`w-2 h-2 rounded-full ${getStatusColor(status)}`}></div>
        <MapPin className="h-3 w-3 text-gray-400" />
        <span className="text-xs text-gray-600 truncate">
          {isLoadingAddress ? 'Loading...' : (address || 'No location')}
        </span>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <h4 className="font-medium">{vehicle.devicename}</h4>
          <Badge variant={status === 'online' ? 'default' : 'secondary'}>
            <div className={`w-2 h-2 rounded-full mr-1 ${getStatusColor(status)}`}></div>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        </div>

        {vehicle.lastPosition ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">
                {isLoadingAddress ? 'Loading address...' : address}
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <Navigation className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">
                {vehicle.lastPosition.lat.toFixed(6)}, {vehicle.lastPosition.lon.toFixed(6)}
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">
                {formatLastUpdate(vehicle.lastPosition.updatetime)}
              </span>
            </div>

            {vehicle.lastPosition.speed !== undefined && (
              <div className="text-sm">
                <span className="text-gray-600">Speed: </span>
                <span className="font-medium">{vehicle.lastPosition.speed} km/h</span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-gray-500">No location data available</div>
        )}
      </CardContent>
    </Card>
  );
};

export default VehicleLocationCard;
