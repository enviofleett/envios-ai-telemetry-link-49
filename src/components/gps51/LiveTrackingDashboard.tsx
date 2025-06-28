
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { 
  MapPin, 
  Navigation, 
  RefreshCw, 
  Zap, 
  Clock, 
  Users,
  Car,
  Activity
} from 'lucide-react';
import { GPS51TrackingService, Device } from '@/services/gps51/GPS51TrackingService';

const LiveTrackingDashboard: React.FC = () => {
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [mapCenter] = useState({ lat: 40.7128, lng: -74.0060 }); // Default to NYC
  
  const trackingService = new GPS51TrackingService();

  // Query device list
  const { 
    data: deviceData, 
    isLoading: devicesLoading, 
    error: devicesError,
    refetch: refetchDevices
  } = useQuery({
    queryKey: ['gps51-devices'],
    queryFn: () => trackingService.queryDeviceList(),
    refetchInterval: 60000, // Refresh every minute
    retry: 3
  });

  // Query last positions for all devices
  const { 
    data: positionData, 
    isLoading: positionsLoading, 
    error: positionsError,
    refetch: refetchPositions
  } = useQuery({
    queryKey: ['gps51-positions', deviceData?.devices?.map(d => d.deviceid)],
    queryFn: () => {
      const deviceIds = deviceData?.devices?.map(d => d.deviceid) || [];
      return trackingService.getLastPositions(deviceIds);
    },
    enabled: !!deviceData?.devices?.length,
    refetchInterval: 30000, // Refresh every 30 seconds
    retry: 2
  });

  const handleRefresh = useCallback(() => {
    refetchDevices();
    refetchPositions();
  }, [refetchDevices, refetchPositions]);

  const devices = deviceData?.devices || [];
  const positions = positionData?.devices || [];

  // Calculate stats
  const totalDevices = devices.length;
  const onlineDevices = devices.filter(d => d.status === 'online' || d.status === 'moving').length;
  const movingDevices = devices.filter(d => d.status === 'moving').length;
  const parkedDevices = devices.filter(d => d.status === 'parked').length;

  const handleDeviceSelect = (deviceId: string) => {
    setSelectedDevices(prev => 
      prev.includes(deviceId) 
        ? prev.filter(id => id !== deviceId)
        : [...prev, deviceId]
    );
  };

  const getStatusColor = (status: Device['status']) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'moving':
        return 'bg-blue-500';
      case 'parked':
        return 'bg-yellow-500';
      case 'offline':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: Device['status']) => {
    switch (status) {
      case 'online':
        return 'Online';
      case 'moving':
        return 'Moving';
      case 'parked':
        return 'Parked';
      case 'offline':
        return 'Offline';
      default:
        return 'Unknown';
    }
  };

  if (devicesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-400">Loading fleet data...</span>
      </div>
    );
  }

  if (devicesError) {
    return (
      <Card className="bg-red-900/20 border-red-700">
        <CardContent className="pt-6">
          <div className="text-red-400">
            Error loading fleet data: {devicesError instanceof Error ? devicesError.message : 'Unknown error'}
          </div>
          <Button onClick={handleRefresh} className="mt-4" variant="outline">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Fleet Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Devices</p>
                <p className="text-2xl font-bold text-white">{totalDevices}</p>
              </div>
              <Users className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Online</p>
                <p className="text-2xl font-bold text-green-400">{onlineDevices}</p>
              </div>
              <Activity className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Moving</p>
                <p className="text-2xl font-bold text-blue-400">{movingDevices}</p>
              </div>
              <Navigation className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Parked</p>
                <p className="text-2xl font-bold text-yellow-400">{parkedDevices}</p>
              </div>
              <Car className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Device List */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-white">
              <span className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-400" />
                Fleet Devices
              </span>
              <Button
                onClick={handleRefresh}
                disabled={devicesLoading || positionsLoading}
                variant="outline"
                size="sm"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                {devicesLoading || positionsLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-96 overflow-y-auto">
            {devices.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <Car className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                <p>No devices found</p>
                <p className="text-sm">Check your GPS51 account</p>
              </div>
            ) : (
              devices.map((device) => {
                const position = positions.find(p => p.deviceid === device.deviceid);
                const isSelected = selectedDevices.includes(device.deviceid);
                
                return (
                  <div
                    key={device.deviceid}
                    onClick={() => handleDeviceSelect(device.deviceid)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-900/20' 
                        : 'border-gray-600 bg-gray-700/50 hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(device.status)}`}></div>
                        <span className="text-white font-medium">
                          {device.devicename || `Device ${device.deviceid.substring(0, 8)}`}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {getStatusText(device.status)}
                      </Badge>
                    </div>
                    
                    <div className="space-y-1 text-sm text-gray-400">
                      <div className="flex justify-between">
                        <span>Device ID:</span>
                        <span className="font-mono">{device.deviceid.substring(0, 12)}...</span>
                      </div>
                      {device.simnum && (
                        <div className="flex justify-between">
                          <span>SIM:</span>
                          <span>{device.simnum}</span>
                        </div>
                      )}
                      {position && (
                        <>
                          <div className="flex justify-between">
                            <span>Speed:</span>
                            <span>{Math.round(position.speed)} km/h</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Updated:</span>
                            <span>{new Date(position.updatetime * 1000).toLocaleTimeString()}</span>
                          </div>
                        </>
                      )}
                      {device.lastactivetime && (
                        <div className="flex justify-between">
                          <span>Last Active:</span>
                          <span>{new Date(device.lastactivetime * 1000).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Map Placeholder */}
        <Card className="lg:col-span-2 bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Navigation className="h-5 w-5 text-blue-400" />
              Live Map
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96 bg-gray-700 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-400">
                <MapPin className="h-16 w-16 mx-auto mb-4 text-gray-600" />
                <h3 className="text-lg font-medium mb-2">Interactive Map</h3>
                <p className="text-sm mb-4">
                  Real-time device positions will be displayed here
                </p>
                <div className="space-y-2 text-xs">
                  <p>• Real-time vehicle tracking</p>
                  <p>• Route visualization</p>
                  <p>• Traffic overlays</p>
                  <p>• Geofence boundaries</p>
                </div>
                {positions.length > 0 && (
                  <div className="mt-4 p-3 bg-blue-900/20 rounded border border-blue-700">
                    <p className="text-blue-400 font-medium">
                      {positions.length} device positions received
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Map integration coming soon
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Position Data Display */}
      {positions.length > 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Zap className="h-5 w-5 text-yellow-400" />
              Live Position Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {positions.map((position) => {
                const device = devices.find(d => d.deviceid === position.deviceid);
                return (
                  <div key={position.deviceid} className="p-4 bg-gray-700 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-white">
                        {device?.devicename || `Device ${position.deviceid.substring(0, 8)}`}
                      </h4>
                      <Badge variant="outline" className="text-xs">
                        Live
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-gray-300">
                        <span>Coordinates:</span>
                        <span className="font-mono">
                          {position.lat.toFixed(6)}, {position.lon.toFixed(6)}
                        </span>
                      </div>
                      <div className="flex justify-between text-gray-300">
                        <span>Speed:</span>
                        <span>{Math.round(position.speed)} km/h</span>
                      </div>
                      <div className="flex justify-between text-gray-300">
                        <span>Course:</span>
                        <span>{position.course}°</span>
                      </div>
                      <div className="flex items-center justify-between text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Updated:
                        </span>
                        <span>{new Date(position.updatetime * 1000).toLocaleTimeString()}</span>
                      </div>
                      {position.address && (
                        <div className="text-xs text-gray-400 mt-2 p-2 bg-gray-800 rounded">
                          {position.address}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Messages */}
      {positionsLoading && (
        <Card className="bg-blue-900/20 border-blue-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-blue-400">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Updating position data...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {positionsError && (
        <Card className="bg-yellow-900/20 border-yellow-700">
          <CardContent className="pt-6">
            <div className="text-yellow-400">
              Warning: Could not fetch latest position data
            </div>
            <p className="text-sm text-gray-400 mt-1">
              {positionsError instanceof Error ? positionsError.message : 'Unknown error'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LiveTrackingDashboard;
