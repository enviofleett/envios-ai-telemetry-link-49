
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  RefreshCw, 
  MapPin, 
  Wifi, 
  WifiOff, 
  Clock,
  Navigation,
  Gauge
} from 'lucide-react';
import { vehiclePositionSyncService } from '@/services/vehiclePositionSyncService';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Vehicle, VehiclePosition } from '@/types/vehicle';

// Type guard to safely cast Json to VehiclePosition
const isVehiclePosition = (data: any): data is VehiclePosition => {
  return data && typeof data === 'object' && 
         typeof data.lat === 'number' && 
         typeof data.lon === 'number' && 
         typeof data.speed === 'number' && 
         typeof data.course === 'number' && 
         typeof data.updatetime === 'string' && 
         typeof data.statusText === 'string';
};

const VehiclePositionMonitor: React.FC = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [syncMetrics, setSyncMetrics] = useState(vehiclePositionSyncService.getMetrics());

  // Fetch vehicles with real-time updates
  const { data: vehicles = [], isLoading, refetch } = useQuery({
    queryKey: ['vehicle-positions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('is_active', true)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our Vehicle interface
      const transformedData: Vehicle[] = data.map(vehicle => ({
        ...vehicle,
        last_position: vehicle.last_position && isVehiclePosition(vehicle.last_position) ? {
          lat: vehicle.last_position.lat,
          lon: vehicle.last_position.lon,
          speed: vehicle.last_position.speed,
          course: vehicle.last_position.course,
          updatetime: vehicle.last_position.updatetime,
          statusText: vehicle.last_position.statusText
        } : undefined
      }));

      return transformedData;
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Update sync metrics periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setSyncMetrics(vehiclePositionSyncService.getMetrics());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleForceSync = async () => {
    setIsRefreshing(true);
    try {
      await vehiclePositionSyncService.forceSync();
      await refetch();
      setSyncMetrics(vehiclePositionSyncService.getMetrics());
    } catch (error) {
      console.error('Force sync failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const getVehicleStatusColor = (vehicle: Vehicle) => {
    if (!vehicle.last_position) return 'bg-gray-100 text-gray-800';
    
    const now = new Date();
    const positionTime = new Date(vehicle.last_position.updatetime);
    const minutesDiff = (now.getTime() - positionTime.getTime()) / (1000 * 60);

    if (minutesDiff > 30) return 'bg-red-100 text-red-800';
    if (vehicle.last_position.speed > 5) return 'bg-green-100 text-green-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  const getVehicleStatusIcon = (vehicle: Vehicle) => {
    if (!vehicle.last_position) return <WifiOff className="w-3 h-3" />;
    
    const now = new Date();
    const positionTime = new Date(vehicle.last_position.updatetime);
    const minutesDiff = (now.getTime() - positionTime.getTime()) / (1000 * 60);

    if (minutesDiff > 30) return <WifiOff className="w-3 h-3" />;
    return <Wifi className="w-3 h-3" />;
  };

  const onlineVehicles = vehicles.filter(v => {
    if (!v.last_position) return false;
    const now = new Date();
    const positionTime = new Date(v.last_position.updatetime);
    const minutesDiff = (now.getTime() - positionTime.getTime()) / (1000 * 60);
    return minutesDiff <= 30;
  });

  return (
    <div className="space-y-6">
      {/* Sync Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              Position Sync Status
            </span>
            <Button 
              onClick={handleForceSync} 
              disabled={isRefreshing}
              size="sm"
            >
              Force Sync
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{syncMetrics.totalVehicles}</div>
              <div className="text-sm text-gray-600">Total Vehicles</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{onlineVehicles.length}</div>
              <div className="text-sm text-gray-600">Online</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{syncMetrics.positionsUpdated}</div>
              <div className="text-sm text-gray-600">Last Updated</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{syncMetrics.errors}</div>
              <div className="text-sm text-gray-600">Errors</div>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            Last sync: {syncMetrics.lastSyncTime.toLocaleString()}
          </div>
        </CardContent>
      </Card>

      {/* Vehicle Position List */}
      <Card>
        <CardHeader>
          <CardTitle>Live Vehicle Positions</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading vehicles...</div>
          ) : vehicles.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No active vehicles found</div>
          ) : (
            <div className="space-y-3">
              {vehicles.map((vehicle) => (
                <div key={vehicle.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge className={`flex items-center gap-1 ${getVehicleStatusColor(vehicle)}`}>
                      {getVehicleStatusIcon(vehicle)}
                      <span className="text-xs">
                        {vehicle.last_position ? 
                          (vehicle.last_position.speed > 5 ? 'Moving' : 'Stopped') : 
                          'Offline'
                        }
                      </span>
                    </Badge>
                    <div>
                      <div className="font-medium">{vehicle.device_name}</div>
                      <div className="text-sm text-gray-600">ID: {vehicle.device_id}</div>
                    </div>
                  </div>
                  
                  {vehicle.last_position ? (
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-blue-500" />
                        <span>{vehicle.last_position.lat.toFixed(4)}, {vehicle.last_position.lon.toFixed(4)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Gauge className="w-3 h-3 text-green-500" />
                        <span>{vehicle.last_position.speed} km/h</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-orange-500" />
                        <span>{new Date(vehicle.last_position.updatetime).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">No position data</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VehiclePositionMonitor;
