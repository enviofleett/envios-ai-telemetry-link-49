
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Square, RefreshCw, MapPin, Car, Activity, Clock } from 'lucide-react';
import { useGPS51LiveData } from '@/hooks/useGPS51LiveData';
import { useGPS51Auth } from '@/hooks/useGPS51Auth';

const GPS51LiveTrackingEnhanced: React.FC = () => {
  const { isAuthenticated, connectionStatus, username } = useGPS51Auth();
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  
  const { 
    positions,
    devices,
    metrics,
    isConnected,
    isLoading,
    error,
    isLiveTracking,
    startLiveTracking,
    stopLiveTracking,
    refreshData,
    getDevicePosition
  } = useGPS51LiveData({ 
    enabled: isAuthenticated 
  });

  const handleStartTracking = async () => {
    if (selectedDevice) {
      await startLiveTracking([selectedDevice]);
    } else {
      await startLiveTracking();
    }
  };

  const handleStopTracking = () => {
    stopLiveTracking();
  };

  const handleRefresh = async () => {
    await refreshData();
  };

  const handleDeviceSelect = (deviceId: string) => {
    setSelectedDevice(deviceId === selectedDevice ? null : deviceId);
  };

  if (!isAuthenticated) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>GPS51 Live Tracking</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Please authenticate with GPS51 to access live tracking.
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
          <h1 className="text-3xl font-bold">GPS51 Live Tracking</h1>
          <p className="text-muted-foreground">
            Real-time vehicle tracking and monitoring
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRefresh} disabled={isLoading} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {!isLiveTracking ? (
            <Button onClick={handleStartTracking} disabled={isLoading}>
              <Play className="h-4 w-4 mr-2" />
              Start Tracking
            </Button>
          ) : (
            <Button onClick={handleStopTracking} variant="destructive">
              <Square className="h-4 w-4 mr-2" />
              Stop Tracking
            </Button>
          )}
        </div>
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
            <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalDevices}</div>
            <p className="text-xs text-muted-foreground">Fleet size</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Tracking Status</span>
              <Badge variant={isLiveTracking ? "default" : "secondary"}>
                {isLiveTracking ? "Active" : "Inactive"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Connection Status:</span>
                <Badge variant={isConnected ? "default" : "destructive"}>
                  {isConnected ? "Connected" : "Disconnected"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Offline Vehicles:</span>
                <span className="font-semibold">{metrics.offlineVehicles}</span>
              </div>
              <div className="flex justify-between">
                <span>Selected Device:</span>
                <span className="text-sm">{selectedDevice || "All devices"}</span>
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
            <CardTitle>Device Selection</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              <Button
                variant={selectedDevice === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedDevice(null)}
                className="w-full justify-start"
              >
                All Devices ({devices.length})
              </Button>
              {devices.map((device) => (
                <Button
                  key={device.deviceid}
                  variant={selectedDevice === device.deviceid ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleDeviceSelect(device.deviceid)}
                  className="w-full justify-start"
                >
                  <div className="flex items-center justify-between w-full">
                    <span>{device.devicename}</span>
                    <Badge variant="outline" className="text-xs">
                      {device.groupname}
                    </Badge>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Live Positions ({positions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {positions.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-muted-foreground">No position data available</p>
              <p className="text-sm text-muted-foreground">
                {isLiveTracking ? "Waiting for updates..." : "Start tracking to see live positions"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {positions.map((position) => (
                <div key={position.deviceid} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{position.devicename}</h3>
                    <div className="flex gap-2">
                      <Badge variant={position.moving ? "default" : "secondary"}>
                        {position.moving ? "Moving" : "Stopped"}
                      </Badge>
                      <Badge variant="outline">
                        {position.speed} km/h
                      </Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Lat:</span> {position.callat.toFixed(6)}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Lon:</span> {position.callon.toFixed(6)}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Course:</span> {position.course}°
                    </div>
                    <div>
                      <span className="text-muted-foreground">Updated:</span>{' '}
                      {new Date(position.updatetime * 1000).toLocaleTimeString()}
                    </div>
                  </div>
                  {position.address && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      <span className="font-medium">Address:</span> {position.address}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GPS51LiveTrackingEnhanced;
