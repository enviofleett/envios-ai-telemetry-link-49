
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Play, 
  Square, 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  Navigation,
  Clock,
  AlertCircle,
  Key,
  Database
} from 'lucide-react';
import { useEnhancedGP51Integration } from '@/hooks/useEnhancedGP51Integration';
import { formatDistanceToNow } from 'date-fns';

const RealTimeTrackingDashboard: React.FC = () => {
  const {
    devices,
    positions,
    isConnected,
    isLoading,
    error,
    startTracking,
    stopTracking,
    refreshDevices,
    syncWithGP51,
    authenticateWithGP51
  } = useEnhancedGP51Integration();

  const [isTrackingActive, setIsTrackingActive] = useState(false);
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [authCredentials, setAuthCredentials] = useState({
    username: 'octopus',
    password: ''
  });

  const handleStartTracking = async () => {
    await startTracking();
    setIsTrackingActive(true);
  };

  const handleStopTracking = () => {
    stopTracking();
    setIsTrackingActive(false);
  };

  const handleAuthenticate = async () => {
    const success = await authenticateWithGP51(authCredentials.username, authCredentials.password);
    if (success) {
      setShowAuthForm(false);
      // Auto-sync after successful authentication
      await syncWithGP51();
    }
  };

  const onlineDevices = devices.filter(d => d.isOnline).length;
  const totalDevices = devices.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Real-Time Vehicle Tracking</h1>
          <p className="text-muted-foreground">
            Production GP51 integration with live position updates
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isConnected ? "default" : "destructive"}>
            {isConnected ? (
              <>
                <Wifi className="w-4 h-4 mr-1" />
                Connected
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 mr-1" />
                Disconnected
              </>
            )}
          </Badge>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Authentication Section */}
      {!isConnected && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              GP51 Authentication Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!showAuthForm ? (
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  You need to authenticate with GP51 to access real-time vehicle data.
                </p>
                <Button onClick={() => setShowAuthForm(true)}>
                  <Key className="w-4 h-4 mr-2" />
                  Authenticate with GP51
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={authCredentials.username}
                      onChange={(e) => setAuthCredentials(prev => ({ ...prev, username: e.target.value }))}
                      placeholder="Enter GP51 username"
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={authCredentials.password}
                      onChange={(e) => setAuthCredentials(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Enter GP51 password"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAuthenticate} disabled={isLoading}>
                    {isLoading ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Key className="w-4 h-4 mr-2" />
                    )}
                    Authenticate
                  </Button>
                  <Button variant="outline" onClick={() => setShowAuthForm(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Tracking Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            {!isTrackingActive ? (
              <Button onClick={handleStartTracking} disabled={isLoading || !isConnected}>
                <Play className="w-4 h-4 mr-2" />
                Start Tracking
              </Button>
            ) : (
              <Button 
                onClick={handleStopTracking} 
                variant="destructive"
                disabled={isLoading}
              >
                <Square className="w-4 h-4 mr-2" />
                Stop Tracking
              </Button>
            )}
            
            <Button 
              onClick={refreshDevices} 
              variant="outline"
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Devices
            </Button>

            <Button 
              onClick={syncWithGP51} 
              variant="outline"
              disabled={isLoading || !isConnected}
            >
              <Database className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Sync with GP51
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{onlineDevices}</div>
              <div className="text-sm text-muted-foreground">Online Devices</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{totalDevices}</div>
              <div className="text-sm text-muted-foreground">Total Devices</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{positions.size}</div>
              <div className="text-sm text-muted-foreground">Live Updates</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Device List */}
      <Card>
        <CardHeader>
          <CardTitle>Device Status</CardTitle>
        </CardHeader>
        <CardContent>
          {devices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {!isConnected ? (
                <div>
                  <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Authenticate with GP51 to load devices</p>
                </div>
              ) : (
                <div>
                  <RefreshCw className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No devices found. Try syncing with GP51.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {devices.map(device => {
                const positionUpdate = positions.get(device.deviceId);
                
                return (
                  <div 
                    key={device.deviceId}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        {device.isOnline ? (
                          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                        ) : (
                          <div className="w-3 h-3 bg-gray-400 rounded-full" />
                        )}
                        <div>
                          <div className="font-medium">{device.deviceName}</div>
                          <div className="text-sm text-muted-foreground">
                            ID: {device.deviceId}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      {device.position && (
                        <div className="text-sm space-y-1">
                          <div className="flex items-center gap-2">
                            <Navigation className="w-4 h-4" />
                            <span>
                              {device.position.speed.toFixed(1)} km/h
                            </span>
                          </div>
                          <div className="text-muted-foreground">
                            {device.position.latitude.toFixed(6)}, {device.position.longitude.toFixed(6)}
                          </div>
                        </div>
                      )}

                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatDistanceToNow(device.lastSeen, { addSuffix: true })}
                      </div>

                      <Badge variant={device.isOnline ? "default" : "secondary"}>
                        {device.isOnline ? "Online" : "Offline"}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RealTimeTrackingDashboard;
