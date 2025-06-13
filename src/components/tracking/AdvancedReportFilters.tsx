
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, Download, Filter } from 'lucide-react';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import type { VehicleData } from '@/types/vehicle';

interface AdvancedReportFiltersProps {
  vehicles: VehicleData[];
  reportType: string;
  onReportTypeChange: (type: string) => void;
  vehicleFilter: string;
  onVehicleFilterChange: (vehicleId: string) => void;
  dateFrom: Date | null;
  onDateFromChange: (date: Date | null) => void;
  dateTo: Date | null;
  onDateToChange: (date: Date | null) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  onGenerateReport: () => void;
  isGenerating?: boolean;
}

const AdvancedReportFilters: React.FC<AdvancedReportFiltersProps> = ({
  vehicles,
  reportType,
  onReportTypeChange,
  vehicleFilter,
  onVehicleFilterChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  statusFilter,
  onStatusFilterChange,
  onGenerateReport,
  isGenerating = false
}) => {
  const reportTypes = [
    { value: 'activity', label: 'Activity Report' },
    { value: 'fuel', label: 'Fuel Consumption' },
    { value: 'mileage', label: 'Mileage Report' },
    { value: 'speed', label: 'Speed Analysis' },
    { value: 'maintenance', label: 'Maintenance Schedule' },
    { value: 'summary', label: 'Summary Report' }
  ];

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'online', label: 'Online Only' },
    { value: 'offline', label: 'Offline Only' },
    { value: 'idle', label: 'Idle Only' },
    { value: 'moving', label: 'Moving Only' }
  ];

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-white">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Advanced Report Filters</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Report Type */}
        <div>
          <label className="block text-sm font-medium mb-1">Report Type</label>
          <Select value={reportType} onValueChange={onReportTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select report type" />
            </SelectTrigger>
            <SelectContent>
              {reportTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Vehicle Filter */}
        <div>
          <label className="block text-sm font-medium mb-1">Vehicle</label>
          <Select value={vehicleFilter} onValueChange={onVehicleFilterChange}>
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

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
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
                {dateFrom ? format(dateFrom, 'PPP') : 'Select date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={dateFrom || undefined}
                onSelect={(date) => onDateFromChange(date || null)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Date To */}
        <div>
          <label className="block text-sm font-medium mb-1">To Date</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <Calendar className="mr-2 h-4 w-4" />
                {dateTo ? format(dateTo, 'PPP') : 'Select date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={dateTo || undefined}
                onSelect={(date) => onDateToChange(date || null)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Generate Button */}
        <div className="flex items-end">
          <Button
            onClick={onGenerateReport}
            disabled={isGenerating}
            className="w-full"
          >
            <Download className="mr-2 h-4 w-4" />
            {isGenerating ? 'Generating...' : 'Generate Report'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdvancedReportFilters;
