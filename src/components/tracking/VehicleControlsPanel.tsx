
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Power, Lock, Navigation, BellOff } from 'lucide-react';

interface VehicleControlsPanelProps {
  selectedVehicle: any;
  controlStates: {
    engineState: Record<string, boolean>;
    lockState: Record<string, boolean>;
  };
  isUpdating: boolean;
  onToggleEngine: (deviceId: string) => void;
  onToggleLock: (deviceId: string) => void;
}

const VehicleControlsPanel: React.FC<VehicleControlsPanelProps> = ({
  selectedVehicle,
  controlStates,
  isUpdating,
  onToggleEngine,
  onToggleLock
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Remote Controls</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Power className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-sm">Engine Control</span>
              </div>
              <Switch
                checked={controlStates.engineState[selectedVehicle.deviceid] || false}
                onCheckedChange={() => onToggleEngine(selectedVehicle.deviceid)}
                disabled={isUpdating}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {controlStates.engineState[selectedVehicle.deviceid]
                ? "Engine is running. Toggle to shut down."
                : "Engine is off. Toggle to start remotely."}
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Lock className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-sm">Door Control</span>
              </div>
              <Switch
                checked={controlStates.lockState[selectedVehicle.deviceid] || false}
                onCheckedChange={() => onToggleLock(selectedVehicle.deviceid)}
                disabled={isUpdating}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {controlStates.lockState[selectedVehicle.deviceid]
                ? "Doors are locked. Toggle to unlock."
                : "Doors are unlocked. Toggle to lock."}
            </p>
          </div>

          <div className="pt-4 space-y-2">
            <Button className="w-full" variant="outline">
              <Navigation className="h-4 w-4 mr-2" />
              Navigate to Vehicle
            </Button>

            <Button className="w-full" variant="outline" disabled={!selectedVehicle.alerts}>
              <BellOff className="h-4 w-4 mr-2" />
              Clear Alerts
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VehicleControlsPanel;
