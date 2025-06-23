
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Wifi, Battery, Calendar } from 'lucide-react';
import DeviceStatusBadge from './DeviceStatusBadge';
import BatteryIndicator from './BatteryIndicator';
import SignalIndicator from './SignalIndicator';

interface DeviceOverviewTabProps {
  deviceId: string;
}

const DeviceOverviewTab: React.FC<DeviceOverviewTabProps> = ({ deviceId }) => {
  // Mock data - in real implementation, this would come from API
  const deviceInfo = {
    deviceId: deviceId,
    vehicleId: `VH-${deviceId.split('-')[1]}`,
    deviceType: 'GPS Tracker',
    model: 'GT06N',
    imei: '860123456789012',
    firmware: 'v2.1.3',
    status: 'online' as const,
    lastUpdate: '2 mins ago',
    batteryLevel: 85,
    signalStrength: 4,
    currentLocation: 'Downtown Area',
    installationDate: '2024-01-15',
    technician: 'John Smith',
    installationNotes: 'Installed under dashboard, power connected to OBD port'
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Device Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Device Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <span className="text-gray-600">Device ID</span>
              <span className="font-medium">{deviceInfo.deviceId}</span>
              
              <span className="text-gray-600">Vehicle ID</span>
              <span className="font-medium">{deviceInfo.vehicleId}</span>
              
              <span className="text-gray-600">Device Type</span>
              <span className="font-medium">{deviceInfo.deviceType}</span>
              
              <span className="text-gray-600">Model</span>
              <span className="font-medium">{deviceInfo.model}</span>
              
              <span className="text-gray-600">IMEI</span>
              <span className="font-mono font-medium">{deviceInfo.imei}</span>
              
              <span className="text-gray-600">Firmware</span>
              <span className="font-medium">{deviceInfo.firmware}</span>
            </div>
          </CardContent>
        </Card>

        {/* Current Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Current Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <span className="text-gray-600">Status</span>
              <DeviceStatusBadge status={deviceInfo.status} />
              
              <span className="text-gray-600">Last Update</span>
              <span className="font-medium">{deviceInfo.lastUpdate}</span>
              
              <span className="text-gray-600">Battery Level</span>
              <BatteryIndicator level={deviceInfo.batteryLevel} />
              
              <span className="text-gray-600">Signal Strength</span>
              <SignalIndicator strength={deviceInfo.signalStrength} />
              
              <span className="text-gray-600">Current Location</span>
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3 text-gray-500" />
                <span className="font-medium">{deviceInfo.currentLocation}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Installation Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Installation Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Installation Date</span>
              <div className="font-medium mt-1">{deviceInfo.installationDate}</div>
            </div>
            <div>
              <span className="text-gray-600">Technician</span>
              <div className="font-medium mt-1">{deviceInfo.technician}</div>
            </div>
            <div className="md:col-span-2">
              <span className="text-gray-600">Installation Notes</span>
              <div className="font-medium mt-1">{deviceInfo.installationNotes}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeviceOverviewTab;
