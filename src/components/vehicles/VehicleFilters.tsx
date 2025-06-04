
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, X } from 'lucide-react';

interface FilterState {
  search: string;
  status: string;
  user: string;
  online: string;
}

interface VehicleFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  userOptions: Array<{ id: string; name: string }>;
  vehicleCount: number;
  filteredCount: number;
}

const VehicleFilters: React.FC<VehicleFiltersProps> = ({
  filters,
  onFiltersChange,
  userOptions,
  vehicleCount,
  filteredCount
}) => {
  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value });
  };

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      status: 'all',
      user: 'all',
      online: 'all'
    });
  };

  const hasActiveFilters = filters.search || 
    filters.status !== 'all' || 
    filters.user !== 'all' || 
    filters.online !== 'all';

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.status !== 'all') count++;
    if (filters.user !== 'all') count++;
    if (filters.online !== 'all') count++;
    return count;
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search by Device ID, Device Name, SIM Number..."
          value={filters.search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filters Row */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Filter className="h-4 w-4" />
          <span>Filters:</span>
        </div>
        
        <div className="flex flex-wrap gap-2 flex-1">
          {/* Status Filter */}
          <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="moving">Moving</SelectItem>
              <SelectItem value="stopped">Stopped</SelectItem>
              <SelectItem value="alert">Alert</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
            </SelectContent>
          </Select>

          {/* Online Filter */}
          <Select value={filters.online} onValueChange={(value) => handleFilterChange('online', value)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Online" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
            </SelectContent>
          </Select>

          {/* User Filter */}
          <Select value={filters.user} onValueChange={(value) => handleFilterChange('user', value)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Owner" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Owners</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {userOptions.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={clearFilters}
            className="flex items-center gap-1"
          >
            <X className="h-3 w-3" />
            Clear
            <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 text-xs flex items-center justify-center">
              {getActiveFilterCount()}
            </Badge>
          </Button>
        )}
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div>
          Showing {filteredCount} of {vehicleCount} vehicles
          {hasActiveFilters && (
            <span className="text-blue-600 ml-1">(filtered)</span>
          )}
        </div>
        
        {hasActiveFilters && (
          <div className="flex items-center gap-2">
            <span>Active filters:</span>
            {filters.search && (
              <Badge variant="outline" className="text-xs">
                Search: "{filters.search}"
              </Badge>
            )}
            {filters.status !== 'all' && (
              <Badge variant="outline" className="text-xs">
                Status: {filters.status}
              </Badge>
            )}
            {filters.online !== 'all' && (
              <Badge variant="outline" className="text-xs">
                Online: {filters.online}
              </Badge>
            )}
            {filters.user !== 'all' && (
              <Badge variant="outline" className="text-xs">
                Owner: {userOptions.find(u => u.id === filters.user)?.name || 'Unassigned'}
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VehicleFilters;
