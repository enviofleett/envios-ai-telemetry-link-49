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
  const plateNumber = vehicle.plateNumber || vehicle.devicename;

  return;
};

export default VehicleInfoPanel;
