
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Calendar as CalendarIcon,
  Wrench,
  Heart,
  Package,
  MapPin,
  FileText,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { Vehicle } from '@/services/unifiedVehicleData';
import WorkshopAssignmentModal from './WorkshopAssignmentModal';
import ReportGenerationSection from './ReportGenerationSection';

interface VehicleProfileTabProps {
  vehicle: Vehicle | null;
  onWorkshopAssign?: (vehicleId: string, workshopId: string) => void;
  onReportGenerate?: (vehicleId: string, reportType: string, dateRange: { from: Date; to: Date }) => void;
}

const VehicleProfileTab: React.FC<VehicleProfileTabProps> = ({
  vehicle,
  onWorkshopAssign,
  onReportGenerate
}) => {
  const [showWorkshopModal, setShowWorkshopModal] = useState(false);
  const [maintenanceDate, setMaintenanceDate] = useState<Date>();

  if (!vehicle) {
    return (
      <Card className="w-full">
        <CardContent className="p-6 text-center text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <p>Select a vehicle to view its profile</p>
        </CardContent>
      </Card>
    );
  }

  const getVehicleInfo = () => {
    return {
      nextMaintenance: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
      healthScore: Math.floor(Math.random() * 40) + 60, // 60-100%
      assignedWorkshop: 'AutoFix Pro Workshop',
      hasWorkshop: Math.random() > 0.3,
      subscription: {
        package: 'Premium Fleet',
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        features: ['Trip Reports', 'Mileage Reports', 'Geofence Reports', 'Engine Runtime', 'Favorite Places']
      }
    };
  };

  const vehicleInfo = getVehicleInfo();

  const getHealthScoreBadge = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <Tabs defaultValue="information" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="information" className="text-xs md:text-sm">Vehicle Information</TabsTrigger>
          <TabsTrigger value="reports" className="text-xs md:text-sm">Reports & Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="information" className="space-y-4">
          {/* Vehicle Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <MapPin className="h-4 w-4 md:h-5 md:w-5" />
                Vehicle Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Vehicle Name</label>
                  <p className="font-semibold break-words">{vehicle.devicename}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Device ID</label>
                  <p className="font-mono text-sm break-all">{vehicle.deviceid}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Registration Date</label>
                  <p className="text-sm">Available in system</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                  <p className="text-sm">{vehicle.lastPosition?.updatetime 
                    ? new Date(vehicle.lastPosition.updatetime).toLocaleDateString() 
                    : 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Maintenance & Health */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <Wrench className="h-4 w-4 md:h-5 md:w-5" />
                Maintenance & Health
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 md:space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-3">
                  <label className="text-sm font-medium text-muted-foreground">Next Maintenance Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !maintenanceDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        <span className="truncate">
                          {maintenanceDate ? format(maintenanceDate, "PPP") : format(vehicleInfo.nextMaintenance, "PPP")}
                        </span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={maintenanceDate || vehicleInfo.nextMaintenance}
                        onSelect={setMaintenanceDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-muted-foreground">Health Score</label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-muted rounded-full h-3">
                        <div 
                          className={`h-3 rounded-full transition-all duration-500 ${
                            vehicleInfo.healthScore >= 80 ? 'bg-green-500' : 
                            vehicleInfo.healthScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${vehicleInfo.healthScore}%` }}
                        ></div>
                      </div>
                      <Badge variant={getHealthScoreBadge(vehicleInfo.healthScore)} className="ml-2">
                        {vehicleInfo.healthScore}%
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">Last inspection by affiliated workshop</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-muted-foreground">Assigned Workshop</label>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 md:p-4 border rounded-lg gap-3">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {vehicleInfo.hasWorkshop ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="truncate">{vehicleInfo.assignedWorkshop}</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                        <span className="text-muted-foreground">No workshop assigned</span>
                      </>
                    )}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowWorkshopModal(true)}
                    className="w-full sm:w-auto flex-shrink-0"
                  >
                    {vehicleInfo.hasWorkshop ? 'Change Workshop' : 'Assign Workshop'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Package */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <Package className="h-4 w-4 md:h-5 md:w-5" />
                Subscription Package
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 truncate">{vehicleInfo.subscription.package}</h3>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    Valid until {vehicleInfo.subscription.validUntil.toLocaleDateString()}
                  </p>
                </div>
                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 flex-shrink-0">Active</Badge>
              </div>
              
              <div className="space-y-3">
                <label className="text-sm font-medium text-muted-foreground">Included Features</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {vehicleInfo.subscription.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                      <span className="truncate">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <ReportGenerationSection 
            vehicle={vehicle}
            subscriptionFeatures={vehicleInfo.subscription.features}
            onReportGenerate={onReportGenerate}
          />
        </TabsContent>
      </Tabs>

      {/* Workshop Assignment Modal */}
      <WorkshopAssignmentModal
        isOpen={showWorkshopModal}
        onClose={() => setShowWorkshopModal(false)}
        onAssign={(workshopId) => {
          onWorkshopAssign?.(vehicle.deviceid, workshopId);
          setShowWorkshopModal(false);
        }}
      />
    </div>
  );
};

export default VehicleProfileTab;
