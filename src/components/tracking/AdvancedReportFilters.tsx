
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, X, Filter, Download } from 'lucide-react';
import { format } from 'date-fns';

interface AdvancedReportFiltersProps {
  onFiltersChange: (filters: any) => void;
  onExport: (format: 'pdf' | 'excel' | 'csv') => void;
  vehicles: Array<{ id: string; name: string; device_id: string }>;
  isLoading?: boolean;
}

const AdvancedReportFilters: React.FC<AdvancedReportFiltersProps> = ({
  onFiltersChange,
  onExport,
  vehicles,
  isLoading = false
}) => {
  const [filters, setFilters] = useState({
    dateFrom: null as Date | null,
    dateTo: null as Date | null,
    vehicleIds: [] as string[],
    reportType: 'fleet_summary',
    status: 'all',
    groupBy: 'vehicle',
    includeCharts: true,
    includeDetails: true
  });

  const [showCalendarFrom, setShowCalendarFrom] = useState(false);
  const [showCalendarTo, setShowCalendarTo] = useState(false);

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleVehicleToggle = (vehicleId: string) => {
    const newVehicleIds = filters.vehicleIds.includes(vehicleId)
      ? filters.vehicleIds.filter(id => id !== vehicleId)
      : [...filters.vehicleIds, vehicleId];
    
    handleFilterChange('vehicleIds', newVehicleIds);
  };

  const clearFilters = () => {
    const defaultFilters = {
      dateFrom: null,
      dateTo: null,
      vehicleIds: [],
      reportType: 'fleet_summary',
      status: 'all',
      groupBy: 'vehicle',
      includeCharts: true,
      includeDetails: true
    };
    setFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  const reportTypes = [
    { value: 'fleet_summary', label: 'Fleet Summary' },
    { value: 'trip_analysis', label: 'Trip Analysis' },
    { value: 'maintenance', label: 'Maintenance Report' },
    { value: 'alerts', label: 'Alerts Report' },
    { value: 'geofence', label: 'Geofence Report' },
    { value: 'mileage', label: 'Mileage Report' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Advanced Report Filters
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Date From</Label>
            <Popover open={showCalendarFrom} onOpenChange={setShowCalendarFrom}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.dateFrom ? format(filters.dateFrom, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={filters.dateFrom}
                  onSelect={(date) => {
                    handleFilterChange('dateFrom', date);
                    setShowCalendarFrom(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Date To</Label>
            <Popover open={showCalendarTo} onOpenChange={setShowCalendarTo}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.dateTo ? format(filters.dateTo, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={filters.dateTo}
                  onSelect={(date) => {
                    handleFilterChange('dateTo', date);
                    setShowCalendarTo(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Report Type and Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Report Type</Label>
            <Select
              value={filters.reportType}
              onValueChange={(value) => handleFilterChange('reportType', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {reportTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Status Filter</Label>
            <Select
              value={filters.status}
              onValueChange={(value) => handleFilterChange('status', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="inactive">Inactive Only</SelectItem>
                <SelectItem value="maintenance">In Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Vehicle Selection */}
        <div className="space-y-2">
          <Label>Select Vehicles ({filters.vehicleIds.length} selected)</Label>
          <div className="border rounded-lg p-3 max-h-40 overflow-y-auto">
            <div className="space-y-2">
              {vehicles.map(vehicle => (
                <div key={vehicle.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={vehicle.id}
                    checked={filters.vehicleIds.includes(vehicle.device_id)}
                    onCheckedChange={() => handleVehicleToggle(vehicle.device_id)}
                  />
                  <Label 
                    htmlFor={vehicle.id}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {vehicle.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          
          {filters.vehicleIds.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {filters.vehicleIds.map(vehicleId => {
                const vehicle = vehicles.find(v => v.device_id === vehicleId);
                return (
                  <Badge key={vehicleId} variant="secondary" className="text-xs">
                    {vehicle?.name || vehicleId}
                    <X 
                      className="h-3 w-3 ml-1 cursor-pointer" 
                      onClick={() => handleVehicleToggle(vehicleId)}
                    />
                  </Badge>
                );
              })}
            </div>
          )}
        </div>

        {/* Report Options */}
        <div className="space-y-3">
          <Label>Report Options</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeCharts"
                checked={filters.includeCharts}
                onCheckedChange={(checked) => handleFilterChange('includeCharts', checked)}
              />
              <Label htmlFor="includeCharts" className="text-sm font-normal">
                Include Charts and Visualizations
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeDetails"
                checked={filters.includeDetails}
                onCheckedChange={(checked) => handleFilterChange('includeDetails', checked)}
              />
              <Label htmlFor="includeDetails" className="text-sm font-normal">
                Include Detailed Data Tables
              </Label>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={clearFilters}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Clear Filters
          </Button>
          
          <div className="flex gap-2 ml-auto">
            <Button
              variant="outline"
              onClick={() => onExport('csv')}
              disabled={isLoading}
              size="sm"
            >
              <Download className="h-4 w-4 mr-1" />
              CSV
            </Button>
            
            <Button
              variant="outline"
              onClick={() => onExport('excel')}
              disabled={isLoading}
              size="sm"
            >
              <Download className="h-4 w-4 mr-1" />
              Excel
            </Button>
            
            <Button
              onClick={() => onExport('pdf')}
              disabled={isLoading}
              size="sm"
            >
              <Download className="h-4 w-4 mr-1" />
              PDF
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdvancedReportFilters;
