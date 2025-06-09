
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Gauge, Power, Clock, Fuel, Thermometer, Lock, AlertTriangle } from 'lucide-react';

interface VehicleTelemetryCardProps {
  selectedVehicle: any;
  controlStates: {
    engineState: Record<string, boolean>;
    lockState: Record<string, boolean>;
  };
}

const VehicleTelemetryCard: React.FC<VehicleTelemetryCardProps> = ({
  selectedVehicle,
  controlStates
}) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'offline':
        return <Badge className="bg-blue-100 text-blue-800">Idle</Badge>;
      case 'maintenance':
        return <Badge variant="destructive">Maintenance</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Warning</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getIgnitionStatus = (deviceId: string) => {
    const isOn = controlStates.engineState[deviceId];
    return isOn ? (
      <div className="flex items-center">
        <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>On
      </div>
    ) : (
      <div className="flex items-center">
        <div className="h-2 w-2 rounded-full bg-gray-400 mr-2"></div>Off
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Vehicle Telemetry - GP51 Protocol</CardTitle>
            <CardDescription>Real-time data for selected vehicle</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={selectedVehicle.alerts > 0 ? "destructive" : "outline"}>
              {selectedVehicle.alerts || 0} {selectedVehicle.alerts === 1 ? "Alert" : "Alerts"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Vehicle Info */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{selectedVehicle.deviceid}</h3>
              {getStatusBadge(selectedVehicle.status)}
            </div>

            <div className="text-sm">{selectedVehicle.devicename}</div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm">Location</span>
                </div>
                <span className="text-sm font-medium">
                  {selectedVehicle.lastPosition ? 
                    `${selectedVehicle.lastPosition.lat?.toFixed(4)}, ${selectedVehicle.lastPosition.lon?.toFixed(4)}` : 
                    'No location data'
                  }
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Gauge className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm">Speed</span>
                </div>
                <span className="text-sm font-medium">
                  {selectedVehicle.lastPosition?.speed || 0} km/h
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Power className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm">Ignition</span>
                </div>
                <span className="text-sm font-medium">
                  {getIgnitionStatus(selectedVehicle.deviceid)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Fuel className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm">Fuel Level</span>
                </div>
                <span className="text-sm font-medium">N/A%</span>
              </div>
            </div>
          </div>

          {/* Additional Telemetry */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">GP51 Telemetry</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Thermometer className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm">Temperature</span>
                </div>
                <span className="text-sm font-medium">N/A°C</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm">Last Update</span>
                </div>
                <span className="text-sm font-medium">
                  {selectedVehicle.lastPosition?.updatetime ? 
                    new Date(selectedVehicle.lastPosition.updatetime).toLocaleString() : 
                    'No data'
                  }
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Lock className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm">Door Status</span>
                </div>
                <span className="text-sm font-medium">
                  {controlStates.lockState[selectedVehicle.deviceid] ? "Locked" : "Unlocked"}
                </span>
              </div>

              {selectedVehicle.alerts > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
                    <span className="text-sm">Alerts</span>
                  </div>
                  <Badge variant="destructive">{selectedVehicle.alerts}</Badge>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VehicleTelemetryCard;
