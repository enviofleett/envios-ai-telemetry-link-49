
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Activity, Clock, Zap } from 'lucide-react';
import { gps51TrackingService } from '@/services/gps51/GPS51TrackingService';

const FleetManagementPage: React.FC = () => {
  const { data: deviceList, isLoading: devicesLoading } = useQuery({
    queryKey: ['gps51-devices'],
    queryFn: () => gps51TrackingService.queryDeviceList(),
    refetchInterval: 30000,
  });

  const { data: positions, isLoading: positionsLoading } = useQuery({
    queryKey: ['gps51-positions'],
    queryFn: () => gps51TrackingService.getLastPositions(),
    refetchInterval: 15000,
  });

  const devices = deviceList?.devices || [];
  const devicePositions = positions?.devices || [];

  // Calculate fleet statistics
  const totalDevices = devices.length;
  const onlineDevices = devices.filter(d => d.status === 'online').length;
  const movingDevices = devicePositions.filter(d => d.speed > 0).length;
  const totalDistance = devicePositions.reduce((sum, d) => sum + (d.speed * 0.1), 0); // Rough estimate

  if (devicesLoading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading fleet data...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Fleet Management Dashboard</h1>
        <Badge variant="outline" className="px-3 py-1">
          Live Data
        </Badge>
      </div>

      {/* Fleet Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDevices}</div>
            <p className="text-xs text-muted-foreground">
              Fleet size
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{onlineDevices}</div>
            <p className="text-xs text-muted-foreground">
              Active vehicles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Moving</CardTitle>
            <Zap className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{movingDevices}</div>
            <p className="text-xs text-muted-foreground">
              In transit
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Distance Today</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDistance.toFixed(1)} km</div>
            <p className="text-xs text-muted-foreground">
              Estimated total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Device Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Status Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {devices.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No devices found. Please check your GPS51 connection.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {devices.map((device) => {
                  const position = devicePositions.find(p => p.deviceid === device.deviceid);
                  return (
                    <Card key={device.deviceid} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold truncate">{device.devicename}</h3>
                        <Badge 
                          variant={device.status === 'online' ? 'default' : 'secondary'}
                          className={device.status === 'online' ? 'bg-green-100 text-green-800' : ''}
                        >
                          {device.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>ID: {device.deviceid}</div>
                        <div>SIM: {device.simnum}</div>
                        {position && (
                          <>
                            <div>Speed: {position.speed} km/h</div>
                            <div>Last Update: {new Date(position.updatetime * 1000).toLocaleString()}</div>
                          </>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FleetManagementPage;
