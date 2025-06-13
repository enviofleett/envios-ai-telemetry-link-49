
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

  // Use stable vehicle data
  const { vehicles, allVehicles, isLoading } = useStableVehicleData();

  const getVehicleStatus = (vehicle: VehicleData) => {
    if (!vehicle.last_position?.timestamp) return 'offline';
    
    const lastUpdate = new Date(vehicle.last_position.timestamp);
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
      
      <CardContent className="p-0">
        <div className="h-64">
          <MapTilerMap
            vehicles={showOfflineVehicles ? allVehicles : vehicles}
            onVehicleSelect={handleVehicleSelect}
            height="256px"
            showControls={false}
          />
        </div>
        
        <div className="p-4 border-t">
          <div className="flex justify-between text-sm">
            <span className="text-green-600">Online: {statusCounts.online || 0}</span>
            <span className="text-yellow-600">Idle: {statusCounts.idle || 0}</span>
            <span className="text-red-600">Offline: {statusCounts.offline || 0}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FleetMapWidget;
