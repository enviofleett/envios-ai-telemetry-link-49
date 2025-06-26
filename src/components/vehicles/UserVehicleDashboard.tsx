
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import RealtimeMapTilerMap from '@/components/map/RealtimeMapTilerMap';
import type { VehicleData } from '@/types/vehicle';

interface UserVehicleDashboardProps {
  vehicles: VehicleData[];
  onVehicleSelect?: (vehicle: VehicleData) => void;
}

const UserVehicleDashboard: React.FC<UserVehicleDashboardProps> = ({
  vehicles,
  onVehicleSelect
}) => {
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleData | null>(null);

  const handleVehicleSelect = (vehicle: VehicleData) => {
    setSelectedVehicle(vehicle);
    if (onVehicleSelect) {
      onVehicleSelect(vehicle);
    }
  };

  // Extract device IDs from vehicles
  const deviceIds = vehicles
    .filter(vehicle => vehicle.gp51_device_id)
    .map(vehicle => vehicle.gp51_device_id);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Live Vehicle Tracking</CardTitle>
        </CardHeader>
        <CardContent>
          <RealtimeMapTilerMap
            deviceIds={deviceIds}
            height="400px"
            onVehicleSelect={handleVehicleSelect}
            selectedVehicle={selectedVehicle}
            autoFitBounds={true}
          />
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vehicles.map((vehicle) => (
          <Card key={vehicle.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">{vehicle.device_name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Device ID: {vehicle.gp51_device_id || 'Not assigned'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Status: {vehicle.status || 'Unknown'}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default UserVehicleDashboard;
