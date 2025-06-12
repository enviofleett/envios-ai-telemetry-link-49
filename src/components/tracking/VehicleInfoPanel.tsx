import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, Gauge, Navigation, Zap, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { VehicleData } from '@/services/unifiedVehicleData';

interface VehicleInfoPanelProps {
  vehicle: VehicleData | null;
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

  const getVehicleStatus = (vehicle: VehicleData) => {
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

  const getIgnitionStatus = (vehicle: VehicleData) => {
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
  const plateNumber = vehicle.licensePlate || vehicle.deviceName;

  return (
    <Card className="bg-white border border-gray-lighter shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-primary-dark">{plateNumber}</h2>
            <p className="text-sm text-gray-500">{address}</p>
          </div>
          {getStatusBadge(status)}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <Gauge className="h-4 w-4" />
              <span>Speed:</span>
            </div>
            <p className="text-primary-dark">{vehicle.lastPosition?.speed || 0} km/h</p>
          </div>
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <Zap className="h-4 w-4" />
              <span>Ignition:</span>
            </div>
            <p className="text-primary-dark">{ignitionStatus}</p>
          </div>
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <Clock className="h-4 w-4" />
              <span>Last Update:</span>
            </div>
            <p className="text-primary-dark">
              {vehicle.lastPosition?.updatetime ? formatLastUpdate(vehicle.lastPosition.updatetime) : 'Never'}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <Navigation className="h-4 w-4" />
              <span>Location:</span>
            </div>
            <p className="text-primary-dark">
              {vehicle.lastPosition?.lat}, {vehicle.lastPosition?.lon}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            className="bg-white border-gray-lighter text-primary-dark hover:bg-gray-background"
            onClick={() => copyToClipboard(vehicle.deviceId, "Device ID")}
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy Device ID
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default VehicleInfoPanel;
