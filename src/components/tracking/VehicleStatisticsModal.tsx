
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, 
  MapPin, 
  Clock,
  Wifi,
  WifiOff
} from 'lucide-react';
import type { VehicleData } from '@/services/unifiedVehicleData';

interface VehicleStatisticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  vehicles: VehicleData[];
  statusType: 'online' | 'offline';
}

const VehicleStatisticsModal: React.FC<VehicleStatisticsModalProps> = ({
  isOpen,
  onClose,
  title,
  vehicles,
  statusType
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');

  const getVehicleStatus = (vehicle: VehicleData) => {
    if (!vehicle.lastPosition?.updatetime) return 'offline';
    
    const lastUpdate = new Date(vehicle.lastPosition.updatetime);
    const now = new Date();
    const minutesSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);
    
    if (minutesSinceUpdate <= 5) return 'online';
    if (minutesSinceUpdate <= 30) return 'idle';
    return 'offline';
  };

  const filteredVehicles = vehicles.filter(vehicle => {
    const vehicleStatus = getVehicleStatus(vehicle);
    const matchesStatus = statusType === 'online' ? vehicleStatus === 'online' : vehicleStatus === 'offline';
    const matchesSearch = vehicle.deviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vehicle.deviceId.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const formatLastSeen = (updatetime: string) => {
    const date = new Date(updatetime);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const getSubscriberName = (vehicle: VehicleData) => {
    // Mock subscriber name - in real implementation, this would come from user data
    return `Subscriber ${vehicle.deviceId.slice(-4)}`;
  };

  const getPlateNumber = (vehicle: VehicleData) => {
    // Mock plate number - in real implementation, this would come from vehicle data
    return `ABC-${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {statusType === 'online' ? (
              <Wifi className="h-5 w-5 text-green-500" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-500" />
            )}
            {title} ({filteredVehicles.length})
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search vehicles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Vehicle List */}
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {filteredVehicles.map((vehicle) => (
                <div 
                  key={vehicle.deviceId}
                  className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium">{getSubscriberName(vehicle)}</h3>
                        <Badge variant={statusType === 'online' ? 'default' : 'secondary'}>
                          {statusType}
                        </Badge>
                      </div>
                      
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3" />
                          <span className="font-medium cursor-pointer text-blue-600 hover:text-blue-800">
                            {getPlateNumber(vehicle)}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          <span>
                            Last seen: {vehicle.lastPosition?.updatetime 
                              ? formatLastSeen(vehicle.lastPosition.updatetime)
                              : 'Never'
                            }
                          </span>
                        </div>
                        
                        <div className="text-xs text-gray-500">
                          Device: {vehicle.deviceName} ({vehicle.deviceId})
                        </div>
                      </div>
                    </div>
                    
                    {vehicle.lastPosition?.lat && vehicle.lastPosition?.lon && (
                      <div className="text-right text-xs text-gray-500">
                        <div>Speed: {vehicle.lastPosition.speed || 0} km/h</div>
                        <div className="font-mono">
                          {vehicle.lastPosition.lat.toFixed(4)}, {vehicle.lastPosition.lon.toFixed(4)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {filteredVehicles.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <div className="mb-2">
                    {statusType === 'online' ? (
                      <Wifi className="h-12 w-12 mx-auto text-gray-300" />
                    ) : (
                      <WifiOff className="h-12 w-12 mx-auto text-gray-300" />
                    )}
                  </div>
                  <p>No {statusType} vehicles found</p>
                  {searchTerm && (
                    <p className="text-sm">Try adjusting your search terms</p>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VehicleStatisticsModal;
