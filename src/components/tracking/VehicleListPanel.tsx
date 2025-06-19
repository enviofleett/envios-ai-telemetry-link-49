
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { VehicleData } from '@/types/vehicle';
import { MapPin, Navigation, Clock } from 'lucide-react';

export interface VehicleListPanelProps {
  vehicles: VehicleData[];
  selectedVehicle: VehicleData | null;
  onVehicleSelect: (vehicle: VehicleData) => void;
  showTrails: boolean;
  getVehicleTrail: (deviceId: string) => any[];
}

export const VehicleListPanel: React.FC<VehicleListPanelProps> = ({
  vehicles,
  selectedVehicle,
  onVehicleSelect,
  showTrails,
  getVehicleTrail
}) => {
  const getStatusColor = (vehicle: VehicleData) => {
    if (vehicle.isOnline && vehicle.isMoving) return 'bg-green-500';
    if (vehicle.isOnline) return 'bg-yellow-500';
    return 'bg-gray-400';
  };

  const getStatusText = (vehicle: VehicleData) => {
    if (vehicle.isOnline && vehicle.isMoving) return 'Moving';
    if (vehicle.isOnline) return 'Online';
    return 'Offline';
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Navigation className="h-5 w-5" />
          Vehicle List ({vehicles.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {vehicles.map((vehicle) => {
            const trail = showTrails ? getVehicleTrail(vehicle.device_id) : [];
            const isSelected = selectedVehicle?.id === vehicle.id;
            
            return (
              <Button
                key={vehicle.id}
                variant={isSelected ? "default" : "outline"}
                className="w-full p-4 h-auto flex flex-col items-start gap-2"
                onClick={() => onVehicleSelect(vehicle)}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-medium">{vehicle.device_name}</span>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(vehicle)}`} />
                    <Badge variant="outline" className="text-xs">
                      {getStatusText(vehicle)}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-xs text-muted-foreground w-full">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span>{vehicle.device_id}</span>
                  </div>
                  
                  {vehicle.speed && (
                    <div className="flex items-center gap-1">
                      <Navigation className="h-3 w-3" />
                      <span>{vehicle.speed} km/h</span>
                    </div>
                  )}
                  
                  {showTrails && trail.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{trail.length} points</span>
                    </div>
                  )}
                </div>
                
                {vehicle.last_position && (
                  <div className="text-xs text-muted-foreground w-full">
                    Last update: {new Date(vehicle.last_position.timestamp || '').toLocaleTimeString()}
                  </div>
                )}
              </Button>
            );
          })}
          
          {vehicles.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              No vehicles found matching current filters
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default VehicleListPanel;
