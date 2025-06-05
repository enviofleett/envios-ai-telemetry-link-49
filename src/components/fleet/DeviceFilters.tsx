
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Filter, X } from 'lucide-react';
import { DeviceFilter, DeviceType, DeviceTag } from '@/types/device-management';

interface DeviceFiltersProps {
  filter: DeviceFilter;
  onFilterChange: (filter: DeviceFilter) => void;
  deviceTypes: DeviceType[];
  deviceTags: DeviceTag[];
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const DeviceFilters: React.FC<DeviceFiltersProps> = ({
  filter,
  onFilterChange,
  deviceTypes,
  deviceTags,
  isCollapsed = false,
  onToggleCollapse
}) => {
  const updateFilter = (updates: Partial<DeviceFilter>) => {
    onFilterChange({ ...filter, ...updates });
  };

  const clearFilter = () => {
    onFilterChange({});
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = filter.tags?.filter(tag => tag !== tagToRemove) || [];
    updateFilter({ tags: newTags.length > 0 ? newTags : undefined });
  };

  const addTag = (tagId: string) => {
    const currentTags = filter.tags || [];
    if (!currentTags.includes(tagId)) {
      updateFilter({ tags: [...currentTags, tagId] });
    }
  };

  const hasActiveFilters = Object.keys(filter).some(key => 
    filter[key as keyof DeviceFilter] !== undefined && 
    filter[key as keyof DeviceFilter] !== '' &&
    !(Array.isArray(filter[key as keyof DeviceFilter]) && filter[key as keyof DeviceFilter]?.length === 0)
  );

  if (isCollapsed) {
    return (
      <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg">
        <Button variant="outline" size="sm" onClick={onToggleCollapse}>
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {hasActiveFilters && (
            <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs">
              {Object.keys(filter).length}
            </Badge>
          )}
        </Button>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilter}>
            Clear All
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Device Filters
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilter}>
                <X className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            )}
            {onToggleCollapse && (
              <Button variant="ghost" size="sm" onClick={onToggleCollapse}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="space-y-2">
          <Label htmlFor="search">Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              id="search"
              placeholder="Search devices by name or ID..."
              value={filter.search || ''}
              onChange={(e) => updateFilter({ search: e.target.value || undefined })}
              className="pl-10"
            />
          </div>
        </div>

        {/* Device Type */}
        <div className="space-y-2">
          <Label htmlFor="deviceType">Device Type</Label>
          <Select 
            value={filter.device_type?.toString() || ''} 
            onValueChange={(value) => updateFilter({ device_type: value ? parseInt(value) : undefined })}
          >
            <SelectTrigger>
              <SelectValue placeholder="All device types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All device types</SelectItem>
              {deviceTypes.map((type) => (
                <SelectItem key={type.gp51_device_type_id} value={type.gp51_device_type_id.toString()}>
                  {type.type_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status */}
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select 
            value={filter.status || ''} 
            onValueChange={(value) => updateFilter({ status: value || undefined })}
          >
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All statuses</SelectItem>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
              <SelectItem value="unknown">Unknown</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Active Status */}
        <div className="space-y-2">
          <Label htmlFor="isActive">Active Status</Label>
          <Select 
            value={filter.is_active?.toString() || ''} 
            onValueChange={(value) => updateFilter({ is_active: value ? value === 'true' : undefined })}
          >
            <SelectTrigger>
              <SelectValue placeholder="All devices" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All devices</SelectItem>
              <SelectItem value="true">Active only</SelectItem>
              <SelectItem value="false">Inactive only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <Label htmlFor="tags">Tags</Label>
          <Select value="" onValueChange={addTag}>
            <SelectTrigger>
              <SelectValue placeholder="Add tags to filter..." />
            </SelectTrigger>
            <SelectContent>
              {deviceTags
                .filter(tag => !filter.tags?.includes(tag.id))
                .map((tag) => (
                  <SelectItem key={tag.id} value={tag.id}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: tag.color }}
                      />
                      {tag.name}
                    </div>
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          
          {/* Selected Tags */}
          {filter.tags && filter.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {filter.tags.map((tagId) => {
                const tag = deviceTags.find(t => t.id === tagId);
                return tag ? (
                  <Badge 
                    key={tagId} 
                    variant="secondary" 
                    className="flex items-center gap-1"
                  >
                    <div 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: tag.color }}
                    />
                    {tag.name}
                    <button
                      onClick={() => removeTag(tagId)}
                      className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ) : null;
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DeviceFilters;
