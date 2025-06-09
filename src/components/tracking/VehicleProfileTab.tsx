
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
        <CardContent className="p-6 text-center text-gray-500">
          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
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

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthScoreBadge = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="information" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="information">Vehicle Information</TabsTrigger>
          <TabsTrigger value="reports">Reports & Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="information" className="space-y-4">
          {/* Vehicle Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Vehicle Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Vehicle Name</label>
                  <p className="font-semibold">{vehicle.devicename}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Device ID</label>
                  <p className="font-mono text-sm">{vehicle.deviceid}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Registration Date</label>
                  <p>{vehicle.created_at ? new Date(vehicle.created_at).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Last Updated</label>
                  <p>{vehicle.updated_at ? new Date(vehicle.updated_at).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Maintenance & Health */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Maintenance & Health
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">Next Maintenance Date</label>
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
                        {maintenanceDate ? format(maintenanceDate, "PPP") : format(vehicleInfo.nextMaintenance, "PPP")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={maintenanceDate || vehicleInfo.nextMaintenance}
                        onSelect={setMaintenanceDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">Health Score</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full ${vehicleInfo.healthScore >= 80 ? 'bg-green-500' : vehicleInfo.healthScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${vehicleInfo.healthScore}%` }}
                      ></div>
                    </div>
                    <Badge variant={getHealthScoreBadge(vehicleInfo.healthScore)}>
                      {vehicleInfo.healthScore}%
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500">Last inspection by affiliated workshop</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600">Assigned Workshop</label>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    {vehicleInfo.hasWorkshop ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>{vehicleInfo.assignedWorkshop}</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        <span className="text-gray-500">No workshop assigned</span>
                      </>
                    )}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowWorkshopModal(true)}
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
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Subscription Package
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg mb-4">
                <div>
                  <h3 className="font-semibold text-blue-900">{vehicleInfo.subscription.package}</h3>
                  <p className="text-sm text-blue-600">
                    Valid until {vehicleInfo.subscription.validUntil.toLocaleDateString()}
                  </p>
                </div>
                <Badge className="bg-blue-100 text-blue-800">Active</Badge>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600">Included Features</label>
                <div className="grid grid-cols-2 gap-2">
                  {vehicleInfo.subscription.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span>{feature}</span>
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
