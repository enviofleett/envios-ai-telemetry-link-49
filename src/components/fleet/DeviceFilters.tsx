
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X, Filter } from 'lucide-react';
import { DeviceFilter } from '@/types/device-management';

interface DeviceFiltersProps {
  filter: DeviceFilter;
  onFilterChange: (filter: DeviceFilter) => void;
  deviceTypes: any[];
  deviceTags: any[];
  onToggleCollapse: () => void;
}

const DeviceFilters: React.FC<DeviceFiltersProps> = ({
  filter,
  onFilterChange,
  deviceTypes,
  deviceTags,
  onToggleCollapse
}) => {
  const handleFilterChange = (key: keyof DeviceFilter, value: any) => {
    onFilterChange({ ...filter, [key]: value });
  };

  const clearFilters = () => {
    onFilterChange({});
  };

  const hasActiveFilters = Object.keys(filter).some(key => 
    filter[key as keyof DeviceFilter] !== undefined && 
    filter[key as keyof DeviceFilter] !== ''
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Device Filters
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Search</label>
            <Input
              placeholder="Search by name or ID..."
              value={filter.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Device Type</label>
            <Select
              value={filter.device_type?.toString() || ''}
              onValueChange={(value) => handleFilterChange('device_type', value ? parseInt(value) : undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All types</SelectItem>
                {deviceTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id.toString()}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Status</label>
            <Select
              value={filter.status || ''}
              onValueChange={(value) => handleFilterChange('status', value || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All statuses</SelectItem>
                <SelectItem value="enabled">Enabled</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Active Status</label>
            <Select
              value={filter.is_active !== undefined ? filter.is_active.toString() : ''}
              onValueChange={(value) => handleFilterChange('is_active', value ? value === 'true' : undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DeviceFilters;
