
import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Search, RefreshCw, Filter } from 'lucide-react';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import type { VehicleData } from '@/services/unifiedVehicleData';
import type { ReportFilters } from '@/hooks/useAdvancedReports';

interface AdvancedReportFiltersProps {
  vehicles: VehicleData[];
  filters: ReportFilters;
  onFiltersChange: (filters: Partial<ReportFilters>) => void;
  onGenerate: () => void;
  isLoading: boolean;
}

const AdvancedReportFilters: React.FC<AdvancedReportFiltersProps> = ({
  vehicles,
  filters,
  onFiltersChange,
  onGenerate,
  isLoading
}) => {
  const handleDateFromChange = (date: Date | undefined) => {
    onFiltersChange({
      dateRange: {
        ...filters.dateRange,
        from: date || null,
      },
    });
  };

  const handleDateToChange = (date: Date | undefined) => {
    onFiltersChange({
      dateRange: {
        ...filters.dateRange,
        to: date || null,
      },
    });
  };

  const handleVehicleChange = (vehicleId: string) => {
    if (vehicleId === 'all') {
      onFiltersChange({ vehicleIds: [] });
    } else {
      onFiltersChange({ vehicleIds: [vehicleId] });
    }
  };

  const getStatusOptions = () => {
    switch (filters.reportType) {
      case 'trip':
      case 'activity':
        return [
          { value: 'all', label: 'All Status' },
          { value: 'Normal', label: 'Normal' },
          { value: 'Alert', label: 'Alert' },
        ];
      case 'geofence':
        return [
          { value: 'all', label: 'All Events' },
          { value: 'Normal', label: 'Normal' },
          { value: 'Violation', label: 'Violation' },
        ];
      case 'maintenance':
        return [
          { value: 'all', label: 'All Status' },
          { value: 'scheduled', label: 'Scheduled' },
          { value: 'completed', label: 'Completed' },
          { value: 'overdue', label: 'Overdue' },
        ];
      case 'alerts':
        return [
          { value: 'all', label: 'All Alerts' },
          { value: 'active', label: 'Active' },
          { value: 'acknowledged', label: 'Acknowledged' },
          { value: 'resolved', label: 'Resolved' },
        ];
      case 'mileage':
        return [
          { value: 'all', label: 'All Periods' },
          { value: 'Daily', label: 'Daily' },
          { value: 'Weekly', label: 'Weekly' },
          { value: 'Monthly', label: 'Monthly' },
        ];
      default:
        return [{ value: 'all', label: 'All Status' }];
    }
  };

  const getFilterLabel = () => {
    switch (filters.reportType) {
      case 'maintenance':
        return 'Status';
      case 'alerts':
        return 'Alert Status';
      case 'geofence':
        return 'Event Type';
      case 'mileage':
        return 'Period';
      default:
        return 'Status';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6 p-4 bg-gray-background rounded-lg">
      {/* Vehicle Selection */}
      <Select
        value={filters.vehicleIds.length === 0 ? 'all' : filters.vehicleIds[0]}
        onValueChange={handleVehicleChange}
      >
        <SelectTrigger className="h-10 border-gray-lighter bg-white">
          <SelectValue placeholder="Vehicle" />
        </SelectTrigger>
        <SelectContent className="bg-white border border-gray-lighter">
          <SelectItem value="all">All Vehicles ({vehicles.length})</SelectItem>
          {vehicles.map((vehicle) => (
            <SelectItem key={vehicle.deviceid} value={vehicle.deviceid}>
              {vehicle.devicename || vehicle.deviceid}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* From Date */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="h-10 justify-start text-left font-normal bg-white border-gray-lighter"
          >
            <Calendar className="mr-2 h-4 w-4" />
            {filters.dateRange.from ? (
              format(filters.dateRange.from, 'MMM dd, yyyy')
            ) : (
              <span>From date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-white" align="start">
          <CalendarComponent
            mode="single"
            selected={filters.dateRange.from || undefined}
            onSelect={handleDateFromChange}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      {/* To Date */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="h-10 justify-start text-left font-normal bg-white border-gray-lighter"
          >
            <Calendar className="mr-2 h-4 w-4" />
            {filters.dateRange.to ? (
              format(filters.dateRange.to, 'MMM dd, yyyy')
            ) : (
              <span>To date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-white" align="start">
          <CalendarComponent
            mode="single"
            selected={filters.dateRange.to || undefined}
            onSelect={handleDateToChange}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      {/* Status/Type Filter */}
      <Select
        value={filters.status || 'all'}
        onValueChange={(value) => onFiltersChange({ status: value === 'all' ? undefined : value })}
      >
        <SelectTrigger className="h-10 border-gray-lighter bg-white">
          <SelectValue placeholder={getFilterLabel()} />
        </SelectTrigger>
        <SelectContent className="bg-white border border-gray-lighter">
          {getStatusOptions().map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Advanced Filters (placeholder for future enhancement) */}
      <Button
        variant="outline"
        className="h-10 bg-white border-gray-lighter text-primary-dark hover:bg-gray-background"
        disabled
      >
        <Filter className="w-4 h-4 mr-2" />
        More Filters
      </Button>

      {/* Generate Button */}
      <Button
        onClick={onGenerate}
        disabled={isLoading}
        className="bg-teal-primary text-white hover:bg-teal-primary/90"
      >
        {isLoading ? (
          <>
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Search className="w-4 h-4 mr-2" />
            Generate
          </>
        )}
      </Button>
    </div>
  );
};

export default AdvancedReportFilters;
