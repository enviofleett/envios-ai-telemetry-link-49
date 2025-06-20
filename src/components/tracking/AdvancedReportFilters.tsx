
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Filter, Play } from 'lucide-react';

interface VehicleItem {
  id: string;
  name: string;
  device_id: string;
}

interface ReportFilters {
  dateFrom: Date;
  dateTo: Date;
  vehicleIds: string[];
  reportType: string;
}

interface AdvancedReportFiltersProps {
  vehicles: VehicleItem[];
  filters: ReportFilters;
  onFiltersChange: (filters: ReportFilters) => void;
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
  const handleDateFromChange = (value: string) => {
    onFiltersChange({
      ...filters,
      dateFrom: new Date(value)
    });
  };

  const handleDateToChange = (value: string) => {
    onFiltersChange({
      ...filters,
      dateTo: new Date(value)
    });
  };

  const handleReportTypeChange = (value: string) => {
    onFiltersChange({
      ...filters,
      reportType: value
    });
  };

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Report Filters
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Date From */}
          <div>
            <label className="block text-sm font-medium mb-2">From Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="date"
                value={formatDateForInput(filters.dateFrom)}
                onChange={(e) => handleDateFromChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Date To */}
          <div>
            <label className="block text-sm font-medium mb-2">To Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="date"
                value={formatDateForInput(filters.dateTo)}
                onChange={(e) => handleDateToChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Report Type */}
          <div>
            <label className="block text-sm font-medium mb-2">Report Type</label>
            <Select value={filters.reportType} onValueChange={handleReportTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select report type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fleet_summary">Fleet Summary</SelectItem>
                <SelectItem value="trip_analysis">Trip Analysis</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="alerts">Alerts</SelectItem>
                <SelectItem value="mileage">Mileage</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Generate Button */}
          <div className="flex items-end">
            <Button 
              onClick={onGenerate} 
              disabled={isLoading}
              className="w-full"
            >
              <Play className="w-4 h-4 mr-2" />
              {isLoading ? 'Generating...' : 'Generate Report'}
            </Button>
          </div>
        </div>

        {/* Vehicle Selection */}
        <div className="mt-4">
          <label className="block text-sm font-medium mb-2">
            Vehicles ({vehicles.length} available)
          </label>
          <div className="text-sm text-gray-600">
            Report will include data from all vehicles. Vehicle-specific filtering will be available in future updates.
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdvancedReportFilters;
