
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Vehicle } from '@/services/unifiedVehicleData';

interface VehicleOverviewTabProps {
  vehicle: Vehicle;
  status: string;
}

export const VehicleOverviewTab: React.FC<VehicleOverviewTabProps> = ({ vehicle, status }) => {
  const formatLastUpdate = (updatetime: string) => {
    const date = new Date(updatetime);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
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
          {vehicle.envio_user_id && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">User ID:</span>
              <span className="font-mono text-xs">{vehicle.envio_user_id}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status:</span>
            <span>{vehicle.is_active ? 'Active' : 'Inactive'}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Current Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Connection:</span>
            <span className={`font-medium ${status === 'online' ? 'text-green-600' : 'text-gray-600'}`}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          </div>
          {vehicle.lastPosition && (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Speed:</span>
                <span className="font-medium">{vehicle.lastPosition.speed} km/h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Course:</span>
                <span className="font-medium">{vehicle.lastPosition.course}°</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Update:</span>
                <span className="text-sm">
                  {formatLastUpdate(vehicle.lastPosition.updatetime)}
                </span>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
