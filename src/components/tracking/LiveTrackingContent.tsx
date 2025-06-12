import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Car, MapPin } from 'lucide-react';
import LiveVehicleCard from './LiveVehicleCard';
import type { VehicleData } from '@/types/vehicle';

interface LiveTrackingContentProps {
  viewMode: 'cards' | 'map';
  vehicles: VehicleData[];
}

const LiveTrackingContent: React.FC<LiveTrackingContentProps> = ({
  viewMode,
  vehicles
}) => {
  if (viewMode === 'map') {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="h-96 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <MapPin className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Map View Coming Soon</h3>
              <p className="text-gray-500">
                Map integration will be available here after restructuring
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (vehicles.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No vehicles found matching your search criteria.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {vehicles.map((vehicle) => (
        <LiveVehicleCard key={vehicle.deviceId} vehicle={vehicle} />
      ))}
    </div>
  );
};

export default LiveTrackingContent;
