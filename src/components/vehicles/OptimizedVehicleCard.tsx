
import React, { memo, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePerformanceMonitoring } from '@/hooks/usePerformanceMonitoring';
import { 
  MapPin, 
  Clock, 
  Gauge, 
  Navigation,
  Wifi,
  WifiOff,
  AlertTriangle,
  Map,
  History,
  Settings,
  User
} from 'lucide-react';

interface VehiclePosition {
  lat: number;
  lon: number;
  speed: number;
  course: number;
  updatetime: string;
  statusText: string;
}

interface Vehicle {
  id: string;
  device_id: string;
  device_name: string;
  status?: string;
  sim_number?: string;
  notes?: string;
  is_active: boolean;
  last_position?: VehiclePosition;
  envio_user_id?: string;
  gp51_metadata?: any;
  created_at: string;
  updated_at: string;
}

interface OptimizedVehicleCardProps {
  vehicle: Vehicle;
  associatedUser?: string;
  onViewMap: (vehicle: Vehicle) => void;
  onViewHistory: (vehicle: Vehicle) => void;
  onViewDetails: (vehicle: Vehicle) => void;
  onSendCommand?: (vehicle: Vehicle) => void;
}

const OptimizedVehicleCard: React.FC<OptimizedVehicleCardProps> = memo(({ 
  vehicle, 
  associatedUser,
  onViewMap,
  onViewHistory,
  onViewDetails,
  onSendCommand
}) => {
  const { metrics } = usePerformanceMonitoring(`VehicleCard-${vehicle.id}`, {
    slowRenderThreshold: 50,
    onAlert: (alert) => {
      console.warn(`Vehicle card performance issue:`, alert);
    }
  });

  // Memoize expensive calculations
  const statusInfo = useMemo(() => {
    if (!vehicle.is_active) {
      return { 
        status: 'Inactive', 
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: WifiOff 
      };
    }
    
    const status = vehicle.status?.toLowerCase() || 'unknown';
    
    if (status.includes('alert') || status.includes('alarm')) {
      return { 
        status: 'Alert', 
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: AlertTriangle 
      };
    }
    
    if (status.includes('moving')) {
      return { 
        status: 'Moving', 
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: Navigation 
      };
    }
    
    if (status.includes('online') || status.includes('active')) {
      return { 
        status: 'Online', 
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: Wifi 
      };
    }
    
    return { 
      status: 'Offline', 
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: WifiOff 
    };
  }, [vehicle.is_active, vehicle.status]);

  const isOnline = useMemo(() => {
    if (!vehicle.last_position?.updatetime) return false;
    const lastUpdate = new Date(vehicle.last_position.updatetime);
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    return lastUpdate > thirtyMinutesAgo;
  }, [vehicle.last_position?.updatetime]);

  const formattedLocation = useMemo(() => {
    if (!vehicle.last_position) return null;
    return `${vehicle.last_position.lat.toFixed(6)}, ${vehicle.last_position.lon.toFixed(6)}`;
  }, [vehicle.last_position]);

  const formattedLastUpdate = useMemo(() => {
    if (!vehicle.last_position?.updatetime) return null;
    
    const date = new Date(vehicle.last_position.updatetime);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (diffMinutes < 1440) {
      return `${Math.floor(diffMinutes / 60)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  }, [vehicle.last_position?.updatetime]);

  // Memoize event handlers to prevent unnecessary re-renders
  const handleViewMap = useCallback(() => {
    onViewMap(vehicle);
  }, [onViewMap, vehicle]);

  const handleViewHistory = useCallback(() => {
    onViewHistory(vehicle);
  }, [onViewHistory, vehicle]);

  const handleViewDetails = useCallback(() => {
    onViewDetails(vehicle);
  }, [onViewDetails, vehicle]);

  const handleSendCommand = useCallback(() => {
    onSendCommand?.(vehicle);
  }, [onSendCommand, vehicle]);

  const StatusIcon = statusInfo.icon;

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 border-0 shadow-md bg-white">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-full">
              <Gauge className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                {vehicle.device_name}
              </CardTitle>
              <div className="text-sm text-gray-500">ID: {vehicle.device_id}</div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge className={`flex items-center space-x-1 ${statusInfo.color}`}>
              <StatusIcon className="w-3 h-3" />
              <span className="text-xs font-medium">{statusInfo.status}</span>
            </Badge>
            {isOnline && (
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                Live
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Vehicle Details */}
        <div className="space-y-2">
          {vehicle.sim_number && (
            <div className="text-sm">
              <span className="font-medium text-gray-600">SIM:</span> {vehicle.sim_number}
            </div>
          )}
          
          {associatedUser && (
            <div className="flex items-center gap-2 text-sm">
              <User className="w-3 h-3 text-gray-400" />
              <span className="text-gray-600">{associatedUser}</span>
            </div>
          )}
        </div>

        {/* Location & Status */}
        {vehicle.last_position ? (
          <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-blue-500" />
              <span className="text-gray-700">{formattedLocation}</span>
            </div>
            
            {vehicle.last_position.speed !== undefined && (
              <div className="flex items-center gap-2 text-sm">
                <Gauge className="w-4 h-4 text-green-500" />
                <span className="text-gray-700">
                  {vehicle.last_position.speed} km/h
                </span>
              </div>
            )}
            
            {vehicle.last_position.course !== undefined && (
              <div className="flex items-center gap-2 text-sm">
                <Navigation className="w-4 h-4 text-purple-500" />
                <span className="text-gray-700">
                  {vehicle.last_position.course}°
                </span>
              </div>
            )}
            
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-orange-500" />
              <span className="text-gray-700">{formattedLastUpdate}</span>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 bg-gray-50 rounded-lg">
            <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No location data available</p>
          </div>
        )}

        {/* Notes */}
        {vehicle.notes && (
          <div className="text-sm">
            <span className="font-medium text-gray-600">Notes:</span>
            <p className="text-gray-600 mt-1 text-xs">{vehicle.notes}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleViewMap}
            className="flex items-center gap-1"
          >
            <Map className="w-3 h-3" />
            Live Map
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleViewHistory}
            className="flex items-center gap-1"
          >
            <History className="w-3 h-3" />
            History
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleViewDetails}
            className="flex items-center gap-1 col-span-1"
          >
            <Settings className="w-3 h-3" />
            Details
          </Button>
          
          {onSendCommand && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSendCommand}
              className="flex items-center gap-1"
            >
              <Settings className="w-3 h-3" />
              Command
            </Button>
          )}
        </div>

        {/* Performance Debug Info (only in development) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="text-xs text-gray-400 border-t pt-2">
            Renders: {metrics.renderCount} | Avg: {metrics.averageRenderTime.toFixed(1)}ms
          </div>
        )}
      </CardContent>
    </Card>
  );
});

OptimizedVehicleCard.displayName = 'OptimizedVehicleCard';

export default OptimizedVehicleCard;
