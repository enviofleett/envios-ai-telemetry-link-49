
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Power, 
  Lock, 
  Unlock,
  Settings,
  RefreshCw
} from 'lucide-react';

interface VehicleControlsPanelProps {
  selectedVehicle: any;
  controlStates: any;
  isUpdating: boolean;
  onToggleEngine: (deviceId: string) => void;
  onToggleLock: (deviceId: string) => void;
}

export default function VehicleControlsPanel({ 
  selectedVehicle, 
  controlStates, 
  isUpdating, 
  onToggleEngine, 
  onToggleLock 
}: VehicleControlsPanelProps) {
  if (!selectedVehicle) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Vehicle Controls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Select a vehicle to access controls</p>
        </CardContent>
      </Card>
    );
  }

  const deviceControlState = controlStates?.[selectedVehicle.deviceId] || {
    engineRunning: false,
    doorsLocked: false
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Vehicle Controls
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Engine Control */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Power className="h-4 w-4" />
            <span className="text-sm font-medium">Engine</span>
            <Badge variant={deviceControlState.engineRunning ? "default" : "secondary"}>
              {deviceControlState.engineRunning ? "Running" : "Stopped"}
            </Badge>
          </div>
          <Button
            size="sm"
            variant={deviceControlState.engineRunning ? "destructive" : "default"}
            onClick={() => onToggleEngine(selectedVehicle.deviceId)}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : deviceControlState.engineRunning ? (
              "Stop"
            ) : (
              "Start"
            )}
          </Button>
        </div>

        {/* Door Lock Control */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {deviceControlState.doorsLocked ? (
              <Lock className="h-4 w-4" />
            ) : (
              <Unlock className="h-4 w-4" />
            )}
            <span className="text-sm font-medium">Doors</span>
            <Badge variant={deviceControlState.doorsLocked ? "default" : "secondary"}>
              {deviceControlState.doorsLocked ? "Locked" : "Unlocked"}
            </Badge>
          </div>
          <Button
            size="sm"
            variant={deviceControlState.doorsLocked ? "secondary" : "default"}
            onClick={() => onToggleLock(selectedVehicle.deviceId)}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : deviceControlState.doorsLocked ? (
              "Unlock"
            ) : (
              "Lock"
            )}
          </Button>
        </div>

        {/* Device Information */}
        <div className="border-t pt-3 space-y-2">
          <p className="text-sm font-medium">Device Information</p>
          <div className="text-xs text-muted-foreground space-y-1">
            <div>Device ID: {selectedVehicle.deviceId}</div>
            {selectedVehicle.sim_number && (
              <div>SIM: {selectedVehicle.sim_number}</div>
            )}
            {selectedVehicle.metadata?.envioUserId && (
              <div>Owner: {selectedVehicle.metadata.envioUserId}</div>
            )}
          </div>
        </div>

        {/* Status Information */}
        <div className="border-t pt-3">
          <p className="text-sm font-medium mb-2">Connection Status</p>
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${
              selectedVehicle.isOnline ? 'bg-green-500' : 'bg-red-500'
            }`} />
            <span className="text-xs text-muted-foreground">
              {selectedVehicle.isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
