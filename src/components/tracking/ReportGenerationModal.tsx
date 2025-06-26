
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DatePicker } from '@/components/ui/date-picker';
import { CalendarIcon, Download, FileText, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import type { ReportType, ReportTypeOption, EnhancedVehicle } from '@/types/vehicle';

interface ReportGenerationModalProps {
  open: boolean;
  onClose: () => void;
  vehicles: EnhancedVehicle[];
}

const ReportGenerationModal: React.FC<ReportGenerationModalProps> = ({
  open,
  onClose,
  vehicles
}) => {
  const [selectedReportType, setSelectedReportType] = useState<ReportType>('daily');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [isGenerating, setIsGenerating] = useState(false);

  const reportTypes: ReportTypeOption[] = [
    {
      id: 'daily',
      name: 'Daily Report',
      description: 'Vehicle activity for a single day'
    },
    {
      id: 'weekly', 
      name: 'Weekly Report',
      description: 'Vehicle activity for the past week'
    },
    {
      id: 'monthly',
      name: 'Monthly Report', 
      description: 'Vehicle activity for the past month'
    },
    {
      id: 'custom',
      name: 'Custom Range',
      description: 'Vehicle activity for a custom date range'
    }
  ];

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    
    try {
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real implementation, this would call your report generation service
      console.log('Generating report:', {
        type: selectedReportType,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        vehicleCount: vehicles.length
      });
      
      onClose();
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const getSelectedReportType = (): ReportTypeOption => {
    return reportTypes.find(type => type.id === selectedReportType) || reportTypes[0];
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generate Vehicle Report
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Report Type Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Report Type</Label>
            <RadioGroup 
              value={selectedReportType} 
              onValueChange={(value) => setSelectedReportType(value as ReportType)}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {reportTypes.map((type) => (
                  <div key={type.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={type.id} id={type.id} />
                    <Label 
                      htmlFor={type.id} 
                      className="flex-1 cursor-pointer"
                    >
                      <Card className="p-3 hover:bg-gray-50 transition-colors">
                        <div className="space-y-1">
                          <div className="font-medium">{type.name}</div>
                          <div className="text-sm text-gray-600">{type.description}</div>
                        </div>
                      </Card>
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* Date Range Selection */}
          {selectedReportType === 'custom' && (
            <div className="space-y-3">
              <Label className="text-base font-medium">Date Range</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-date">Start Date</Label>
                  <DatePicker
                    date={startDate}
                    onDateChange={setStartDate}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-date">End Date</Label>
                  <DatePicker
                    date={endDate}
                    onDateChange={setEndDate}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Vehicle Summary */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Vehicles to Include</Label>
                  <Badge variant="secondary">
                    {vehicles.length} vehicles
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-32 overflow-y-auto">
                  {vehicles.slice(0, 6).map((vehicle) => (
                    <div key={vehicle.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm font-medium">
                        {vehicle.plateNumber || vehicle.model || vehicle.device_name}
                      </span>
                      <Badge 
                        variant={vehicle.isOnline ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {vehicle.isOnline ? 'Online' : 'Offline'}
                      </Badge>
                    </div>
                  ))}
                  {vehicles.length > 6 && (
                    <div className="flex items-center justify-center p-2 bg-gray-100 rounded text-sm text-gray-600">
                      +{vehicles.length - 6} more vehicles
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Report Summary */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <Label className="font-medium text-blue-900">Report Summary</Label>
                </div>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>Report Type: <strong>{getSelectedReportType().name}</strong></p>
                  <p>Description: {getSelectedReportType().description}</p>
                  {selectedReportType === 'custom' && (
                    <p>
                      Date Range: {format(startDate, 'PP')} - {format(endDate, 'PP')}
                    </p>
                  )}
                  <p>Vehicles: <strong>{vehicles.length}</strong></p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleGenerateReport}
              disabled={isGenerating}
              className="flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Generate Report
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReportGenerationModal;
