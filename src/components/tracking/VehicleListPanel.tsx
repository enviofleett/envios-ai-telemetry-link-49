
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Car, MapPin, Clock, MoreHorizontal, Zap, Search, Copy, RefreshCw } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import type { Vehicle } from '@/services/unifiedVehicleData';

interface VehicleListPanelProps {
  vehicles: Vehicle[];
  onVehicleSelect?: (vehicle: Vehicle) => void;
  onTripHistory?: (vehicle: Vehicle) => void;
  onSendAlert?: (vehicle: Vehicle) => void;
  vehicleAddresses?: Map<string, string>;
  selectedVehicle?: Vehicle | null;
  onRefreshAddresses?: () => void;
}

const VehicleListPanel: React.FC<VehicleListPanelProps> = ({
  vehicles,
  onVehicleSelect,
  onTripHistory,
  onSendAlert,
  vehicleAddresses = new Map(),
  selectedVehicle,
  onRefreshAddresses
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const getVehicleStatus = (vehicle: Vehicle) => {
    if (!vehicle.lastPosition?.updatetime) return 'offline';
    
    const lastUpdate = new Date(vehicle.lastPosition.updatetime);
    const now = new Date();
    const minutesSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);
    
    if (minutesSinceUpdate > 5) return 'offline';
    if (vehicle.lastPosition.speed > 0) return 'moving';
    return 'online';
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

  const getIgnitionBadge = (ignitionStatus: string) => {
    if (ignitionStatus === 'ON') {
      return (
        <div className="flex items-center gap-1 text-xs text-green-700">
          <Zap className="h-3 w-3 text-green-500" />
          <span>IGN ON</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Zap className="h-3 w-3 text-gray-400" />
          <span>IGN OFF</span>
        </div>
      );
    }
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

  const getAddress = (vehicle: Vehicle) => {
    const address = vehicleAddresses.get(vehicle.deviceid);
    if (address) return address;
    
    if (vehicle.lastPosition?.lat && vehicle.lastPosition?.lon) {
      return `${vehicle.lastPosition.lat.toFixed(4)}, ${vehicle.lastPosition.lon.toFixed(4)}`;
    }
    
    return 'No location data';
  };

  const getShortAddress = (address: string) => {
    if (address.length <= 40) return address;
    const parts = address.split(',');
    if (parts.length >= 2) {
      return `${parts[0]}, ${parts[1]}...`;
    }
    return address.substring(0, 37) + '...';
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

  // Enhanced search filtering
  const filteredVehicles = vehicles.filter(vehicle => {
    if (!searchTerm) return true;
    
    const search = searchTerm.toLowerCase();
    const plateNumber = vehicle.plateNumber || vehicle.devicename;
    const address = getAddress(vehicle).toLowerCase();
    const status = getVehicleStatus(vehicle);
    const ignitionStatus = getIgnitionStatus(vehicle);
    
    return (
      vehicle.devicename.toLowerCase().includes(search) ||
      vehicle.deviceid.toLowerCase().includes(search) ||
      plateNumber.toLowerCase().includes(search) ||
      address.includes(search) ||
      status.toLowerCase().includes(search) ||
      ignitionStatus.toLowerCase().includes(search)
    );
  });

  return (
    <Card className="bg-white border border-gray-lighter shadow-sm h-full">
      <CardHeader className="p-4 border-b border-gray-lighter">
        <CardTitle className="text-base font-semibold text-primary-dark flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Car className="h-4 w-4" />
            Vehicle List ({filteredVehicles.length}/{vehicles.length})
          </div>
          
          {onRefreshAddresses && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefreshAddresses}
              className="h-6 w-6 p-0"
              title="Refresh addresses"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          )}
        </CardTitle>
        
        {/* Search Input */}
        <div className="mt-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
            <Input
              placeholder="Search vehicles, addresses, status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-8 text-xs border-gray-lighter"
            />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 flex-1">
        <ScrollArea className="h-[calc(600px-120px)]">
          <div className="p-2 space-y-2">
            {filteredVehicles.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Car className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">
                  {searchTerm ? 'No vehicles match your search' : 'No vehicles found'}
                </p>
              </div>
            ) : (
              filteredVehicles.map((vehicle) => {
                const status = getVehicleStatus(vehicle);
                const ignitionStatus = getIgnitionStatus(vehicle);
                const isSelected = selectedVehicle?.deviceid === vehicle.deviceid;
                const fullAddress = getAddress(vehicle);
                const shortAddress = getShortAddress(fullAddress);
                
                return (
                  <div
                    key={vehicle.deviceid}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-blue-300 bg-blue-50 shadow-md' 
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => onVehicleSelect?.(vehicle)}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                          status === 'moving' ? 'bg-blue-500' :
                          status === 'online' ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                        <span className="font-medium text-sm truncate">
                          {vehicle.devicename}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {getStatusBadge(status)}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => onTripHistory?.(vehicle)}>
                              Trip History
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onSendAlert?.(vehicle)}>
                              Send Alert
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => copyToClipboard(fullAddress, 'Address')}>
                              Copy Address
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Vehicle Info */}
                    <div className="space-y-1">
                      {/* Speed, Course, and Ignition */}
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex gap-3">
                          <span className="text-gray-600">Speed: {vehicle.lastPosition?.speed || 0} km/h</span>
                          <span className="text-gray-600">Course: {vehicle.lastPosition?.course || 0}°</span>
                        </div>
                        {getIgnitionBadge(ignitionStatus)}
                      </div>
                      
                      {/* Location with Copy Button */}
                      <div className="flex items-start gap-1 group">
                        <MapPin className="h-3 w-3 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span 
                            className="text-xs text-gray-600 line-clamp-2 cursor-help"
                            title={fullAddress}
                          >
                            {shortAddress}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(fullAddress, 'Address');
                          }}
                          title="Copy address"
                        >
                          <Copy className="h-2 w-2" />
                        </Button>
                      </div>
                      
                      {/* Last Update */}
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          {vehicle.lastPosition?.updatetime 
                            ? formatLastUpdate(vehicle.lastPosition.updatetime)
                            : 'No data'
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default VehicleListPanel;
