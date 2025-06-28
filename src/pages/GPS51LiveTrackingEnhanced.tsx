
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  MapPin, 
  Navigation, 
  Car, 
  Clock, 
  Play, 
  Pause,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import { useGPS51LiveData } from '@/hooks/useGPS51LiveData';
import { useGPS51SessionBridge } from '@/hooks/useGPS51SessionBridge';

const GPS51LiveTrackingEnhanced: React.FC = () => {
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  
  const { 
    hasValidSession, 
    isSessionReady, 
    error: sessionError,
    initializeSession,
    refreshSession 
  } = useGPS51SessionBridge();

  const {
    devices,
    positions,
    metrics,
    isLoading,
    error: dataError,
    isLiveTracking,
    startLiveTracking,
    stopLiveTracking,
    refreshData,
    getDevicePosition
  } = useGPS51LiveData({
    enabled: hasValidSession && isSessionReady,
    autoStart: false
  });

  const handleRetrySession = async () => {
    if (!hasValidSession) {
      await initializeSession();
    } else {
      await refreshSession();
    }
  };

  // Show session initialization screen
  if (!isSessionReady) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">GPS51 Live Tracking</h1>
            <p className="text-gray-400">Real-time vehicle location and status monitoring</p>
          </div>
        </div>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold text-white">Initializing GPS51 Session</h3>
              <p className="text-gray-400">Setting up connection to GPS51 platform...</p>
              
              {sessionError && (
                <Alert className="bg-red-900/50 border-red-700">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-red-200">
                    {sessionError}
                  </AlertDescription>
                </Alert>
              )}
              
              <Button 
                onClick={handleRetrySession}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={isLoading}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Connection
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show session error screen
  if (!hasValidSession) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">GPS51 Live Tracking</h1>
            <p className="text-gray-400">Real-time vehicle location and status monitoring</p>
          </div>
        </div>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <XCircle className="h-12 w-12 text-red-500 mx-auto" />
              <h3 className="text-xl font-semibold text-white">GPS51 Session Error</h3>
              <p className="text-gray-400">
                Unable to establish connection to GPS51 platform. Please check your authentication.
              </p>
              
              {sessionError && (
                <Alert className="bg-red-900/50 border-red-700">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-red-200">
                    {sessionError}
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="flex gap-2 justify-center">
                <Button 
                  onClick={handleRetrySession}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry Connection
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => window.location.href = '/gps51/setup'}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Go to Setup
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">GPS51 Live Tracking</h1>
          <p className="text-gray-400">Real-time vehicle location and status monitoring</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant={hasValidSession ? "default" : "destructive"} className="bg-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Connected
          </Badge>
          
          <Button
            onClick={isLiveTracking ? stopLiveTracking : startLiveTracking}
            variant={isLiveTracking ? "destructive" : "default"}
            className={isLiveTracking ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
          >
            {isLiveTracking ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Stop Tracking
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Start Tracking
              </>
            )}
          </Button>
          
          <Button
            onClick={refreshData}
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {dataError && (
        <Alert className="bg-red-900/50 border-red-700">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-200">
            GPS51 Data Error: {dataError}
          </AlertDescription>
        </Alert>
      )}

      {/* Fleet Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Total Devices</CardTitle>
            <Car className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{metrics?.totalDevices || 0}</div>
            <p className="text-xs text-gray-400">Registered devices</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Active</CardTitle>
            <Navigation className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{metrics?.activeDevices || 0}</div>
            <p className="text-xs text-gray-400">Online devices</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Moving</CardTitle>
            <MapPin className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">{metrics?.movingDevices || 0}</div>
            <p className="text-xs text-gray-400">In motion</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Parked</CardTitle>
            <Clock className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">{metrics?.parkedDevices || 0}</div>
            <p className="text-xs text-gray-400">Stationary</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Offline</CardTitle>
            <XCircle className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">{metrics?.offlineDevices || 0}</div>
            <p className="text-xs text-gray-400">Not responding</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Device List */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Navigation className="h-5 w-5" />
              Device List ({devices.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {devices.map((device) => {
                const position = getDevicePosition(device.deviceid);
                const isOnline = position && (Date.now() / 1000 - position.updatetime) < 300;
                const isSelected = selectedDevice === device.deviceid;
                
                return (
                  <div
                    key={device.deviceid}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-900/20' 
                        : 'border-gray-600 bg-gray-700/50 hover:bg-gray-700'
                    }`}
                    onClick={() => setSelectedDevice(device.deviceid)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-white">{device.devicename}</span>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400'}`} />
                        <Badge variant="outline" className="text-xs">
                          {isOnline ? 'Online' : 'Offline'}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-400 space-y-1">
                      <div>ID: {device.deviceid}</div>
                      {position && (
                        <>
                          <div>Speed: {position.speed} km/h</div>
                          <div>Last: {new Date(position.updatetime * 1000).toLocaleTimeString()}</div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {devices.length === 0 && !isLoading && (
                <div className="text-center text-gray-400 py-8">
                  {hasValidSession ? 'No devices found' : 'Connect GPS51 to view devices'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Map Placeholder */}
        <Card className="lg:col-span-2 bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Live Map</CardTitle>
          </CardHeader>
          <CardContent className="h-96 bg-gray-900 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <MapPin className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-400">Interactive map will be displayed here</p>
              <p className="text-sm text-gray-500 mt-2">
                Showing {positions.length} live positions
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Device Details */}
      {selectedDevice && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Device Details</CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const device = devices.find(d => d.deviceid === selectedDevice);
              const position = getDevicePosition(selectedDevice);
              
              if (!device) return <p className="text-gray-400">Device not found</p>;
              
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="text-lg font-semibold text-white">{device.devicename}</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Device ID:</span>
                        <span className="text-white">{device.deviceid}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Type:</span>
                        <span className="text-white">{device.devicetype}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">SIM Number:</span>
                        <span className="text-white">{device.simnum}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Group:</span>
                        <span className="text-white">{device.groupname}</span>
                      </div>
                    </div>
                  </div>
                  
                  {position && (
                    <div className="space-y-3">
                      <h4 className="text-lg font-semibold text-white">Live Position</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Latitude:</span>
                          <span className="text-white">{position.lat.toFixed(6)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Longitude:</span>
                          <span className="text-white">{position.lon.toFixed(6)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Speed:</span>
                          <span className="text-white">{position.speed} km/h</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Course:</span>
                          <span className="text-white">{position.course}°</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Last Update:</span>
                          <span className="text-white">
                            {new Date(position.updatetime * 1000).toLocaleString()}
                          </span>
                        </div>
                        {position.address && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Address:</span>
                            <span className="text-white">{position.address}</span>
                          </div>
                        )}
                      </div>
                    </div>
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
