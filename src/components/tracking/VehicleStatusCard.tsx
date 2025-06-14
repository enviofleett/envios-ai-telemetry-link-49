import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Car, 
  MapPin, 
  Activity, 
  Clock, 
  Fuel,
  MoreHorizontal,
  Navigation,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { VehicleData } from '@/types/vehicle';

interface VehicleStatusCardProps {
  vehicle: VehicleData;
  isSelected?: boolean;
  onSelect?: () => void;
  onViewMap?: () => void;
  onViewHistory?: () => void;
  onViewStats?: () => void;
  className?: string;
}

const VehicleStatusCard: React.FC<VehicleStatusCardProps> = ({
  vehicle,
  isSelected = false,
  onSelect,
  onViewMap,
  onViewHistory,
  onViewStats,
  className
}) => {
  const getVehicleStatus = () => {
    if (!vehicle.last_position?.timestamp) return 'offline';
    
    const lastUpdate = new Date(vehicle.last_position.timestamp);
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

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'online': return 'default';
      case 'idle': return 'secondary';
      default: return 'outline';
    }
  };

  const formatLastUpdate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const status = getVehicleStatus();
  const hasAlerts = Math.random() > 0.8; // Mock alert condition

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-md",
        isSelected && "ring-2 ring-blue-500 ring-opacity-50",
        className
      )}
      onClick={onSelect}
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Car className="h-5 w-5 text-blue-600" />
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900">{vehicle.device_name}</h3>
              <p className="text-sm text-gray-500">ID: {vehicle.device_id}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasAlerts && (
              <AlertTriangle className="h-4 w-4 text-red-500" />
            )}
            <div className={`w-2 h-2 rounded-full ${getStatusColor(status)}`}></div>
          </div>
        </div>

        {/* Status and Location */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between">
            <Badge variant={getStatusBadgeVariant(status)}>
              {status}
            </Badge>
            
            {vehicle.last_position && (
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Activity className="h-3 w-3" />
                <span>{vehicle.last_position.speed || 0} km/h</span>
              </div>
            )}
          </div>

          {vehicle.last_position && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="h-3 w-3" />
              <span className="truncate">
                {vehicle.last_position.latitude.toFixed(4)}, {vehicle.last_position.longitude.toFixed(4)}
              </span>
            </div>
          )}
        </div>

        {/* Last Update */}
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
          <Clock className="h-3 w-3" />
          <span>
            Last update: {vehicle.last_position?.timestamp ? 
              formatLastUpdate(vehicle.last_position.timestamp) : 
              'Unknown'
            }
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              onViewMap?.();
            }}
          >
            <Navigation className="h-3 w-3 mr-1" />
            Map
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              onViewHistory?.();
            }}
          >
            <Clock className="h-3 w-3 mr-1" />
            History
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onViewStats?.();
            }}
          >
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        </div>

        {/* Mock fuel/battery indicator */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              <Fuel className="h-3 w-3 text-green-600" />
              <span>Fuel: {Math.floor(Math.random() * 40 + 60)}%</span>
            </div>
            <span className="text-gray-500">
              {Math.floor(Math.random() * 500 + 100)} km today
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VehicleStatusCard;
