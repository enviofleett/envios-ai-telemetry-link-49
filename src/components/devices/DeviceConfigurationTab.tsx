
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface DeviceConfigurationTabProps {
  deviceId: string;
}

const DeviceConfigurationTab: React.FC<DeviceConfigurationTabProps> = ({ deviceId }) => {
  const [config, setConfig] = useState({
    reportingInterval: 30,
    speedAlertThreshold: 80,
    idleAlertTime: 15,
    batteryAlertLevel: 20,
    enableGeofenceAlerts: true,
    enableSpeedMonitoring: false,
    enableBatteryAlerts: true,
    enableMaintenanceReminders: false
  });

  const handleConfigChange = (key: string, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveConfiguration = () => {
    // In real implementation, this would save to API
    console.log('Saving configuration:', config);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Device Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Configuration Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="reporting-interval">Reporting Interval (seconds)</Label>
              <Input
                id="reporting-interval"
                type="number"
                value={config.reportingInterval}
                onChange={(e) => handleConfigChange('reportingInterval', parseInt(e.target.value))}
                min="10"
                max="3600"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="speed-threshold">Speed Alert Threshold (km/h)</Label>
              <Input
                id="speed-threshold"
                type="number"
                value={config.speedAlertThreshold}
                onChange={(e) => handleConfigChange('speedAlertThreshold', parseInt(e.target.value))}
                min="1"
                max="200"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="idle-time">Idle Alert Time (minutes)</Label>
              <Input
                id="idle-time"
                type="number"
                value={config.idleAlertTime}
                onChange={(e) => handleConfigChange('idleAlertTime', parseInt(e.target.value))}
                min="1"
                max="120"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="battery-level">Battery Alert Level (%)</Label>
              <Input
                id="battery-level"
                type="number"
                value={config.batteryAlertLevel}
                onChange={(e) => handleConfigChange('batteryAlertLevel', parseInt(e.target.value))}
                min="5"
                max="50"
              />
            </div>
          </div>

          {/* Toggle Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="geofence-alerts">Enable Geo-fence Alerts</Label>
                <p className="text-sm text-gray-500">Get notified when vehicle enters/exits geofences</p>
              </div>
              <Switch
                id="geofence-alerts"
                checked={config.enableGeofenceAlerts}
                onCheckedChange={(checked) => handleConfigChange('enableGeofenceAlerts', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="speed-monitoring">Enable Speed Monitoring</Label>
                <p className="text-sm text-gray-500">Monitor and alert for speed violations</p>
              </div>
              <Switch
                id="speed-monitoring"
                checked={config.enableSpeedMonitoring}
                onCheckedChange={(checked) => handleConfigChange('enableSpeedMonitoring', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="battery-alerts">Enable Battery Alerts</Label>
                <p className="text-sm text-gray-500">Get notified when battery level is low</p>
              </div>
              <Switch
                id="battery-alerts"
                checked={config.enableBatteryAlerts}
                onCheckedChange={(checked) => handleConfigChange('enableBatteryAlerts', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="maintenance-reminders">Enable Maintenance Reminders</Label>
                <p className="text-sm text-gray-500">Receive scheduled maintenance notifications</p>
              </div>
              <Switch
                id="maintenance-reminders"
                checked={config.enableMaintenanceReminders}
                onCheckedChange={(checked) => handleConfigChange('enableMaintenanceReminders', checked)}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSaveConfiguration}>
              Save Configuration
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeviceConfigurationTab;
