
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Car, 
  Search, 
  Filter, 
  MapPin, 
  Navigation,
  AlertTriangle,
  Phone,
  Eye,
  MoreVertical
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useRealtimeVehicleData } from '@/hooks/useRealtimeVehicleData';
import type { VehicleData } from '@/types/vehicle';

interface MobileVehicleManagerProps {
  onVehicleSelect?: (vehicle: VehicleData) => void;
}

const MobileVehicleManager: React.FC<MobileVehicleManagerProps> = ({
  onVehicleSelect
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'online' | 'offline' | 'moving'>('all');
  
  const isMobile = useIsMobile();
  const { vehicles, isLoading } = useRealtimeVehicleData();

  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = vehicle.device_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vehicle.device_id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = selectedFilter === 'all' || 
                         (selectedFilter === 'online' && vehicle.isOnline) ||
                         (selectedFilter === 'offline' && !vehicle.isOnline) ||
                         (selectedFilter === 'moving' && vehicle.isMoving);
    
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (vehicle: VehicleData) => {
    if (vehicle.isMoving) return 'bg-green-500';
    if (vehicle.isOnline) return 'bg-blue-500';
    return 'bg-gray-400';
  };

  const getStatusText = (vehicle: VehicleData) => {
    if (vehicle.isMoving) return 'Moving';
    if (vehicle.isOnline) return 'Online';
    return 'Offline';
  };

  const handleEmergencyContact = (vehicle: VehicleData) => {
    // In a real app, this would contact emergency services or fleet manager
    console.log('Emergency contact for vehicle:', vehicle.device_id);
  };

  const handleQuickTrack = (vehicle: VehicleData) => {
    window.location.href = `/tracking?vehicle=${vehicle.device_id}`;
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 h-24 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mobile Search and Filter Bar */}
      <div className="sticky top-0 bg-white z-10 p-4 border-b">
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search vehicles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFilterOpen(!filterOpen)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filter
          </Button>
        </div>

        {/* Filter Options */}
        {filterOpen && (
          <div className="flex gap-2 flex-wrap">
            {[
              { key: 'all', label: 'All', count: vehicles.length },
              { key: 'online', label: 'Online', count: vehicles.filter(v => v.isOnline).length },
              { key: 'offline', label: 'Offline', count: vehicles.filter(v => !v.isOnline).length },
              { key: 'moving', label: 'Moving', count: vehicles.filter(v => v.isMoving).length }
            ].map(filter => (
              <Button
                key={filter.key}
                variant={selectedFilter === filter.key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedFilter(filter.key as any)}
                className="text-xs"
              >
                {filter.label} ({filter.count})
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Vehicle Cards - Mobile Optimized */}
      <div className="p-4 space-y-3">
        {filteredVehicles.map((vehicle) => (
          <Card 
            key={vehicle.id} 
            className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow"
            style={{ borderLeftColor: getStatusColor(vehicle).replace('bg-', '#') }}
          >
            <CardContent className="p-4">
              {/* Header Row */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(vehicle)}`} />
                  <div>
                    <h3 className="font-semibold text-lg">{vehicle.device_name}</h3>
                    <p className="text-sm text-gray-500">{vehicle.device_id}</p>
                  </div>
                </div>
                <Badge variant={vehicle.isOnline ? 'default' : 'secondary'}>
                  {getStatusText(vehicle)}
                </Badge>
              </div>

              {/* Vehicle Info */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {vehicle.last_position && (
                  <>
                    <div className="text-sm">
                      <span className="text-gray-500">Speed:</span>
                      <span className="ml-2 font-medium">
                        {Math.round(vehicle.last_position.speed || 0)} km/h
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-500">Last Update:</span>
                      <span className="ml-2 font-medium">
                        {vehicle.lastUpdate.toLocaleTimeString()}
                      </span>
                    </div>
                  </>
                )}
                {vehicle.sim_number && (
                  <div className="text-sm col-span-2">
                    <span className="text-gray-500">SIM:</span>
                    <span className="ml-2 font-mono text-xs">{vehicle.sim_number}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons - Mobile Optimized */}
              <div className="grid grid-cols-3 gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => onVehicleSelect?.(vehicle)}
                  className="flex items-center gap-1"
                >
                  <Eye className="h-3 w-3" />
                  <span className="hidden sm:inline">View</span>
                </Button>
                
                <Button 
                  size="sm"
                  onClick={() => handleQuickTrack(vehicle)}
                  className="flex items-center gap-1"
                >
                  <Navigation className="h-3 w-3" />
                  <span className="hidden sm:inline">Track</span>
                </Button>

                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleEmergencyContact(vehicle)}
                  className="flex items-center gap-1 text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Phone className="h-3 w-3" />
                  <span className="hidden sm:inline">Emergency</span>
                </Button>
              </div>

              {/* Location Info (if available) */}
              {vehicle.last_position && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {vehicle.last_position.latitude.toFixed(4)}, {vehicle.last_position.longitude.toFixed(4)}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {filteredVehicles.length === 0 && (
          <div className="text-center py-8">
            <Car className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Vehicles Found</h3>
            <p className="text-gray-500">
              {searchTerm ? 'Try adjusting your search terms' : 'No vehicles match the selected filter'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileVehicleManager;
