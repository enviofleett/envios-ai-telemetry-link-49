
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Clock, Car, Navigation, AlertCircle, Settings, History } from 'lucide-react';
import type { VehicleData } from '@/types/vehicle';

interface UserVehicleDetailsModalProps {
  vehicle: VehicleData;
  isOpen: boolean;
  onClose: () => void;
}

const UserVehicleDetailsModal: React.FC<UserVehicleDetailsModalProps> = ({
  vehicle,
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'offline': return 'bg-red-500';
      case 'idle': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Car className="h-5 w-5" />
            {vehicle.device_name}
            <div className={`w-3 h-3 rounded-full ${getStatusColor(vehicle.status)}`} />
          </DialogTitle>
          <DialogDescription>
            Device ID: {vehicle.device_id} • SIM: {vehicle.sim_number || 'Not available'}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="location">Location</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-4">
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Vehicle Status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Vehicle Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant={vehicle.status === 'online' ? 'default' : 'secondary'}>
                        {vehicle.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Online:</span>
                      <span>{vehicle.isOnline ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Moving:</span>
                      <span>{vehicle.isMoving ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Active:</span>
                      <span>{vehicle.is_active ? 'Yes' : 'No'}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Vehicle Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Car className="h-5 w-5" />
                      Vehicle Info
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Device ID:</span>
                      <span className="font-mono text-sm">{vehicle.device_id}</span>
                    </div>
                    {vehicle.sim_number && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">SIM Number:</span>
                        <span className="font-mono text-sm">{vehicle.sim_number}</span>
                      </div>
                    )}
                    {vehicle.license_plate && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">License Plate:</span>
                        <span>{vehicle.license_plate}</span>
                      </div>
                    )}
                    {vehicle.vin && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">VIN:</span>
                        <span className="font-mono text-xs">{vehicle.vin}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Timestamps */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Timestamps
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Created:</span>
                      <span className="text-sm">{formatDate(vehicle.created_at)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Last Updated:</span>
                      <span className="text-sm">{formatDate(vehicle.updated_at)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Last Activity:</span>
                      <span className="text-sm">{vehicle.lastUpdate.toLocaleString()}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Alerts */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <AlertCircle className="h-5 w-5" />
                      Alerts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {vehicle.alerts && vehicle.alerts.length > 0 ? (
                      <div className="space-y-2">
                        {vehicle.alerts.map((alert, index) => (
                          <div key={index} className="p-2 border rounded-md">
                            <p className="text-sm">{alert}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">No active alerts</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="location" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Current Location
                  </CardTitle>
                  <CardDescription>
                    Last known position and location data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {vehicle.last_position ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-muted-foreground text-sm">Latitude:</span>
                          <p className="font-mono">{vehicle.last_position.latitude}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-sm">Longitude:</span>
                          <p className="font-mono">{vehicle.last_position.longitude}</p>
                        </div>
                      </div>
                      {vehicle.last_position.speed !== undefined && (
                        <div>
                          <span className="text-muted-foreground text-sm">Speed:</span>
                          <p>{vehicle.last_position.speed} km/h</p>
                        </div>
                      )}
                      {vehicle.last_position.course !== undefined && (
                        <div>
                          <span className="text-muted-foreground text-sm">Course:</span>
                          <p>{vehicle.last_position.course}°</p>
                        </div>
                      )}
                      <Button 
                        onClick={() => window.open(`https://www.google.com/maps?q=${vehicle.last_position!.latitude},${vehicle.last_position!.longitude}`, '_blank')}
                        className="w-full"
                      >
                        <Navigation className="h-4 w-4 mr-2" />
                        View on Google Maps
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No location data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Vehicle History
                  </CardTitle>
                  <CardDescription>
                    Recent activity and events for this vehicle
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border-l-2 border-muted pl-4">
                      <div className="text-sm text-muted-foreground">
                        {formatDate(vehicle.updated_at)}
                      </div>
                      <p className="font-medium">Vehicle data last updated</p>
                    </div>
                    <div className="border-l-2 border-muted pl-4">
                      <div className="text-sm text-muted-foreground">
                        {formatDate(vehicle.created_at)}
                      </div>
                      <p className="font-medium">Vehicle added to system</p>
                    </div>
                    {vehicle.envio_users && (
                      <div className="border-l-2 border-primary pl-4">
                        <div className="text-sm text-muted-foreground">Current assignment</div>
                        <p className="font-medium">
                          Assigned to {vehicle.envio_users.name || vehicle.envio_users.email}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={() => window.location.href = `/tracking?vehicle=${vehicle.device_id}`}>
            <Navigation className="h-4 w-4 mr-2" />
            Track Vehicle
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserVehicleDetailsModal;
