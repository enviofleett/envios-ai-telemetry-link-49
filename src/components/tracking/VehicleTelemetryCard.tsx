
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Navigation, 
  Gauge, 
  MapPin, 
  Clock, 
  Fuel,
  Activity,
  AlertTriangle
} from 'lucide-react';

interface VehicleTelemetryCardProps {
  selectedVehicle: any;
  controlStates: any;
}

export default function VehicleTelemetryCard({ selectedVehicle, controlStates }: VehicleTelemetryCardProps) {
  if (!selectedVehicle) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Vehicle Telemetry
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Select a vehicle to view telemetry data</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'online': { variant: 'default', color: 'bg-green-100 text-green-800' },
      'moving': { variant: 'default', color: 'bg-blue-100 text-blue-800' },
      'idle': { variant: 'secondary', color: 'bg-yellow-100 text-yellow-800' },
      'offline': { variant: 'destructive', color: 'bg-red-100 text-red-800' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.offline;
    
    return (
      <Badge className={config.color}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const position = selectedVehicle.lastPosition || selectedVehicle.last_position;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            {selectedVehicle.deviceName || selectedVehicle.device_name || `Device ${selectedVehicle.deviceId}`}
          </div>
          {getStatusBadge(selectedVehicle.status || 'offline')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Location Information */}
        {position && (
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium">Location</p>
                <p className="text-xs text-muted-foreground">
                  {position.lat?.toFixed(6)}, {position.lon?.toFixed(6)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium">Speed</p>
                <p className="text-xs text-muted-foreground">
                  {position.speed || 0} km/h
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Navigation className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium">Heading</p>
                <p className="text-xs text-muted-foreground">
                  {position.course || 0}°
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium">Last Update</p>
                <p className="text-xs text-muted-foreground">
                  {formatTimestamp(position.updatetime)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Extended Telemetry */}
        {selectedVehicle.fuel_level && (
          <div className="flex items-center gap-2">
            <Fuel className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-sm font-medium">Fuel Level</p>
              <p className="text-xs text-muted-foreground">
                {selectedVehicle.fuel_level}%
              </p>
            </div>
          </div>
        )}

        {/* Alarms */}
        {selectedVehicle.alarm_status && (
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <div>
              <p className="text-sm font-medium text-red-600">Active Alarm</p>
              <p className="text-xs text-muted-foreground">
                {selectedVehicle.alarm_status}
              </p>
            </div>
          </div>
        )}

        {/* Control States */}
        {controlStates && controlStates[selectedVehicle.deviceId] && (
          <div className="border-t pt-3">
            <p className="text-sm font-medium mb-2">Vehicle Controls</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-xs">
                Engine: {controlStates[selectedVehicle.deviceId].engineRunning ? 'Running' : 'Stopped'}
              </div>
              <div className="text-xs">
                Doors: {controlStates[selectedVehicle.deviceId].doorsLocked ? 'Locked' : 'Unlocked'}
              </div>
            </div>
          </div>
        )}

        {!position && (
          <div className="text-center py-4">
            <p className="text-muted-foreground text-sm">No telemetry data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
