
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DeviceConfigurationTab from '@/components/devices/DeviceConfigurationTab';
import { useUnifiedVehicleData } from '@/hooks/useUnifiedVehicleData';

const DeviceConfiguration: React.FC = () => {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const { vehicles } = useUnifiedVehicleData();

  if (!selectedDeviceId) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Device Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="device-select" className="text-sm font-medium">
                Select a device to configure:
              </label>
              <Select onValueChange={setSelectedDeviceId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a device..." />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.device_id} value={vehicle.device_id}>
                      {vehicle.device_name} ({vehicle.device_id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {vehicles.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No devices available for configuration.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Device Configuration</h1>
        <Button 
          variant="outline" 
          onClick={() => setSelectedDeviceId('')}
        >
          Change Device
        </Button>
      </div>
      <DeviceConfigurationTab deviceId={selectedDeviceId} />
    </div>
  );
};

export default DeviceConfiguration;
