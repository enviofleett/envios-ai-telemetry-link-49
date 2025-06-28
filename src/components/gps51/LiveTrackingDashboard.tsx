import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  MapPin, 
  Navigation, 
  Clock, 
  Zap, 
  RefreshCw, 
  Settings,
  Car,
  Truck,
  Activity
} from 'lucide-react';
import { GPS51TrackingService, Device, DevicePosition } from '@/services/gps51/GPS51TrackingService';

interface LastPositionResult {
  positions: DevicePosition[];
}

interface DeviceListResult {
  devices: Device[];
}

const LiveTrackingDashboard: React.FC = () => {
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [mapCenter, setMapCenter] = useState({ lat: 40.7128, lng: -74.0060 });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const trackingService = new GPS51TrackingService();

  const { 
    data: devices, 
    isLoading: devicesLoading, 
    error: devicesError,
    refetch: refetchDevices
  } = useQuery({
    queryKey: ['devices'],
    queryFn: () => trackingService.queryDeviceList(),
    refetchInterval: 30000, // 30 seconds
  });

  const { 
    data: positions, 
    isLoading: positionsLoading, 
    refetch: refetchPositions
  } = useQuery({
    queryKey: ['positions', selectedDevices],
    queryFn: () => trackingService.getLastPositions(selectedDevices),
    enabled: selectedDevices.length > 0,
    refetchInterval: 15000, // 15 seconds
  });

  const getDeviceName = (deviceId: string) => {
    const device = devices?.devices?.find(d => d.deviceid === deviceId);
    return device?.devicename || deviceId;
  };

  const getDeviceStatusBadge = (device: Device) => {
    const isActive = device.status === 'active';
    return (
      <Badge variant={isActive ? 'default' : 'destructive'}>
        {isActive ? 'Active' : 'Inactive'}
      </Badge>
    );
  };

  const getPositionStatusBadge = (position: DevicePosition) => {
    const isMoving = position.speed > 5;
    return (
      <Badge variant={isMoving ? 'default' : 'secondary'}>
        {isMoving ? 'Moving' : 'Stopped'}
      </Badge>
    );
  };

  const getSpeedBadge = (speed: number) => {
    const isFast = speed > 80;
    return (
      <Badge variant={isFast ? 'destructive' : 'outline'}>
        {speed} km/h
      </Badge>
    );
  };

  const formatLastSeen = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 60) {
      return `${minutes} minutes ago`;
    } else if (minutes < 1440) {
      return `${Math.floor(minutes / 60)} hours ago`;
    } else {
      return `${Math.floor(minutes / 1440)} days ago`;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const toggleDeviceSelection = (deviceId: string) => {
    setSelectedDevices((prev) => {
      if (prev.includes(deviceId)) {
        return prev.filter((id) => id !== deviceId);
      } else {
        return [...prev, deviceId];
      }
    });
  };

  useEffect(() => {
    if (positions?.positions && positions.positions.length > 0) {
      const firstPosition = positions.positions[0];
      setMapCenter({ lat: firstPosition.lat, lng: firstPosition.lon });
    }
  }, [positions]);

  const handleRefresh = () => {
    refetchDevices();
    if (selectedDevices.length > 0) {
      refetchPositions();
    }
  };

  if (devicesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2 text-gray-400">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Loading devices...
        </div>
      </div>
    );
  }

  if (devicesError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-400 mb-2">Failed to load devices</div>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-white">Live Tracking</h2>
          <Badge variant="outline" className="border-blue-500 text-blue-400">
            {devices?.devices?.length || 0} Devices
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={devicesLoading || positionsLoading}
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${(devicesLoading || positionsLoading) ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Device List */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Car className="h-5 w-5 text-blue-400" />
                Fleet Devices
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {devices?.devices?.map((device) => (
                <div
                  key={device.deviceid}
                  className={`p-3 rounded-lg border transition-all cursor-pointer ${
                    selectedDevices.includes(device.deviceid)
                      ? 'border-blue-500 bg-blue-900/20'
                      : 'border-gray-600 bg-gray-700/50 hover:bg-gray-700'
                  }`}
                  onClick={() => toggleDeviceSelection(device.deviceid)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-white truncate">
                      {device.devicename || device.deviceid}
                    </span>
                    {getDeviceStatusBadge(device)}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span>GPS</span>
                    </div>
                    {device.lastactivetime && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatLastSeen(device.lastactivetime)}</span>
                      </div>
                    )}
                  </div>
                  
                  {device.simnum && (
                    <div className="text-xs text-gray-500 mt-1">
                      SIM: {device.simnum}
                    </div>
                  )}
                </div>
              ))}
              
              {(!devices?.devices || devices.devices.length === 0) && (
                <div className="text-center py-8 text-gray-400">
                  <Car className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No devices found</p>
                  <p className="text-sm">Add devices to start tracking</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Map and Details */}
        <div className="lg:col-span-2 space-y-4">
          {/* Map Placeholder */}
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-0">
              <div className="h-96 bg-gray-900 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <MapPin className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">Interactive Map</p>
                  <p className="text-sm">Real-time device positions will be displayed here</p>
                  {selectedDevices.length === 0 && (
                    <p className="text-xs mt-2">Select devices from the list to view their locations</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Selected Device Details */}
          {selectedDevices.length > 0 && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Activity className="h-5 w-5 text-green-400" />
                  Device Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                {positionsLoading ? (
                  <div className="flex items-center gap-2 text-gray-400">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Loading positions...
                  </div>
                ) : (
                  <div className="space-y-4">
                    {positions?.positions?.map((position) => (
                      <div key={position.deviceid} className="border-b border-gray-700 pb-4 last:border-b-0">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-white">
                            {getDeviceName(position.deviceid)}
                          </span>
                          <div className="flex items-center gap-2">
                            {getSpeedBadge(position.speed)}
                            {getPositionStatusBadge(position)}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-400">Location:</span>
                            <p className="text-white">{position.address || 'Unknown'}</p>
                          </div>
                          <div>
                            <span className="text-gray-400">Coordinates:</span>
                            <p className="text-white font-mono text-xs">
                              {position.lat.toFixed(6)}, {position.lon.toFixed(6)}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-400">Speed:</span>
                            <p className="text-white">{position.speed} km/h</p>
                          </div>
                          <div>
                            <span className="text-gray-400">Last Update:</span>
                            <p className="text-white">{formatTimestamp(position.timestamp)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveTrackingDashboard;
