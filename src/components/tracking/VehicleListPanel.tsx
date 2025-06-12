import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Filter, Car, RefreshCw } from 'lucide-react';
import { useStableVehicleData } from '@/hooks/useStableVehicleData';
import CompactVehicleCard from './CompactVehicleCard';
import { useVehicleDetails } from '@/hooks/useVehicleDetails';
import type { VehicleData } from '@/services/unifiedVehicleData';

interface VehicleListPanelProps {
  selectedVehicle?: VehicleData | null;
  onVehicleSelect?: (vehicle: VehicleData) => void;
  className?: string;
  vehicleAddresses: Map<string, string>;
  onTripHistory?: (vehicle: VehicleData) => void;
  onSendAlert?: (vehicle: VehicleData) => void;
  onRefreshAddresses: () => void;
}

const VehicleListPanel: React.FC<VehicleListPanelProps> = ({
  selectedVehicle,
  onVehicleSelect,
  className,
  vehicleAddresses,
  onTripHistory,
  onSendAlert,
  onRefreshAddresses
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline'>('all');
  const { openDetailsModal, openTripHistoryModal, openAlertModal } = useVehicleDetails();

  // Mock function to simulate sending an alert
  const handleSendAlert = (vehicle: VehicleData) => {
    alert(`Simulating sending an alert to vehicle: ${vehicle.deviceName}`);
  };

  const getVehicleStatus = (vehicle: VehicleData) => {
    if (!vehicle.lastPosition?.updatetime) return 'offline';
    
    const lastUpdate = new Date(vehicle.lastPosition.updatetime);
    const now = new Date();
    const minutesSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);
    
    if (minutesSinceUpdate <= 5) return 'online';
    return 'offline';
  };

  const filteredVehicles = (vehicles: VehicleData[]) => {
    return vehicles.filter(vehicle => {
      const matchesSearch = vehicle.deviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            vehicle.deviceId.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (statusFilter === 'all') return matchesSearch;
      
      const vehicleStatus = getVehicleStatus(vehicle);
      return matchesSearch && vehicleStatus === statusFilter;
    });
  };

  return (
    <Card className={`bg-white border border-gray-lighter shadow-sm ${className}`}>
      <CardHeader className="p-4 border-b border-gray-lighter">
        <CardTitle className="text-lg font-semibold text-primary-dark">
          Vehicle List
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0">
        {/* Search and Filter Controls */}
        <div className="p-4">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-mid" />
            <Input
              placeholder="Search vehicles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 border-gray-lighter"
            />
          </div>

          <div className="flex items-center justify-between">
            <Select value={statusFilter} onValueChange={(value: 'all' | 'online' | 'offline') => setStatusFilter(value)}>
              <SelectTrigger className="h-10 border-gray-lighter w-40">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-lighter">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onRefreshAddresses}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Vehicle List */}
        <ScrollArea className="h-[450px]">
          <div className="p-4">
            {filteredVehicles([]).length === 0 ? (
              <div className="text-center py-8 text-gray-mid">
                <Car className="h-10 w-10 mx-auto mb-2 text-gray-400" />
                <p>No vehicles found</p>
              </div>
            ) : (
              filteredVehicles([]).map((vehicle) => (
                <CompactVehicleCard
                  key={vehicle.deviceId}
                  vehicle={vehicle}
                  onClick={() => onVehicleSelect?.(vehicle)}
                  onTripClick={() => openTripHistoryModal(vehicle)}
                  onAlertClick={() => openAlertModal(vehicle)}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default VehicleListPanel;
