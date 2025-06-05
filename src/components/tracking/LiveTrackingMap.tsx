
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Navigation } from 'lucide-react';
import type { Vehicle } from '@/services/unifiedVehicleData';

interface LiveTrackingMapProps {
  vehicles: Vehicle[];
}

const LiveTrackingMap: React.FC<LiveTrackingMapProps> = ({ vehicles }) => {
  const onlineVehicles = vehicles.filter(vehicle => {
    if (!vehicle.lastPosition?.updatetime) return false;
    const lastUpdate = new Date(vehicle.lastPosition.updatetime);
    const now = new Date();
    const minutesSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);
    return minutesSinceUpdate <= 30;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Navigation className="h-5 w-5" />
          Live Vehicle Map
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-gray-100 rounded-lg p-8 text-center min-h-[400px] flex flex-col items-center justify-center">
          <MapPin className="h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Interactive Map Coming Soon</h3>
          <p className="text-gray-500 mb-4">
            Real-time vehicle positions will be displayed on an interactive map
          </p>
          <div className="text-sm text-gray-600 space-y-1">
            <p>📍 {onlineVehicles.length} vehicles online and trackable</p>
            <p>🗺️ Interactive controls and clustering</p>
            <p>🚗 Real-time position updates</p>
            <p>📊 Vehicle status indicators</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LiveTrackingMap;
