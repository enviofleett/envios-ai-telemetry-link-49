
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Navigation, Maximize2, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import MapTilerMap from '@/components/map/MapTilerMap';
import { useStableVehicleData } from '@/hooks/useStableVehicleData';
import { useNavigate } from 'react-router-dom';
import type { VehicleData } from '@/types/vehicle';

const FleetMapWidget: React.FC = () => {
  const [showOfflineVehicles, setShowOfflineVehicles] = useState(true);
  const navigate = useNavigate();

  // Use stable vehicle data - fixed to use correct options
  const { vehicles, allVehicles, isLoading } = useStableVehicleData({
    status: showOfflineVehicles ? 'all' : 'online'
  });

  const getVehicleStatus = (vehicle: VehicleData) => {
    if (!vehicle.lastPosition?.timestamp) return 'offline';
    
    const lastUpdate = vehicle.lastPosition.timestamp;
    const now = new Date();
    const minutesSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);
    
    if (minutesSinceUpdate <= 5) return 'online';
    if (minutesSinceUpdate <= 30) return 'idle';
    return 'offline';
  };

  const statusCounts = allVehicles.reduce((acc, vehicle) => {
    const status = getVehicleStatus(vehicle);
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleVehicleSelect = (vehicle: VehicleData) => {
    navigate('/tracking', { state: { selectedVehicle: vehicle } });
  };

  const handleViewFullMap = () => {
    navigate('/tracking', { state: { viewMode: 'map' } });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Fleet Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-64 bg-gray-200 rounded-lg"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Fleet Distribution
            <Badge variant="outline" className="ml-2">
              {vehicles.length} trackable
            </Badge>
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowOfflineVehicles(!showOfflineVehicles)}
            >
              <Filter className="h-4 w-4 mr-1" />
              {showOfflineVehicles ? 'Hide' : 'Show'} Offline
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewFullMap}
            >
              <Maximize2 className="h-4 w-4 mr-1" />
              Full Map
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Status Summary */}
        <div className="flex flex-wrap gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-sm">Online: {statusCounts.online || 0}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="text-sm">Idle: {statusCounts.idle || 0}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-400"></div>
            <span className="text-sm">Offline: {statusCounts.offline || 0}</span>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm font-medium">
              Coverage: {allVehicles.length > 0 ? 
                ((vehicles.length / allVehicles.length) * 100).toFixed(1) : 0}%
            </span>
          </div>
        </div>

        <MapTilerMap
          vehicles={vehicles}
          height="300px"
          onVehicleSelect={handleVehicleSelect}
          defaultZoom={10}
          showControls={false}
        />
      </CardContent>
    </Card>
  );
};

export default FleetMapWidget;
