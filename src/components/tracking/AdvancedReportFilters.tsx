
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar, Download } from 'lucide-react';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import type { VehicleData } from '@/types/vehicle';
import type { ReportFilters } from '@/hooks/useAdvancedReports';

interface AdvancedReportFiltersProps {
  vehicles: VehicleData[];
  filters: ReportFilters;
  onFiltersChange: (newFilters: Partial<ReportFilters>) => void;
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
  return (
    <div className="space-y-4 p-4 border rounded-lg bg-white">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Vehicle Filter */}
        <div>
          <label className="block text-sm font-medium mb-1">Vehicle</label>
          <Select 
            value={filters.vehicleIds[0] || 'all'} 
            onValueChange={(value) => 
              onFiltersChange({ 
                vehicleIds: value === 'all' ? [] : [value] 
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select vehicle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Vehicles</SelectItem>
              {vehicles.map((vehicle) => (
                <SelectItem key={vehicle.device_id} value={vehicle.device_id}>
                  {vehicle.device_name || vehicle.device_id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date From */}
        <div>
          <label className="block text-sm font-medium mb-1">From Date</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <Calendar className="mr-2 h-4 w-4" />
                {filters.dateRange.from ? format(filters.dateRange.from, 'PPP') : 'Select date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={filters.dateRange.from || undefined}
                onSelect={(date) => onFiltersChange({ 
                  dateRange: { ...filters.dateRange, from: date || null } 
                })}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Generate Button */}
        <div className="flex items-end">
          <Button
            onClick={onGenerate}
            disabled={isLoading}
            className="w-full"
          >
            <Download className="mr-2 h-4 w-4" />
            {isLoading ? 'Generating...' : 'Generate Report'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdvancedReportFilters;
