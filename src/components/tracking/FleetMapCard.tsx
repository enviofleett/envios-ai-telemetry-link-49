
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Map, MapPin, Navigation } from 'lucide-react';

interface FleetMapCardProps {
  vehicles: any[];
  onVehicleSelect: (vehicle: any) => void;
}

export default function FleetMapCard({ vehicles, onVehicleSelect }: FleetMapCardProps) {
  // Filter vehicles with valid positions
  const vehiclesWithPositions = vehicles.filter(v => 
    v.lastPosition?.lat && v.lastPosition?.lon
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Map className="h-5 w-5" />
          Fleet Map
          <Badge variant="secondary">
            {vehiclesWithPositions.length} vehicles tracked
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {vehiclesWithPositions.length === 0 ? (
          <div className="text-center py-8">
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No vehicles with GPS data available</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground mb-4">
              Map integration coming soon. Vehicle positions available below:
            </p>
            
            {/* Vehicle Position List */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {vehiclesWithPositions.map((vehicle) => (
                <div 
                  key={vehicle.deviceId}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                  onClick={() => onVehicleSelect(vehicle)}
                >
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${
                      vehicle.status === 'moving' ? 'bg-blue-500' :
                      vehicle.status === 'idle' ? 'bg-yellow-500' :
                      vehicle.status === 'online' ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <span className="text-sm font-medium">
                      {vehicle.deviceName || `Device ${vehicle.deviceId}`}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Navigation className="h-3 w-3" />
                    <span>{vehicle.lastPosition.speed || 0} km/h</span>
                    <MapPin className="h-3 w-3" />
                    <span>
                      {vehicle.lastPosition.lat?.toFixed(4)}, {vehicle.lastPosition.lon?.toFixed(4)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
