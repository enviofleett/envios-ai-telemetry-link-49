
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MapPin, 
  Battery, 
  Gauge, 
  Clock, 
  Key,
  Power,
  PowerOff,
  AlertTriangle,
  Calendar,
  Package
} from 'lucide-react';
import type { Vehicle } from '@/services/unifiedVehicleData';

interface VehicleStatusCardProps {
  vehicle: Vehicle | null;
  onEngineShutdown?: (vehicleId: string) => void;
  onEngineEnable?: (vehicleId: string) => void;
  canControlEngine?: boolean;
  isLoading?: boolean;
}

const VehicleStatusCard: React.FC<VehicleStatusCardProps> = ({
  vehicle,
  onEngineShutdown,
  onEngineEnable,
  canControlEngine = false,
  isLoading = false
}) => {
  if (!vehicle) {
    return (
      <Card className="w-full">
        <CardContent className="p-6 text-center text-gray-500">
          <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>Select a vehicle to view its status</p>
        </CardContent>
      </Card>
    );
  }

  const getVehicleStatus = () => {
    if (!vehicle.lastPosition?.updatetime) return 'offline';
    
    const lastUpdate = new Date(vehicle.lastPosition.updatetime);
    const now = new Date();
    const minutesSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);
    
    if (minutesSinceUpdate <= 5) return 'online';
    if (minutesSinceUpdate <= 30) return 'idle';
    return 'offline';
  };

  const getIgnitionStatus = () => {
    // Mock ignition status - in real implementation, this would come from GP51 API
    return Math.random() > 0.5 ? 'ON' : 'OFF';
  };

  const getBatteryLevel = () => {
    // Mock battery level - in real implementation, this would come from GP51 API
    return Math.floor(Math.random() * 100);
  };

  const getSubscriptionInfo = () => {
    // Mock subscription info - in real implementation, this would come from database
    return {
      package: 'Premium Fleet',
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()
    };
  };

  const status = getVehicleStatus();
  const ignitionStatus = getIgnitionStatus();
  const batteryLevel = getBatteryLevel();
  const subscription = getSubscriptionInfo();

  const getStatusColor = () => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'idle': return 'bg-yellow-500';
      default: return 'bg-gray-400';
    }
  };

  const formatCoordinates = (lat: number, lon: number) => {
    return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {vehicle.devicename}
          </CardTitle>
          <Badge variant={status === 'online' ? 'default' : 'secondary'} className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${getStatusColor()}`}></div>
            {status.toUpperCase()}
          </Badge>
        </div>
        <p className="text-sm text-gray-600">Device ID: {vehicle.deviceid}</p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Location */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <MapPin className="h-4 w-4 text-gray-400" />
              Location
            </div>
            {vehicle.lastPosition?.lat && vehicle.lastPosition?.lon ? (
              <p className="text-sm font-mono">
                {formatCoordinates(vehicle.lastPosition.lat, vehicle.lastPosition.lon)}
              </p>
            ) : (
              <p className="text-sm text-gray-400">No location data</p>
            )}
          </div>

          {/* Battery Level */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Battery className="h-4 w-4 text-gray-400" />
              Battery Life
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${batteryLevel > 20 ? 'bg-green-500' : 'bg-red-500'}`}
                  style={{ width: `${batteryLevel}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium">{batteryLevel}%</span>
            </div>
          </div>
        </div>

        {/* Speed and Ignition */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Gauge className="h-4 w-4 text-gray-400" />
              Speed
            </div>
            <p className="text-lg font-bold">
              {vehicle.lastPosition?.speed || 0} km/h
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Key className="h-4 w-4 text-gray-400" />
              Ignition Status
            </div>
            <Badge variant={ignitionStatus === 'ON' ? 'default' : 'secondary'}>
              {ignitionStatus}
            </Badge>
          </div>
        </div>

        {/* Last Update and System ID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Clock className="h-4 w-4 text-gray-400" />
              Last Update
            </div>
            <p className="text-sm">
              {vehicle.lastPosition?.updatetime 
                ? new Date(vehicle.lastPosition.updatetime).toLocaleString()
                : 'No data'
              }
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <AlertTriangle className="h-4 w-4 text-gray-400" />
              System ID
            </div>
            <p className="text-sm font-mono">{vehicle.deviceid}</p>
          </div>
        </div>

        {/* Subscription Package */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Package className="h-4 w-4 text-gray-400" />
            Subscribed Package & Validity
          </div>
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div>
              <p className="font-medium text-blue-900">{subscription.package}</p>
              <p className="text-sm text-blue-600">Valid until {subscription.validUntil}</p>
            </div>
            <Badge variant="outline" className="text-blue-600 border-blue-300">
              Active
            </Badge>
          </div>
        </div>

        {/* Engine Control Buttons */}
        {canControlEngine && (
          <div className="flex gap-2 pt-4 border-t">
            <Button
              variant="destructive"
              onClick={() => onEngineShutdown?.(vehicle.deviceid)}
              disabled={isLoading || ignitionStatus === 'OFF'}
              className="flex-1"
            >
              <PowerOff className="h-4 w-4 mr-2" />
              Engine Shutdown
            </Button>
            <Button
              variant="default"
              onClick={() => onEngineEnable?.(vehicle.deviceid)}
              disabled={isLoading || ignitionStatus === 'ON'}
              className="flex-1"
            >
              <Power className="h-4 w-4 mr-2" />
              Engine Enable
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VehicleStatusCard;
