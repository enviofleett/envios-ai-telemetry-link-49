
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Car, MapPin, Activity, Clock } from 'lucide-react';
import { useGPS51LiveData } from '@/hooks/useGPS51LiveData';
import { useGPS51Auth } from '@/hooks/useGPS51Auth';

const GPS51Dashboard: React.FC = () => {
  const { isAuthenticated, connectionStatus, username } = useGPS51Auth();
  const { 
    metrics, 
    devices, 
    isConnected, 
    isLoading, 
    error,
    refreshData
  } = useGPS51LiveData({ 
    enabled: isAuthenticated 
  });

  const handleRefresh = async () => {
    await refreshData();
  };

  if (!isAuthenticated) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>GPS51 Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Please authenticate with GPS51 to view dashboard data.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">GPS51 Dashboard</h1>
          <p className="text-muted-foreground">
            Connected as: {username} | Status: {connectionStatus}
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">{error}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalDevices}</div>
            <p className="text-xs text-muted-foreground">Fleet size</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Devices</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.activeDevices}</div>
            <p className="text-xs text-muted-foreground">Currently online</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Moving</CardTitle>
            <MapPin className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{metrics.movingVehicles}</div>
            <p className="text-xs text-muted-foreground">In transit</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Parked</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{metrics.parkedDevices}</div>
            <p className="text-xs text-muted-foreground">Stationary</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Connection Status</span>
            <Badge variant={isConnected ? "default" : "destructive"}>
              {isConnected ? "Connected" : "Disconnected"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Offline Vehicles:</span>
              <span className="font-semibold">{metrics.offlineVehicles}</span>
            </div>
            <div className="flex justify-between">
              <span>Last Update:</span>
              <span className="text-sm text-muted-foreground">
                {metrics.lastUpdate.toLocaleTimeString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Device List ({devices.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {devices.length === 0 ? (
            <p className="text-muted-foreground">No devices found</p>
          ) : (
            <div className="space-y-2">
              {devices.slice(0, 5).map((device) => (
                <div key={device.deviceid} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <div className="font-medium">{device.devicename}</div>
                    <div className="text-sm text-muted-foreground">ID: {device.deviceid}</div>
                  </div>
                  <Badge variant="outline">{device.groupname}</Badge>
                </div>
              ))}
              {devices.length > 5 && (
                <p className="text-sm text-muted-foreground">
                  ... and {devices.length - 5} more devices
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GPS51Dashboard;
