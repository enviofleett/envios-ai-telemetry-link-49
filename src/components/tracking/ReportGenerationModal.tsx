
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart3,
  CalendarIcon,
  Download,
  RefreshCw,
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import type { EnhancedVehicle, ReportType } from '@/types/enhancedVehicle';
import { useToast } from '@/hooks/use-toast';

interface ReportGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedReport: string | null;
  reportTypes: ReportType[];
  vehicles: EnhancedVehicle[];
}

export const ReportGenerationModal: React.FC<ReportGenerationModalProps> = ({
  isOpen,
  onClose,
  selectedReport,
  reportTypes,
  vehicles
}) => {
  const [reportDateRange, setReportDateRange] = useState<{ from?: Date; to?: Date }>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [reportVehicles, setReportVehicles] = useState<string[]>([]);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const { toast } = useToast();

  const selectedReportType = reportTypes.find(r => r.id === selectedReport);

  const generateReport = async () => {
    setIsGeneratingReport(true);

    // Simulate report generation
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const reportData = {
      type: selectedReport,
      dateRange: reportDateRange,
      vehicles: reportVehicles.length > 0 ? reportVehicles : vehicles.map((v) => v.id),
      generatedAt: new Date().toISOString(),
      totalVehicles: reportVehicles.length > 0 ? reportVehicles.length : vehicles.length,
    };

    console.log("Generated report:", reportData);

    setIsGeneratingReport(false);
    onClose();

    toast({
      title: "Report Generated Successfully",
      description: `${selectedReportType?.name} has been generated and is ready for download.`,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Generate {selectedReportType?.name}
          </DialogTitle>
          <DialogDescription>
            Configure your report parameters and generate comprehensive fleet analytics
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Date Range Selection */}
          <div className="space-y-3">
            <h4 className="font-medium">Report Period</h4>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setReportDateRange({
                      from: subDays(new Date(), 7),
                      to: new Date(),
                    })
                  }
                >
                  Last 7 Days
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setReportDateRange({
                      from: subDays(new Date(), 30),
                      to: new Date(),
                    })
                  }
                >
                  Last 30 Days
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setReportDateRange({
                      from: subDays(new Date(), 90),
                      to: new Date(),
                    })
                  }
                >
                  Last 90 Days
                </Button>
              </div>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[140px] justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {reportDateRange?.from ? format(reportDateRange.from, "MMM dd, yyyy") : "From Date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={reportDateRange?.from}
                      onSelect={(date) => setReportDateRange({ ...reportDateRange, from: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[140px] justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {reportDateRange?.to ? format(reportDateRange.to, "MMM dd, yyyy") : "To Date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={reportDateRange?.to}
                      onSelect={(date) => setReportDateRange({ ...reportDateRange, to: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Vehicle Selection */}
          <div className="space-y-3">
            <h4 className="font-medium">Vehicle Selection</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="all-vehicles"
                  checked={reportVehicles.length === 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setReportVehicles([]);
                    }
                  }}
                  className="rounded"
                />
                <label htmlFor="all-vehicles" className="text-sm font-medium">
                  All Vehicles ({vehicles.length})
                </label>
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                {vehicles.map((vehicle) => (
                  <div key={vehicle.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={vehicle.id}
                      checked={reportVehicles.includes(vehicle.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setReportVehicles([...reportVehicles, vehicle.id]);
                        } else {
                          setReportVehicles(reportVehicles.filter((id) => id !== vehicle.id));
                        }
                      }}
                      className="rounded"
                    />
                    <label htmlFor={vehicle.id} className="text-sm">
                      {vehicle.plateNumber} - {vehicle.model}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Report Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Report Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-2">
                <div><strong>Report Type:</strong> {selectedReportType?.name}</div>
                <div>
                  <strong>Period:</strong> {reportDateRange?.from ? format(reportDateRange.from, "MMM dd, yyyy") : "Not set"} -{" "}
                  {reportDateRange?.to ? format(reportDateRange.to, "MMM dd, yyyy") : "Not set"}
                </div>
                <div>
                  <strong>Vehicles:</strong>{" "}
                  {reportVehicles.length === 0
                    ? `All vehicles (${vehicles.length})`
                    : `${reportVehicles.length} selected`}
                </div>
                <div><strong>Description:</strong> {selectedReportType?.description}</div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={generateReport}
              disabled={isGeneratingReport || !reportDateRange?.from || !reportDateRange?.to}
            >
              {isGeneratingReport ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
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
