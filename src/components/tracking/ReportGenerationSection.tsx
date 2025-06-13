
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Download, FileText, TrendingUp, MapPin, Clock } from 'lucide-react';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import type { VehicleData } from '@/types/vehicle';

interface ReportGenerationSectionProps {
  vehicles: VehicleData[];
}

const ReportGenerationSection: React.FC<ReportGenerationSectionProps> = ({ vehicles }) => {
  const [selectedReportType, setSelectedReportType] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('all');
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [isGenerating, setIsGenerating] = useState(false);

  const reportTypes = [
    {
      id: 'activity',
      name: 'Vehicle Activity Report',
      description: 'Detailed activity logs and movement patterns',
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'bg-blue-500'
    },
    {
      id: 'location',
      name: 'Location History Report',
      description: 'GPS tracking and location history',
      icon: <MapPin className="h-5 w-5" />,
      color: 'bg-green-500'
    },
    {
      id: 'summary',
      name: 'Fleet Summary Report',
      description: 'Overall fleet performance and statistics',
      icon: <FileText className="h-5 w-5" />,
      color: 'bg-purple-500'
    },
    {
      id: 'usage',
      name: 'Usage Analytics Report',
      description: 'Vehicle utilization and efficiency metrics',
      icon: <Clock className="h-5 w-5" />,
      color: 'bg-orange-500'
    }
  ];

  const handleGenerateReport = async () => {
    if (!selectedReportType) return;
    
    setIsGenerating(true);
    
    // Simulate report generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock report download
    console.log('Generating report:', {
      type: selectedReportType,
      vehicle: selectedVehicle,
      dateFrom,
      dateTo
    });
    
    setIsGenerating(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Generate Reports
          <Badge variant="outline">
            {vehicles.length} vehicles available
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Report Type Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reportTypes.map((report) => (
            <div
              key={report.id}
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                selectedReportType === report.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedReportType(report.id)}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg text-white ${report.color}`}>
                  {report.icon}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">{report.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Vehicle Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Vehicle</label>
            <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
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
            <label className="block text-sm font-medium mb-2">From Date</label>
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
                  selected={dateFrom}
                  onSelect={setDateFrom}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Date To */}
          <div>
            <label className="block text-sm font-medium mb-2">To Date</label>
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
                  selected={dateTo}
                  onSelect={setDateTo}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Generate Button */}
          <div className="flex items-end">
            <Button
              onClick={handleGenerateReport}
              disabled={!selectedReportType || isGenerating}
              className="w-full"
            >
              <Download className="mr-2 h-4 w-4" />
              {isGenerating ? 'Generating...' : 'Generate Report'}
            </Button>
          </div>
        </div>

        {/* Report Preview */}
        {selectedReportType && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">Report Preview</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Type:</span>
                <p className="font-medium">
                  {reportTypes.find(r => r.id === selectedReportType)?.name}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Vehicle:</span>
                <p className="font-medium">
                  {selectedVehicle === 'all' ? 'All Vehicles' : 
                   vehicles.find(v => v.device_id === selectedVehicle)?.device_name || 'Unknown'}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Date Range:</span>
                <p className="font-medium">
                  {dateFrom && dateTo
                    ? `${format(dateFrom, 'MMM dd')} - ${format(dateTo, 'MMM dd')}`
                    : 'All time'
                  }
                </p>
              </div>
              <div>
                <span className="text-gray-600">Format:</span>
                <p className="font-medium">PDF Document</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReportGenerationSection;
