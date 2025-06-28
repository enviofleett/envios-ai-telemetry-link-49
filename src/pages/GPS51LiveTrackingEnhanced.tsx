
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useGPS51LiveData } from '@/hooks/useGPS51LiveData';
import { Car, MapPin, Activity, Clock, Play, Pause, RefreshCw, Zap } from 'lucide-react';
import MapTilerMap from '@/components/map/MapTilerMap';

const GPS51LiveTrackingEnhanced: React.FC = () => {
  const { toast } = useToast();
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);

  const {
    devices,
    positions,
    metrics,
    isLoading,
    error,
    isLiveTracking,
    startLiveTracking,
    stopLiveTracking,
    refreshData,
    getDevicePosition,
    isDeviceOnline
  } = useGPS51LiveData({
    refreshInterval: 30000,
    enabled: true,
    autoStart: true
  });

  useEffect(() => {
    if (error) {
      toast({
        title: "GPS51 Data Error",
        description: error instanceof Error ? error.message : "Failed to fetch live data",
        variant: "destructive"
      });
    }
  }, [error, toast]);

  const formatLastUpdate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const getStatusColor = (position: any, device: any) => {
    if (!position) return 'bg-gray-500';
    
    const now = Date.now() / 1000;
    const fiveMinutesAgo = now - 300;
    
    if (position.updatetime < fiveMinutesAgo) return 'bg-gray-500'; // Offline
    if (position.moving === 1 || position.speed > 0) return 'bg-green-500'; // Moving
    return 'bg-blue-500'; // Parked/Online
  };

  const getStatusText = (position: any, device: any) => {
    if (!position) return 'No Data';
    
    const now = Date.now() / 1000;
    const fiveMinutesAgo = now - 300;
    
    if (position.updatetime < fiveMinutesAgo) return 'Offline';
    if (position.moving === 1 || position.speed > 0) return 'Moving';
    return 'Parked';
  };

  // Prepare vehicle data for map
  const vehiclesForMap = devices.map(device => {
    const position = getDevicePosition(device.deviceid);
    return {
      device_id: device.deviceid,
      device_name: device.devicename,
      last_position: position ? {
        latitude: position.lat,
        longitude: position.lon
      } : undefined,
      status: getStatusText(position, device)
    };
  }).filter(vehicle => vehicle.last_position);

  const selectedVehicle = selectedDeviceId ? 
    vehiclesForMap.find(v => v.device_id === selectedDeviceId) : null;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Live GPS51 Tracking</h1>
          <p className="text-gray-400">Real-time vehicle monitoring and fleet management</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={`${isLiveTracking ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
            <div className={`h-2 w-2 rounded-full mr-2 ${isLiveTracking ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></div>
            {isLiveTracking ? 'Live' : 'Paused'}
          </Badge>
          <Button
            onClick={isLiveTracking ? stopLiveTracking : startLiveTracking}
            variant="outline"
            size="sm"
          >
            {isLiveTracking ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
            {isLiveTracking ? 'Pause' : 'Start'} Live Tracking
          </Button>
          <Button onClick={refreshData} variant="outline" size="sm" disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Total Fleet</CardTitle>
              <Car className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-100">{metrics.totalDevices}</div>
              <p className="text-xs text-gray-400">Registered vehicles</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Active</CardTitle>
              <Activity className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">{metrics.activeDevices}</div>
              <p className="text-xs text-gray-400">Online now</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Moving</CardTitle>
              <Zap className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-400">{metrics.movingDevices}</div>
              <p className="text-xs text-gray-400">In motion</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Parked</CardTitle>
              <MapPin className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-400">{metrics.parkedDevices}</div>
              <p className="text-xs text-gray-400">Stationary</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Offline</CardTitle>
              <Clock className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-400">{metrics.offlineDevices}</div>
              <p className="text-xs text-gray-400">Not responding</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vehicle List */}
        <div className="lg:col-span-1">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-100">Fleet Vehicles ({devices.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-96 overflow-y-auto">
              {devices.map(device => {
                const position = getDevicePosition(device.deviceid);
                const isSelected = selectedDeviceId === device.deviceid;
                
                return (
                  <div
                    key={device.deviceid}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      isSelected 
                        ? 'bg-blue-900 border-blue-600' 
                        : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                    }`}
                    onClick={() => setSelectedDeviceId(device.deviceid)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-100">{device.devicename}</h4>
                        <p className="text-sm text-gray-400">{device.deviceid}</p>
                      </div>
                      <div className="text-right">
                        <Badge className={`${getStatusColor(position, device)} text-white`}>
                          {getStatusText(position, device)}
                        </Badge>
                        {position && (
                          <p className="text-xs text-gray-400 mt-1">
                            {position.speed} km/h
                          </p>
                        )}
                      </div>
                    </div>
                    {position && (
                      <div className="mt-2 text-xs text-gray-400">
                        Last update: {formatLastUpdate(position.updatetime)}
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Live Map */}
        <div className="lg:col-span-2">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-100">Live Fleet Map</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-96">
                {vehiclesForMap.length > 0 ? (
                  <MapTilerMap
                    vehicles={vehiclesForMap}
                    selectedVehicle={selectedVehicle}
                    onVehicleSelect={(vehicle) => setSelectedDeviceId(vehicle.device_id)}
                    autoFitBounds={true}
                    height="384px"
                    className="w-full h-full rounded-b-lg"
                  />
                ) : (
                  <div className="h-full flex items-center justify-center bg-gray-900 rounded-b-lg">
                    <div className="text-center">
                      <MapPin className="h-16 w-16 mx-auto text-gray-600 mb-4" />
                      <h3 className="text-lg font-semibold text-gray-400 mb-2">No Vehicle Data</h3>
                      <p className="text-gray-500">
                        {isLoading ? 'Loading vehicle positions...' : 'No vehicles with GPS data found'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Selected Vehicle Details */}
      {selectedDeviceId && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-100">Vehicle Details</CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const device = devices.find(d => d.deviceid === selectedDeviceId);
              const position = getDevicePosition(selectedDeviceId);
              
              if (!device) return <p className="text-gray-400">Device not found</p>;
              
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-300">Device Info</h4>
                    <p className="text-lg font-semibold text-gray-100">{device.devicename}</p>
                    <p className="text-sm text-gray-400">ID: {device.deviceid}</p>
                    <p className="text-sm text-gray-400">SIM: {device.simnum}</p>
                  </div>
                  
                  {position && (
                    <>
                      <div>
                        <h4 className="font-medium text-gray-300">Location</h4>
                        <p className="text-sm text-gray-100">{position.lat.toFixed(6)}, {position.lon.toFixed(6)}</p>
                        {position.address && (
                          <p className="text-sm text-gray-400">{position.address}</p>
                        )}
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-300">Speed & Direction</h4>
                        <p className="text-lg font-semibold text-gray-100">{position.speed} km/h</p>
                        <p className="text-sm text-gray-400">Course: {position.course}°</p>
                        {position.altitude && (
                          <p className="text-sm text-gray-400">Alt: {position.altitude}m</p>
                        )}
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-300">Status</h4>
                        <Badge className={`${getStatusColor(position, device)} text-white`}>
                          {getStatusText(position, device)}
                        </Badge>
                        <p className="text-sm text-gray-400 mt-1">
                          Updated: {formatLastUpdate(position.updatetime)}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GPS51LiveTrackingEnhanced;
