
import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Search, Filter, X, Users, MapPin, Clock } from 'lucide-react';
import type { VehicleData } from '@/types/vehicle';

interface FilterOptions {
  search: string;
  status: 'all' | 'online' | 'offline' | 'idle' | 'moving';
  assignedUser: 'all' | 'assigned' | 'unassigned';
  hasPosition: 'all' | 'yes' | 'no';
  lastUpdate: 'all' | '1h' | '24h' | '7d';
}

interface EnhancedVehicleSearchProps {
  vehicles: VehicleData[];
  onFilteredVehicles: (vehicles: VehicleData[]) => void;
  className?: string;
}

const EnhancedVehicleSearch: React.FC<EnhancedVehicleSearchProps> = ({
  vehicles,
  onFilteredVehicles,
  className = ''
}) => {
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    status: 'all',
    assignedUser: 'all',
    hasPosition: 'all',
    lastUpdate: 'all'
  });

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Filter vehicles based on current filter options
  const filteredVehicles = useMemo(() => {
    let filtered = [...vehicles];

    // Text search
    if (filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase().trim();
      filtered = filtered.filter(vehicle => 
        vehicle.device_name?.toLowerCase().includes(searchTerm) ||
        vehicle.device_id?.toLowerCase().includes(searchTerm) ||
        vehicle.sim_number?.toLowerCase().includes(searchTerm) ||
        vehicle.envio_users?.name?.toLowerCase().includes(searchTerm)
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(vehicle => {
        switch (filters.status) {
          case 'online':
            return vehicle.isOnline;
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

    // Assigned user filter
    if (filters.assignedUser !== 'all') {
      filtered = filtered.filter(vehicle => {
        const hasUser = vehicle.user_id && vehicle.envio_users;
        return filters.assignedUser === 'assigned' ? hasUser : !hasUser;
      });
    }

    // Position filter
    if (filters.hasPosition !== 'all') {
      filtered = filtered.filter(vehicle => {
        const hasPosition = vehicle.last_position?.latitude && vehicle.last_position?.longitude;
        return filters.hasPosition === 'yes' ? hasPosition : !hasPosition;
      });
    }

    // Last update filter
    if (filters.lastUpdate !== 'all') {
      const now = new Date();
      const cutoffTime = new Date();
      
      switch (filters.lastUpdate) {
        case '1h':
          cutoffTime.setHours(now.getHours() - 1);
          break;
        case '24h':
          cutoffTime.setDate(now.getDate() - 1);
          break;
        case '7d':
          cutoffTime.setDate(now.getDate() - 7);
          break;
        default:
          break;
      }

      if (filters.lastUpdate !== 'all') {
        filtered = filtered.filter(vehicle => 
          vehicle.lastUpdate.getTime() >= cutoffTime.getTime()
        );
      }
    }

    return filtered;
  }, [vehicles, filters]);

  // Update parent component when filtered vehicles change
  React.useEffect(() => {
    onFilteredVehicles(filteredVehicles);
  }, [filteredVehicles, onFilteredVehicles]);

  const updateFilter = (key: keyof FilterOptions, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      assignedUser: 'all',
      hasPosition: 'all',
      lastUpdate: 'all'
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== 'all' && value !== ''
  );

  const getActiveFilterCount = () => {
    return Object.entries(filters).filter(([key, value]) => 
      value !== 'all' && value !== ''
    ).length;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Primary Search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search vehicles by name, device ID, SIM, or user..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Popover open={showAdvancedFilters} onOpenChange={setShowAdvancedFilters}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="relative">
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {getActiveFilterCount() > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  {getActiveFilterCount()}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Advanced Filters</h4>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-auto p-1 text-xs"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                )}
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Status
                </label>
                <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
                  <SelectTrigger>
                    <SelectValue />
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

              {/* Assigned User Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Assignment
                </label>
                <Select value={filters.assignedUser} onValueChange={(value) => updateFilter('assignedUser', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Vehicles</SelectItem>
                    <SelectItem value="assigned">Assigned</SelectItem>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Position Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Position Data
                </label>
                <Select value={filters.hasPosition} onValueChange={(value) => updateFilter('hasPosition', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Vehicles</SelectItem>
                    <SelectItem value="yes">Has Position</SelectItem>
                    <SelectItem value="no">No Position</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Last Update Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Last Update
                </label>
                <Select value={filters.lastUpdate} onValueChange={(value) => updateFilter('lastUpdate', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Time</SelectItem>
                    <SelectItem value="1h">Last Hour</SelectItem>
                    <SelectItem value="24h">Last 24 Hours</SelectItem>
                    <SelectItem value="7d">Last 7 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Filter Summary */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>
            Showing {filteredVehicles.length} of {vehicles.length} vehicles
          </span>
          {getActiveFilterCount() > 0 && (
            <Badge variant="secondary">
              {getActiveFilterCount()} filter{getActiveFilterCount() !== 1 ? 's' : ''} active
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

export default EnhancedVehicleSearch;
