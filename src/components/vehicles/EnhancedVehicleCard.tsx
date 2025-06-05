
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Eye, Navigation, Settings, MessageSquare } from 'lucide-react';
import VehicleLocationCard from './VehicleLocationCard';
import type { Vehicle } from '@/services/unifiedVehicleData';

interface EnhancedVehicleCardProps {
  vehicle: Vehicle;
  associatedUser?: string;
  onViewMap?: (vehicle: Vehicle) => void;
  onViewHistory?: (vehicle: Vehicle) => void;
  onViewDetails?: (vehicle: Vehicle) => void;
  onSendCommand?: (vehicle: Vehicle) => void;
  showLocationDetails?: boolean;
}

const EnhancedVehicleCard: React.FC<EnhancedVehicleCardProps> = ({
  vehicle,
  associatedUser,
  onViewMap,
  onViewHistory,
  onViewDetails,
  onSendCommand,
  showLocationDetails = true
}) => {
  const getVehicleStatus = () => {
    if (!vehicle.lastPosition?.updatetime) return 'offline';
    
    const lastUpdate = new Date(vehicle.lastPosition.updatetime);
    const now = new Date();
    const minutesSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);
    
    if (minutesSinceUpdate <= 5) return 'online';
    if (minutesSinceUpdate <= 30) return 'idle';
    return 'offline';
  };

  const status = getVehicleStatus();
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'idle': return 'bg-yellow-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{vehicle.devicename}</CardTitle>
            <p className="text-sm text-gray-600 mt-1">ID: {vehicle.deviceid}</p>
            {associatedUser && (
              <p className="text-sm text-blue-600 mt-1">User: {associatedUser}</p>
            )}
          </div>
          <Badge variant={status === 'online' ? 'default' : 'secondary'} className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${getStatusColor(status)}`}></div>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Location Information */}
        {showLocationDetails && (
          <VehicleLocationCard 
            vehicle={vehicle}
            compact={true}
          />
        )}

        {/* Vehicle Metrics */}
        {vehicle.lastPosition && (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-1">
              <Navigation className="h-3 w-3 text-gray-400" />
              <span className="text-gray-600">Speed:</span>
              <span className="font-medium">{vehicle.lastPosition.speed || 0} km/h</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-gray-600">Course:</span>
              <span className="font-medium">{vehicle.lastPosition.course || 0}°</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 pt-3 border-t">
          {onViewMap && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onViewMap(vehicle)}
              className="flex items-center gap-1"
            >
              <MapPin className="h-3 w-3" />
              Map
            </Button>
          )}
          
          {onViewDetails && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onViewDetails(vehicle)}
              className="flex items-center gap-1"
            >
              <Eye className="h-3 w-3" />
              Details
            </Button>
          )}
          
          {onViewHistory && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onViewHistory(vehicle)}
              className="flex items-center gap-1"
            >
              <Settings className="h-3 w-3" />
              History
            </Button>
          )}
          
          {onSendCommand && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onSendCommand(vehicle)}
              className="flex items-center gap-1"
            >
              <MessageSquare className="h-3 w-3" />
              Command
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedVehicleCard;
