
import React, { useState, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, X, MapPin, Clock } from 'lucide-react';
import type { VehicleData } from '@/types/vehicle';

interface EnhancedVehicleSearchProps {
  vehicles: VehicleData[];
  onFilteredVehicles: (vehicles: VehicleData[]) => void;
}

type StatusFilter = 'all' | 'online' | 'offline' | 'moving' | 'idle';
type TimeFilter = 'all' | '1h' | '24h' | '7d';

const EnhancedVehicleSearch: React.FC<EnhancedVehicleSearchProps> = ({
  vehicles,
  onFilteredVehicles
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [showFilters, setShowFilters] = useState(false);

  const filteredVehicles = useMemo(() => {
    let filtered = vehicles;

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(vehicle =>
        vehicle.device_name.toLowerCase().includes(term) ||
        vehicle.device_id.toLowerCase().includes(term) ||
        (vehicle.sim_number && vehicle.sim_number.toLowerCase().includes(term))
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(vehicle => {
        switch (statusFilter) {
          case 'online':
            return vehicle.isOnline && !vehicle.isMoving;
          case 'offline':
            return !vehicle.isOnline;
          case 'moving':
            return vehicle.isMoving;
          case 'idle':
            return vehicle.isOnline && !vehicle.isMoving;
          default:
            return true;
        }
      });
    }

    // Time filter
    if (timeFilter !== 'all') {
      const now = Date.now();
      const timeThresholds = {
        '1h': 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000
      };
      
      const threshold = timeThresholds[timeFilter];
      filtered = filtered.filter(vehicle => {
        const timeDiff = now - vehicle.lastUpdate.getTime();
        return timeDiff <= threshold;
      });
    }

    return filtered;
  }, [vehicles, searchTerm, statusFilter, timeFilter]);

  useEffect(() => {
    onFilteredVehicles(filteredVehicles);
  }, [filteredVehicles, onFilteredVehicles]);

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setTimeFilter('all');
  };

  const hasActiveFilters = searchTerm.trim() || statusFilter !== 'all' || timeFilter !== 'all';

  const getStatusCounts = () => {
    return {
      total: vehicles.length,
      online: vehicles.filter(v => v.isOnline && !v.isMoving).length,
      offline: vehicles.filter(v => !v.isOnline).length,
      moving: vehicles.filter(v => v.isMoving).length,
      idle: vehicles.filter(v => v.isOnline && !v.isMoving).length
    };
  };

  const statusCounts = getStatusCounts();

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Vehicle Search & Filters
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by device name, ID, or SIM number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchTerm('')}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Status Summary */}
        <div className="flex flex-wrap gap-2 text-sm">
          <Badge variant="outline" className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {filteredVehicles.length} of {vehicles.length} vehicles
          </Badge>
          <Badge variant="secondary">
            {statusCounts.moving} moving
          </Badge>
          <Badge variant="outline">
            {statusCounts.online} online
          </Badge>
          <Badge variant="destructive">
            {statusCounts.offline} offline
          </Badge>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={(value: StatusFilter) => setStatusFilter(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                  <SelectItem value="moving">Moving</SelectItem>
                  <SelectItem value="idle">Idle</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Last Update</label>
              <Select value={timeFilter} onValueChange={(value: TimeFilter) => setTimeFilter(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="1h">Last Hour</SelectItem>
                  <SelectItem value="24h">Last 24 Hours</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Clear Filters */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-sm text-muted-foreground">
              Showing {filteredVehicles.length} filtered results
            </span>
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedVehicleSearch;
