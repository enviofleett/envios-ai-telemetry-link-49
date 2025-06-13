
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Navigation, Filter, Search, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useStableVehicleData } from '@/hooks/useStableVehicleData';
import type { VehicleData } from '@/types/vehicle';

interface LiveTrackingMapProps {
  initialSearchTerm?: string;
  initialStatusFilter?: 'all' | 'online' | 'offline' | 'alerts';
}

const LiveTrackingMap: React.FC<LiveTrackingMapProps> = ({ 
  initialSearchTerm = '',
  initialStatusFilter = 'all'
}) => {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter);

  // Use stable vehicle data with filters - fixed to use correct options
  const { vehicles, allVehicles, isLoading } = useStableVehicleData({
    search: searchTerm,
    status: statusFilter
  });

  const getVehicleStatus = (vehicle: VehicleData) => {
    if (!vehicle.last_position?.timestamp) return 'offline';
    
    const lastUpdate = new Date(vehicle.last_position.timestamp);
    const now = new Date();
    const minutesSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);
    
    if (minutesSinceUpdate <= 5) return 'online';
    if (minutesSinceUpdate <= 30) return 'idle';
    return 'offline';
  };

  // Memoized status counts to prevent recalculation
  const statusCounts = useMemo(() => {
    return allVehicles.reduce((acc, vehicle) => {
      const status = getVehicleStatus(vehicle);
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [allVehicles]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse">
              <div className="h-64 bg-gray-200 rounded-lg"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Live Vehicle Tracking
            <Badge variant="outline" className="ml-2">
              {vehicles.length} trackable vehicles
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
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="w-full md:w-48">
              <Select 
                value={statusFilter} 
                onValueChange={(value: 'all' | 'online' | 'offline' | 'alerts') => setStatusFilter(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vehicles ({allVehicles.length})</SelectItem>
                  <SelectItem value="online">Online ({statusCounts.online || 0})</SelectItem>
                  <SelectItem value="offline">Offline ({statusCounts.offline || 0})</SelectItem>
                  <SelectItem value="alerts">With Alerts (0)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Status Summary */}
          <div className="flex flex-wrap gap-4 mt-4 p-3 bg-gray-50 rounded-lg">
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
          </div>
        </CardContent>
      </Card>

      {/* Map Placeholder */}
      <Card>
        <CardContent className="p-8">
          <div className="h-96 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <MapPin className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Live Tracking Map</h3>
              <p className="text-gray-500">
                Real-time vehicle positions will be displayed here
              </p>
              <Badge variant="outline" className="mt-2">
                {vehicles.length} vehicles with valid GPS data
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LiveTrackingMap;
