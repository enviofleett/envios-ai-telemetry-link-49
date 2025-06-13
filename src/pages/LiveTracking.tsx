
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import VehicleTrackingMap from '@/components/VehicleTrackingMap';
import { useStableVehicleData } from '@/hooks/useStableVehicleData';

const LiveTracking: React.FC = () => {
  const { vehicles, metrics, isLoading, error } = useStableVehicleData();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error loading tracking data: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Live Tracking</h1>
          <p className="text-gray-600 mt-1">
            Real-time vehicle location and status monitoring
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {metrics.total} vehicles
          </Badge>
          <Badge variant="outline" className="bg-green-50 text-green-700">
            {metrics.online} online
          </Badge>
        </div>
      </div>

      {/* Map */}
      <Card>
        <CardHeader>
          <CardTitle>Live Vehicle Positions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[600px] w-full">
            <VehicleTrackingMap vehicles={vehicles} />
          </div>
        </CardContent>
      </Card>

      {/* Vehicle Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{metrics.total}</div>
            <div className="text-sm text-gray-600">Total Vehicles</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{metrics.online}</div>
            <div className="text-sm text-gray-600">Online</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-600">{metrics.offline}</div>
            <div className="text-sm text-gray-600">Offline</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{metrics.alerts}</div>
            <div className="text-sm text-gray-600">Alerts</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LiveTracking;
