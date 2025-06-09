
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Car } from 'lucide-react';
import LiveVehicleCard from './LiveVehicleCard';
import LiveTrackingMap from './LiveTrackingMap';
import type { Vehicle } from '@/services/unifiedVehicleData';

interface LiveTrackingContentProps {
  viewMode: 'cards' | 'map';
  vehicles: Vehicle[];
}

const LiveTrackingContent: React.FC<LiveTrackingContentProps> = ({
  viewMode,
  vehicles
}) => {
  if (viewMode === 'map') {
    return <LiveTrackingMap />;
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
        <LiveVehicleCard key={vehicle.deviceid} vehicle={vehicle} />
      ))}
    </div>
  );
};

export default LiveTrackingContent;
