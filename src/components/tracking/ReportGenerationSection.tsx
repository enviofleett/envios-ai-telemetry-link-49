import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  FileText,
  Calendar as CalendarIcon,
  Download,
  Lock,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { VehicleData } from '@/services/unifiedVehicleData';

interface ReportGenerationSectionProps {
  vehicle: VehicleData;
  subscriptionFeatures: string[];
  onReportGenerate?: (vehicleId: string, reportType: string, dateRange: { from: Date; to: Date }) => void;
}

const ReportGenerationSection: React.FC<ReportGenerationSectionProps> = ({
  vehicle,
  subscriptionFeatures,
  onReportGenerate
}) => {
  const [fromDate, setFromDate] = useState<Date>();
  const [toDate, setToDate] = useState<Date>();
  const [selectedReportType, setSelectedReportType] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  const availableReports = [
    {
      id: 'trip',
      name: 'Trip Report',
      description: 'Detailed trip history with routes and stops',
      feature: 'Trip Reports'
    },
    {
      id: 'mileage',
      name: 'Mileage Report',
      description: 'Distance traveled and fuel efficiency metrics',
      feature: 'Mileage Reports'
    },
    {
      id: 'geofence',
      name: 'Geofence Report',
      description: 'Geofence entry/exit events and violations',
      feature: 'Geofence Reports'
    },
    {
      id: 'runtime',
      name: 'Engine Runtime Report',
      description: 'Engine usage statistics and idle time analysis',
      feature: 'Engine Runtime'
    },
    {
      id: 'places',
      name: 'Favorite Places Report',
      description: 'Most visited locations and dwell time analysis',
      feature: 'Favorite Places'
    }
  ];

  const isReportAvailable = (feature: string) => {
    return subscriptionFeatures.includes(feature);
  };

  const handleGenerateReport = async () => {
    if (!selectedReportType || !fromDate || !toDate) return;

    setIsGenerating(true);
    try {
      await onReportGenerate?.(vehicle.deviceId, selectedReportType, { 
        from: fromDate, 
        to: toDate 
      });
      
      // Simulate report generation delay
      await new Promise(resolve => setTimeout(resolve, 2000));
    } finally {
      setIsGenerating(false);
    }
  };

  const isFormValid = selectedReportType && fromDate && toDate && fromDate <= toDate;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Generate Reports
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Date Range Selection */}
        <div className="space-y-4">
          <h3 className="font-medium">Select Date Range</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">From Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !fromDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {fromDate ? format(fromDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={fromDate}
                    onSelect={setFromDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">To Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !toDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {toDate ? format(toDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={toDate}
                    onSelect={setToDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        {/* Report Type Selection */}
        <div className="space-y-4">
          <h3 className="font-medium">Select Report Type</h3>
          <Select value={selectedReportType} onValueChange={setSelectedReportType}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a report type" />
            </SelectTrigger>
            <SelectContent>
              {availableReports.map((report) => (
                <SelectItem 
                  key={report.id} 
                  value={report.id}
                  disabled={!isReportAvailable(report.feature)}
                >
                  <div className="flex items-center justify-between w-full">
                    <span>{report.name}</span>
                    {!isReportAvailable(report.feature) && (
                      <Lock className="h-3 w-3 text-gray-400 ml-2" />
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Available Reports List */}
        <div className="space-y-4">
          <h3 className="font-medium">Available Reports</h3>
          <div className="grid gap-3">
            {availableReports.map((report) => {
              const isAvailable = isReportAvailable(report.feature);
              return (
                <div 
                  key={report.id}
                  className={`p-3 border rounded-lg ${isAvailable ? 'bg-white' : 'bg-gray-50'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <BarChart3 className={`h-4 w-4 ${isAvailable ? 'text-blue-500' : 'text-gray-400'}`} />
                        <h4 className={`font-medium ${isAvailable ? 'text-gray-900' : 'text-gray-500'}`}>
                          {report.name}
                        </h4>
                        {!isAvailable && (
                          <Badge variant="secondary" className="text-xs">
                            <Lock className="h-3 w-3 mr-1" />
                            Upgrade to access
                          </Badge>
                        )}
                      </div>
                      <p className={`text-sm ${isAvailable ? 'text-gray-600' : 'text-gray-400'}`}>
                        {report.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Generate Button */}
        <div className="pt-4 border-t">
          <Button
            onClick={handleGenerateReport}
            disabled={!isFormValid || isGenerating}
            className="w-full"
          >
            <Download className="h-4 w-4 mr-2" />
            {isGenerating ? 'Generating Report...' : 'Generate Report'}
          </Button>
          
          {!isFormValid && (
            <p className="text-sm text-gray-500 mt-2 text-center">
              Please select dates and report type to generate
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportGenerationSection;
