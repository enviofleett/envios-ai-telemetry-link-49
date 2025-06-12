
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Navigation, Filter, Search, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useStableVehicleData } from '@/hooks/useStableVehicleData';
import type { VehicleData } from '@/services/unifiedVehicleData';

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
    if (!vehicle.lastPosition?.timestamp) return 'offline';
    
    const lastUpdate = new Date(vehicle.lastPosition.timestamp);
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
                onValueChange={(value: 'all' | 'online' | 'offline' | 'alerts') => 
                  setStatusFilter(value)
                }
              >
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status ({allVehicles.length})</SelectItem>
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
                GPS Coverage: {allVehicles.length > 0 ? 
                  ((vehicles.length / allVehicles.length) * 100).toFixed(1) : 0}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Map Placeholder */}
      <Card>
        <CardContent className="p-6">
          <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <MapPin className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Map Integration Ready</h3>
              <p className="text-gray-500">
                Clean slate prepared for new map implementation
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* No Results Message */}
      {vehicles.length === 0 && allVehicles.length > 0 && (
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
