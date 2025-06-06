
import React, { memo, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { usePerformanceMonitoring } from '@/hooks/usePerformanceMonitoring';
import { useVehicleCardLogic } from './hooks/useVehicleCardLogic';
import VehicleCardHeader from './VehicleCardHeader';
import VehicleCardDetails from './VehicleCardDetails';
import VehicleCardLocation from './VehicleCardLocation';
import VehicleCardActions from './VehicleCardActions';

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
  const { metrics, logPerformanceWarning } = usePerformanceMonitoring(`VehicleCard-${vehicle.id}`);
  
  // Log performance warning if render time is too high
  logPerformanceWarning(50);

  // Use custom hook for vehicle card logic
  const {
    statusInfo,
    isOnline,
    formattedLocation,
    formattedLastUpdate
  } = useVehicleCardLogic(vehicle);

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

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 border-0 shadow-md bg-white">
      <VehicleCardHeader
        deviceName={vehicle.device_name}
        deviceId={vehicle.device_id}
        statusInfo={statusInfo}
        isOnline={isOnline}
      />
      
      <CardContent className="space-y-4">
        <VehicleCardDetails
          simNumber={vehicle.sim_number}
          associatedUser={associatedUser}
        />

        <VehicleCardLocation
          lastPosition={vehicle.last_position}
          formattedLocation={formattedLocation}
          formattedLastUpdate={formattedLastUpdate}
        />

        {/* Notes */}
        {vehicle.notes && (
          <div className="text-sm">
            <span className="font-medium text-gray-600">Notes:</span>
            <p className="text-gray-600 mt-1 text-xs">{vehicle.notes}</p>
          </div>
        )}

        <VehicleCardActions
          vehicle={vehicle}
          onViewMap={handleViewMap}
          onViewHistory={handleViewHistory}
          onViewDetails={handleViewDetails}
          onSendCommand={onSendCommand ? handleSendCommand : undefined}
        />

        {/* Performance Debug Info (only in development) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="text-xs text-gray-400 border-t pt-2">
            Re-renders: {metrics.reRenderCount} | Render time: {metrics.renderTime.toFixed(1)}ms
          </div>
        )}
      </CardContent>
    </Card>
  );
});

OptimizedVehicleCard.displayName = 'OptimizedVehicleCard';

export default OptimizedVehicleCard;
