
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Navigation, Filter, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import MapTilerMap from '@/components/map/MapTilerMap';
import type { Vehicle } from '@/services/unifiedVehicleData';

interface LiveTrackingMapProps {
  vehicles: Vehicle[];
  searchTerm?: string;
  onSearchChange?: (search: string) => void;
  statusFilter?: 'all' | 'online' | 'offline' | 'alerts';
  onStatusFilterChange?: (status: 'all' | 'online' | 'offline' | 'alerts') => void;
}

const LiveTrackingMap: React.FC<LiveTrackingMapProps> = ({ 
  vehicles,
  searchTerm = '',
  onSearchChange,
  statusFilter = 'all',
  onStatusFilterChange
}) => {
  const getVehicleStatus = (vehicle: Vehicle) => {
    if (!vehicle.lastPosition?.updatetime) return 'offline';
    
    const lastUpdate = new Date(vehicle.lastPosition.updatetime);
    const now = new Date();
    const minutesSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);
    
    if (minutesSinceUpdate <= 5) return 'online';
    if (minutesSinceUpdate <= 30) return 'idle';
    return 'offline';
  };

  // Filter vehicles based on search and status
  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = vehicle.devicename.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vehicle.deviceid.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'all') return matchesSearch;
    
    const vehicleStatus = getVehicleStatus(vehicle);
    return matchesSearch && vehicleStatus === statusFilter;
  });

  const vehiclesWithPosition = filteredVehicles.filter(v => v.lastPosition?.lat && v.lastPosition?.lon);
  
  const statusCounts = vehicles.reduce((acc, vehicle) => {
    const status = getVehicleStatus(vehicle);
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleVehicleSelect = (vehicle: Vehicle) => {
    console.log('Selected vehicle:', vehicle);
    // Add custom selection logic here if needed
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Live Vehicle Tracking
            <Badge variant="outline" className="ml-2">
              {vehiclesWithPosition.length} trackable vehicles
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search vehicles by name or ID..."
                  value={searchTerm}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="w-full md:w-48">
              <Select 
                value={statusFilter} 
                onValueChange={(value: 'all' | 'online' | 'offline' | 'alerts') => 
                  onStatusFilterChange?.(value)
                }
              >
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status ({vehicles.length})</SelectItem>
                  <SelectItem value="online">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      Online ({statusCounts.online || 0})
                    </div>
                  </SelectItem>
                  <SelectItem value="idle">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                      Idle ({statusCounts.idle || 0})
                    </div>
                  </SelectItem>
                  <SelectItem value="offline">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                      Offline ({statusCounts.offline || 0})
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Status Summary */}
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm">Online: {statusCounts.online || 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span className="text-sm">Idle: {statusCounts.idle || 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-400"></div>
              <span className="text-sm">Offline: {statusCounts.offline || 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                GPS Coverage: {vehicles.length > 0 ? 
                  ((vehiclesWithPosition.length / vehicles.length) * 100).toFixed(1) : 0}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interactive Map */}
      <Card>
        <CardContent className="p-0">
          <MapTilerMap
            vehicles={filteredVehicles}
            onVehicleSelect={handleVehicleSelect}
            height="600px"
            className="rounded-lg border-0"
          />
        </CardContent>
      </Card>

      {/* Additional Info */}
      {filteredVehicles.length === 0 && vehicles.length > 0 && (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500">
              No vehicles match the current filters. Try adjusting your search or status filter.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LiveTrackingMap;
