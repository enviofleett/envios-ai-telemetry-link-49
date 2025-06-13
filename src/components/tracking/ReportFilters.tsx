
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Search, RefreshCw } from 'lucide-react';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import type { VehicleData } from '@/types/vehicle';
import type { ReportFilters as ReportFiltersType } from '@/hooks/useAdvancedReports';

interface ReportFiltersProps {
  vehicles: VehicleData[];
  filters: ReportFiltersType;
  onFiltersChange: (filters: Partial<ReportFiltersType>) => void;
  onGenerate: () => void;
  isLoading: boolean;
}

const ReportFilters: React.FC<ReportFiltersProps> = ({
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6 p-4 bg-gray-background rounded-lg">
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
            <SelectItem key={vehicle.device_id} value={vehicle.device_id}>
              {vehicle.device_name || vehicle.device_id}
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

      {/* Status Filter */}
      <Select
        value={filters.status || 'all'}
        onValueChange={(value) => onFiltersChange({ status: value === 'all' ? undefined : value })}
      >
        <SelectTrigger className="h-10 border-gray-lighter bg-white">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent className="bg-white border border-gray-lighter">
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="normal">Normal</SelectItem>
          <SelectItem value="alert">Alert</SelectItem>
        </SelectContent>
      </Select>

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

export default ReportFilters;
