
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { UserFilters } from '@/types/user-management';
import { Filter, X, Calendar as CalendarIcon, Save, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';

interface AdvancedUserFiltersProps {
  filters: UserFilters;
  onFiltersChange: (filters: UserFilters) => void;
  onSavePreset?: (name: string, filters: UserFilters) => void;
  savedPresets?: Array<{ name: string; filters: UserFilters }>;
}

const AdvancedUserFilters: React.FC<AdvancedUserFiltersProps> = ({
  filters,
  onFiltersChange,
  onSavePreset,
  savedPresets = []
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [presetName, setPresetName] = React.useState('');
  const [showPresetInput, setShowPresetInput] = React.useState(false);
  const [dateRange, setDateRange] = React.useState<{from?: Date; to?: Date}>({
    from: filters.dateRange ? new Date(filters.dateRange.from) : undefined,
    to: filters.dateRange ? new Date(filters.dateRange.to) : undefined
  });

  const handleFilterChange = (key: keyof UserFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const handleDateRangeChange = (range: {from?: Date; to?: Date}) => {
    setDateRange(range);
    if (range.from && range.to) {
      handleFilterChange('dateRange', {
        from: range.from.toISOString(),
        to: range.to.toISOString()
      });
    } else {
      handleFilterChange('dateRange', undefined);
    }
  };

  const clearFilters = () => {
    onFiltersChange({ search: '' });
    setDateRange({});
  };

  const savePreset = () => {
    if (presetName.trim() && onSavePreset) {
      onSavePreset(presetName.trim(), filters);
      setPresetName('');
      setShowPresetInput(false);
    }
  };

  const applyPreset = (preset: { name: string; filters: UserFilters }) => {
    onFiltersChange(preset.filters);
    if (preset.filters.dateRange) {
      setDateRange({
        from: new Date(preset.filters.dateRange.from),
        to: new Date(preset.filters.dateRange.to)
      });
    }
  };

  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'search') return value && value.length > 0;
    return value !== undefined && value !== null;
  }).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Advanced Filters
            {activeFiltersCount > 0 && (
              <Badge variant="secondary">{activeFiltersCount} active</Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </Button>
            {activeFiltersCount > 0 && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X className="w-4 h-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Saved Presets */}
          {savedPresets.length > 0 && (
            <div>
              <label className="text-sm font-medium mb-2 block">Saved Filter Presets</label>
              <div className="flex gap-2 flex-wrap">
                {savedPresets.map((preset, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => applyPreset(preset)}
                  >
                    {preset.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Filter Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Role Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Role</label>
              <Select 
                value={filters.role || 'all'} 
                onValueChange={(value) => handleFilterChange('role', value === 'all' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select 
                value={filters.status || 'all'} 
                onValueChange={(value) => handleFilterChange('status', value === 'all' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* GP51 Status */}
            <div>
              <label className="text-sm font-medium mb-2 block">GP51 Status</label>
              <Select 
                value={filters.gp51Status || 'all'} 
                onValueChange={(value) => handleFilterChange('gp51Status', value === 'all' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All GP51 statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All GP51 Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="not_connected">Not Connected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* GP51 User Type */}
            <div>
              <label className="text-sm font-medium mb-2 block">GP51 User Type</label>
              <Select 
                value={filters.gp51UserType?.toString() || 'all'} 
                onValueChange={(value) => handleFilterChange('gp51UserType', value === 'all' ? undefined : parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All user types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All User Types</SelectItem>
                  <SelectItem value="1">Company Admin</SelectItem>
                  <SelectItem value="2">Sub Admin</SelectItem>
                  <SelectItem value="3">End User</SelectItem>
                  <SelectItem value="4">Device User</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Registration Type */}
            <div>
              <label className="text-sm font-medium mb-2 block">Registration Type</label>
              <Select 
                value={filters.registrationType || 'all'} 
                onValueChange={(value) => handleFilterChange('registrationType', value === 'all' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All registration types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Registration Types</SelectItem>
                  <SelectItem value="admin">Admin Created</SelectItem>
                  <SelectItem value="public">Public Registration</SelectItem>
                  <SelectItem value="import">Import</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-2 block">Registration Date Range</label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="flex-1">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.from ? format(dateRange.from, 'PP') : 'From date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateRange.from}
                      onSelect={(date) => handleDateRangeChange({...dateRange, from: date})}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="flex-1">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.to ? format(dateRange.to, 'PP') : 'To date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateRange.to}
                      onSelect={(date) => handleDateRangeChange({...dateRange, to: date})}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Save Preset */}
          <div className="flex items-center gap-2 pt-4 border-t">
            {!showPresetInput ? (
              <Button variant="outline" size="sm" onClick={() => setShowPresetInput(true)}>
                <Save className="w-4 h-4 mr-1" />
                Save as Preset
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Preset name"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  className="w-40"
                />
                <Button size="sm" onClick={savePreset} disabled={!presetName.trim()}>
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowPresetInput(false)}>
                  Cancel
                </Button>
              </div>
            )}
            
            <Button variant="outline" size="sm" onClick={clearFilters}>
              <RotateCcw className="w-4 h-4 mr-1" />
              Reset All
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default AdvancedUserFilters;
