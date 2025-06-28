
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MapPin, 
  Navigation, 
  Gauge, 
  Clock, 
  Wifi,
  WifiOff,
  Play,
  Pause,
  RefreshCw,
  Map as MapIcon,
  Activity
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { gps51TrackingService, Device, DevicePosition } from '@/services/gps51/GPS51TrackingService';
import DeviceListPanel from './DeviceListPanel';
import MapTilerMap from '@/components/map/MapTilerMap';

interface LiveTrackingDashboardProps {
  className?: string;
}

const LiveTrackingDashboard: React.FC<LiveTrackingDashboardProps> = ({
  className = ''
}) => {
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [isLiveTracking, setIsLiveTracking] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([-74.006, 40.7128]);
  const [mapZoom, setMapZoom] = useState(10);

  // Fetch devices
  const {
    data: deviceData,
    isLoading: devicesLoading,
    error: devicesError
  } = useQuery({
    queryKey: ['gps51-devices'],
    queryFn: () => gps51TrackingService.queryDeviceList(),
    refetchInterval: 60000
  });

  // Fetch live positions
  const {
    data: positionData,
    isLoading: positionsLoading,
    refetch: refetchPositions
  } = useQuery({
    queryKey: ['gps51-positions', selectedDevice?.deviceid],
    queryFn: () => gps51TrackingService.getLastPositions(
      selectedDevice ? [selectedDevice.deviceid] : undefined
    ),
    enabled: !!selectedDevice || isLiveTracking,
    refetchInterval: isLiveTracking ? 30000 : false, // 30 seconds when live tracking
    staleTime: 15000
  });

  const devices = deviceData?.devices || [];
  const positions = positionData?.positions || [];
  const currentPosition = selectedDevice 
    ? positions.find(p => p.deviceid === selectedDevice.deviceid)
    : null;

  // Update map center when device is selected
  useEffect(() => {
    if (currentPosition) {
      setMapCenter([currentPosition.lon, currentPosition.lat]);
      setMapZoom(15);
    }
  }, [currentPosition]);

  const handleDeviceSelect = (device: Device) => {
    setSelectedDevice(device);
    console.log('Selected device for tracking:', device.devicename);
  };

  const toggleLiveTracking = () => {
    setIsLiveTracking(!isLiveTracking);
    if (!isLiveTracking) {
      refetchPositions();
    }
  };

  const formatSpeed = (speed: number) => {
    return `${Math.round(speed)} km/h`;
  };

  const formatCoordinate = (coord: number, type: 'lat' | 'lon') => {
    const direction = type === 'lat' ? (coord >= 0 ? 'N' : 'S') : (coord >= 0 ? 'E' : 'W');
    return `${Math.abs(coord).toFixed(6)}° ${direction}`;
  };

  const getDeviceStatusColor = (status: string) => {
    switch (status) {
      case 'moving': return 'text-green-400';
      case 'parked': return 'text-yellow-400';
      case 'online': return 'text-blue-400';
      case 'offline': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  // Prepare vehicles for map
  const mapVehicles = devices.map(device => {
    const position = positions.find(p => p.deviceid === device.deviceid);
    return {
      device_id: device.deviceid,
      device_name: device.devicename,
      last_position: position ? {
        latitude: position.lat,
        longitude: position.lon
      } : undefined,
      status: device.status
    };
  }).filter(v => v.last_position);

  const selectedMapVehicle = selectedDevice ? {
    device_id: selectedDevice.deviceid,
    device_name: selectedDevice.devicename,
    last_position: currentPosition ? {
      latitude: currentPosition.lat,
      longitude: currentPosition.lon
    } : undefined
  } : null;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">Live Fleet Tracking</h2>
          <p className="text-gray-400 mt-1">
            Real-time vehicle monitoring and location tracking
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {isLiveTracking ? (
              <Wifi className="h-5 w-5 text-green-400" />
            ) : (
              <WifiOff className="h-5 w-5 text-gray-400" />
            )}
            <span className="text-sm text-gray-300">
              {isLiveTracking ? 'Live Tracking' : 'Paused'}
            </span>
          </div>
          
          <Button
            onClick={toggleLiveTracking}
            variant={isLiveTracking ? "destructive" : "default"}
            className="flex items-center gap-2"
          >
            {isLiveTracking ? (
              <>
                <Pause className="h-4 w-4" />
                Pause Tracking
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Start Live Tracking
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Device List Sidebar */}
        <div className="lg:col-span-1">
          <DeviceListPanel
            onDeviceSelect={handleDeviceSelect}
            selectedDeviceId={selectedDevice?.deviceid}
            className="h-fit"
          />
        </div>

        {/* Map and Details */}
        <div className="lg:col-span-3 space-y-6">
          {/* Interactive Map */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <MapIcon className="h-5 w-5 text-blue-400" />
                Fleet Map
                {isLiveTracking && (
                  <Badge className="bg-green-600 text-white animate-pulse">
                    LIVE
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96 rounded-lg overflow-hidden">
                <MapTilerMap
                  center={mapCenter}
                  zoom={mapZoom}
                  vehicles={mapVehicles}
                  selectedVehicle={selectedMapVehicle}
                  onVehicleSelect={(vehicle) => {
                    const device = devices.find(d => d.deviceid === vehicle.device_id);
                    if (device) {
                      handleDeviceSelect(device);
                    }
                  }}
                  autoFitBounds={!selectedDevice && mapVehicles.length > 1}
                  className="w-full h-full"
                />
              </div>
            </CardContent>
          </Card>

          {/* Device Information Panel */}
          {selectedDevice && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Activity className="h-5 w-5 text-blue-400" />
                  {selectedDevice.devicename} - Live Information
                  <Badge className={getDeviceStatusColor(selectedDevice.status)}>
                    {selectedDevice.status.toUpperCase()}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="current" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 bg-gray-700">
                    <TabsTrigger value="current" className="data-[state=active]:bg-blue-600">
                      Current Status
                    </TabsTrigger>
                    <TabsTrigger value="location" className="data-[state=active]:bg-blue-600">
                      Location
                    </TabsTrigger>
                    <TabsTrigger value="details" className="data-[state=active]:bg-blue-600">
                      Details
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="current" className="mt-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-gray-700 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Gauge className="h-5 w-5 text-blue-400" />
                          <span className="text-sm text-gray-400">Speed</span>
                        </div>
                        <div className="text-xl font-bold text-white">
                          {currentPosition ? formatSpeed(currentPosition.speed) : 'N/A'}
                        </div>
                      </div>

                      <div className="bg-gray-700 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Navigation className="h-5 w-5 text-green-400" />
                          <span className="text-sm text-gray-400">Heading</span>
                        </div>
                        <div className="text-xl font-bold text-white">
                          {currentPosition ? `${Math.round(currentPosition.course)}°` : 'N/A'}
                        </div>
                      </div>

                      <div className="bg-gray-700 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="h-5 w-5 text-purple-400" />
                          <span className="text-sm text-gray-400">Altitude</span>
                        </div>
                        <div className="text-xl font-bold text-white">
                          {currentPosition ? `${Math.round(currentPosition.altitude)}m` : 'N/A'}
                        </div>
                      </div>

                      <div className="bg-gray-700 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="h-5 w-5 text-orange-400" />
                          <span className="text-sm text-gray-400">Last Update</span>
                        </div>
                        <div className="text-sm font-medium text-white">
                          {currentPosition 
                            ? new Date(currentPosition.timestamp).toLocaleTimeString()
                            : 'N/A'
                          }
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="location" className="mt-4">
                    {currentPosition ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-gray-700 p-4 rounded-lg">
                            <h4 className="text-sm font-medium text-gray-400 mb-2">Coordinates</h4>
                            <div className="space-y-1">
                              <p className="text-white font-mono">
                                Lat: {formatCoordinate(currentPosition.lat, 'lat')}
                              </p>
                              <p className="text-white font-mono">
                                Lon: {formatCoordinate(currentPosition.lon, 'lon')}
                              </p>
                            </div>
                          </div>

                          <div className="bg-gray-700 p-4 rounded-lg">
                            <h4 className="text-sm font-medium text-gray-400 mb-2">Address</h4>
                            <p className="text-white">
                              {currentPosition.address || 'Address not available'}
                            </p>
                          </div>
                        </div>

                        <div className="bg-gray-700 p-4 rounded-lg">
                          <h4 className="text-sm font-medium text-gray-400 mb-2">Quick Actions</h4>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const url = `https://www.google.com/maps?q=${currentPosition.lat},${currentPosition.lon}`;
                                window.open(url, '_blank');
                              }}
                              className="border-gray-600 text-gray-300 hover:bg-gray-600"
                            >
                              <MapPin className="h-4 w-4 mr-2" />
                              View on Google Maps
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={refetchPositions}
                              disabled={positionsLoading}
                              className="border-gray-600 text-gray-300 hover:bg-gray-600"
                            >
                              <RefreshCw className={`h-4 w-4 mr-2 ${positionsLoading ? 'animate-spin' : ''}`} />
                              Refresh
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No location data available</p>
                        <p className="text-sm mt-1">
                          {positionsLoading ? 'Loading position...' : 'Device may be offline'}
                        </p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="details" className="mt-4">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-700 p-4 rounded-lg">
                          <h4 className="text-sm font-medium text-gray-400 mb-2">Device Information</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Device ID:</span>
                              <span className="text-white font-mono">{selectedDevice.deviceid}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Device Name:</span>
                              <span className="text-white">{selectedDevice.devicename}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Device Type:</span>
                              <span className="text-white">{selectedDevice.devicetype}</span>
                            </div>
                            {selectedDevice.simnum && (
                              <div className="flex justify-between">
                                <span className="text-gray-400">SIM Number:</span>
                                <span className="text-white font-mono">{selectedDevice.simnum}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="bg-gray-700 p-4 rounded-lg">
                          <h4 className="text-sm font-medium text-gray-400 mb-2">Status Information</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-400">Current Status:</span>
                              <Badge className={getDeviceStatusColor(selectedDevice.status)}>
                                {selectedDevice.status.toUpperCase()}
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Account Status:</span>
                              <span className="text-white">
                                {selectedDevice.isfree === 1 ? 'Normal' : 'Limited'}
                              </span>
                            </div>
                            {selectedDevice.lastactivetime > 0 && (
                              <div className="flex justify-between">
                                <span className="text-gray-400">Last Active:</span>
                                <span className="text-white">
                                  {new Date(selectedDevice.lastactivetime * 1000).toLocaleString()}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveTrackingDashboard;
