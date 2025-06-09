
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, Gauge, Navigation, Zap, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Vehicle } from '@/services/unifiedVehicleData';

interface VehicleInfoPanelProps {
  vehicle: Vehicle | null;
  address: string;
}

const VehicleInfoPanel: React.FC<VehicleInfoPanelProps> = ({
  vehicle,
  address
}) => {
  const { toast } = useToast();

  if (!vehicle) {
    return (
      <Card className="bg-white border border-gray-lighter shadow-sm">
        <CardContent className="p-4">
          <div className="text-center text-gray-500">
            <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">Select a vehicle to view details</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getVehicleStatus = (vehicle: Vehicle) => {
    if (!vehicle.lastPosition?.updatetime) return 'offline';
    const lastUpdate = new Date(vehicle.lastPosition.updatetime);
    const now = new Date();
    const minutesSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);
    if (minutesSinceUpdate > 5) return 'offline';
    if (vehicle.lastPosition.speed > 0) return 'moving';
    return 'online';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'moving':
        return <Badge className="bg-blue-100 text-blue-800 text-xs">Moving</Badge>;
      case 'online':
        return <Badge className="bg-green-100 text-green-800 text-xs">Online</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">Offline</Badge>;
    }
  };

  const getIgnitionStatus = (vehicle: Vehicle) => {
    const statusText = vehicle.lastPosition?.statusText?.toLowerCase() || '';
    const speed = vehicle.lastPosition?.speed || 0;
    if (statusText.includes('ignition on') || statusText.includes('engine on')) return 'ON';
    if (statusText.includes('ignition off') || statusText.includes('engine off')) return 'OFF';
    if (speed > 0) return 'ON';
    if (vehicle.lastPosition?.updatetime) {
      const lastUpdate = new Date(vehicle.lastPosition.updatetime);
      const now = new Date();
      const minutesSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);
      if (minutesSinceUpdate <= 5) return 'ON';
    }
    return 'OFF';
  };

  const formatLastUpdate = (updatetime: string) => {
    const date = new Date(updatetime);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied to clipboard",
        description: `${label} copied successfully`
      });
    }).catch(() => {
      toast({
        title: "Copy failed",
        description: "Unable to copy to clipboard",
        variant: "destructive"
      });
    });
  };

  const status = getVehicleStatus(vehicle);
  const ignitionStatus = getIgnitionStatus(vehicle);
  const plateNumber = vehicle.plateNumber || vehicle.devicename;

  return (
    <Card className="bg-white border border-gray-lighter shadow-sm">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-4 h-4 rounded-full ${
              status === 'moving' ? 'bg-blue-500' :
              status === 'online' ? 'bg-green-500' : 'bg-red-500'
            }`} />
            <div>
              <h3 className="text-lg font-semibold text-primary-dark">{plateNumber}</h3>
              <p className="text-sm text-gray-500">Device ID: {vehicle.deviceid}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(status)}
            <Badge variant={ignitionStatus === 'ON' ? 'default' : 'secondary'} className="text-xs">
              <Zap className="h-3 w-3 mr-1" />
              IGN {ignitionStatus}
            </Badge>
          </div>
        </div>

        {/* Location */}
        <div className="mb-6">
          <div className="flex items-start gap-2 mb-2">
            <MapPin className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-700 mb-1">Current Location</p>
              <div className="flex items-start gap-2">
                <p className="text-sm text-gray-600 flex-1">{address}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 flex-shrink-0"
                  onClick={() => copyToClipboard(address, 'Address')}
                  title="Copy address"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
          
          {vehicle.lastPosition && (
            <div className="text-xs text-gray-500 ml-6">
              Coordinates: {vehicle.lastPosition.lat.toFixed(6)}, {vehicle.lastPosition.lon.toFixed(6)}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ml-2"
                onClick={() => copyToClipboard(
                  `${vehicle.lastPosition!.lat.toFixed(6)}, ${vehicle.lastPosition!.lon.toFixed(6)}`,
                  'Coordinates'
                )}
                title="Copy coordinates"
              >
                <Copy className="h-2 w-2" />
              </Button>
            </div>
          )}
        </div>

        {/* Vehicle Metrics */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <Gauge className="h-5 w-5 mx-auto mb-1 text-blue-500" />
            <p className="text-xs text-gray-500 mb-1">Speed</p>
            <p className="text-sm font-semibold">{vehicle.lastPosition?.speed || 0} km/h</p>
          </div>
          
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <Navigation className="h-5 w-5 mx-auto mb-1 text-green-500" />
            <p className="text-xs text-gray-500 mb-1">Course</p>
            <p className="text-sm font-semibold">{vehicle.lastPosition?.course || 0}°</p>
          </div>
          
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <Clock className="h-5 w-5 mx-auto mb-1 text-orange-500" />
            <p className="text-xs text-gray-500 mb-1">Last Update</p>
            <p className="text-sm font-semibold">
              {vehicle.lastPosition?.updatetime 
                ? formatLastUpdate(vehicle.lastPosition.updatetime)
                : 'No data'
              }
            </p>
          </div>
        </div>

        {/* Status Text */}
        {vehicle.lastPosition?.statusText && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-600 font-medium mb-1">Status Information</p>
            <p className="text-sm text-blue-800">{vehicle.lastPosition.statusText}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VehicleInfoPanel;
