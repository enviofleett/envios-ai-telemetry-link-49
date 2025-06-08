
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Car, Edit, Settings, FileText, Upload, BarChart3, Tag, MapPin, Clock } from 'lucide-react';
import type { EnhancedVehicle } from './EnhancedVehicleManagementPage';

interface EnhancedVehicleDetailsModalProps {
  vehicle: EnhancedVehicle | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EnhancedVehicleDetailsModal: React.FC<EnhancedVehicleDetailsModalProps> = ({
  vehicle,
  isOpen,
  onClose,
}) => {
  if (!vehicle) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "online":
        return <Badge className="bg-green-100 text-green-800">Online</Badge>;
      case "maintenance":
        return <Badge variant="destructive">Maintenance</Badge>;
      case "offline":
        return <Badge variant="secondary">Offline</Badge>;
      case "inactive":
        return <Badge variant="outline">Inactive</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const formatLastUpdate = (updatetime?: string) => {
    if (!updatetime) return 'No data';
    const date = new Date(updatetime);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const getLocationString = () => {
    if (!vehicle.lastPosition) return 'Location unknown';
    const { latitude, longitude } = vehicle.lastPosition;
    return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Vehicle Details - {vehicle.deviceid}
          </DialogTitle>
          <DialogDescription>
            Real-time vehicle information and GPS tracking data
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="location">Location</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Device Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Device ID:</span>
                    <span className="font-mono">{vehicle.deviceid}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Device Name:</span>
                    <span>{vehicle.devicename}</span>
                  </div>
                  {vehicle.plateNumber && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Plate Number:</span>
                      <span className="font-medium">{vehicle.plateNumber}</span>
                    </div>
                  )}
                  {vehicle.make && vehicle.model && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Make & Model:</span>
                      <span className="font-medium">
                        {vehicle.make} {vehicle.model}
                      </span>
                    </div>
                  )}
                  {vehicle.year && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Year:</span>
                      <span className="font-medium">{vehicle.year}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    {getStatusBadge(vehicle.status)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Operational Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Assigned To:</span>
                    <span className="font-medium">{vehicle.assignedTo || 'Unassigned'}</span>
                  </div>
                  {vehicle.fuelType && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fuel Type:</span>
                      <span className="font-medium">{vehicle.fuelType}</span>
                    </div>
                  )}
                  {vehicle.fuelLevel !== undefined && (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Fuel Level:</span>
                        <span className="font-medium">{vehicle.fuelLevel}%</span>
                      </div>
                      <Progress value={vehicle.fuelLevel} className="h-2" />
                    </div>
                  )}
                  {vehicle.odometer && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Odometer:</span>
                      <span className="font-medium">{vehicle.odometer.toLocaleString()} km</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Update:</span>
                    <span className="text-sm">
                      {formatLastUpdate(vehicle.lastPosition?.updatetime)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {vehicle.tags && vehicle.tags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1">
                    {vehicle.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="location" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Current Location
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {vehicle.lastPosition ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Coordinates:</span>
                        <span className="font-mono text-sm">{getLocationString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Speed:</span>
                        <span className="font-medium">{vehicle.lastPosition.speed || 0} km/h</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Course:</span>
                        <span className="font-medium">{vehicle.lastPosition.course || 0}°</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Last Update:</span>
                        <span className="text-sm">
                          {formatLastUpdate(vehicle.lastPosition.updatetime)}
                        </span>
                      </div>
                    </div>
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground">
                        Map integration available with GPS coordinates
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg font-medium">No Location Data</p>
                    <p className="text-sm text-muted-foreground">GPS position not available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="maintenance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Maintenance Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {vehicle.lastService && (
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">Last Service</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(vehicle.lastService).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline">Completed</Badge>
                    </div>
                  )}
                  {vehicle.nextService && (
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-amber-500" />
                        <div>
                          <div className="font-medium">Next Service</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(vehicle.nextService).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                        Scheduled
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Vehicle Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {vehicle.registrationExpiry && (
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span>Registration</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {new Date(vehicle.registrationExpiry).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-muted-foreground">Expires</div>
                      </div>
                    </div>
                  )}
                  {vehicle.insuranceExpiry && (
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span>Insurance</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {new Date(vehicle.insuranceExpiry).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-muted-foreground">Expires</div>
                      </div>
                    </div>
                  )}
                  <div className="text-center py-4">
                    <Button variant="outline">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Documents
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Edit Vehicle
          </Button>
          <Button>
            <Settings className="h-4 w-4 mr-2" />
            Manage
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
