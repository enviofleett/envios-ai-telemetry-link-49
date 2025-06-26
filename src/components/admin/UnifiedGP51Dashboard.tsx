
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  Users, 
  Car, 
  Activity, 
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { useUnifiedGP51Service } from '@/hooks/useUnifiedGP51Service';
import { useRealTimePositions } from '@/hooks/useRealTimePositions';

export default function UnifiedGP51Dashboard() {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  
  const {
    authenticate,
    authenticateAdmin,
    queryMonitorList,
    getConnectionHealth,
    testConnection,
    isAuthenticated,
    currentUser,
    isLoading,
    error,
    users,
    devices,
    fetchUsers,
    fetchDevices,
    clearError
  } = useUnifiedGP51Service();

  const { positions, subscribe, unsubscribe, isSubscribed } = useRealTimePositions();

  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [connectionTest, setConnectionTest] = useState<any>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUsers();
      fetchDevices();
      checkHealth();
    }
  }, [isAuthenticated, fetchUsers, fetchDevices]);

  const handleAuthenticate = async (isAdmin = false) => {
    try {
      if (isAdmin) {
        await authenticateAdmin(credentials.username, credentials.password);
      } else {
        await authenticate(credentials.username, credentials.password);
      }
      setCredentials({ username: '', password: '' });
    } catch (error) {
      console.error('Authentication failed:', error);
    }
  };

  const checkHealth = async () => {
    try {
      const health = await getConnectionHealth();
      setHealthStatus(health);
    } catch (error) {
      console.error('Health check failed:', error);
    }
  };

  const runConnectionTest = async () => {
    try {
      const result = await testConnection();
      setConnectionTest(result);
    } catch (error) {
      console.error('Connection test failed:', error);
    }
  };

  const handleRealTimeTracking = () => {
    if (isSubscribed) {
      unsubscribe();
      setSelectedDevices([]);
    } else {
      const deviceIds = devices.slice(0, 5).map(d => d.deviceid); // Track first 5 devices
      setSelectedDevices(deviceIds);
      subscribe(deviceIds);
    }
  };

  const getStatusBadge = (status: boolean, label: string) => {
    return status ? (
      <Badge variant="default" className="bg-green-100 text-green-800">
        <CheckCircle className="h-3 w-3 mr-1" />
        {label}
      </Badge>
    ) : (
      <Badge variant="destructive">
        <XCircle className="h-3 w-3 mr-1" />
        {label}
      </Badge>
    );
  };

  if (!isAuthenticated) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            GP51 Authentication
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={credentials.username}
              onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
              placeholder="GP51 Username"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={credentials.password}
              onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
              placeholder="GP51 Password"
            />
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={() => handleAuthenticate(false)}
              disabled={isLoading || !credentials.username || !credentials.password}
              className="flex-1"
            >
              {isLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
              Login
            </Button>
            <Button 
              onClick={() => handleAuthenticate(true)}
              disabled={isLoading || !credentials.username || !credentials.password}
              variant="outline"
              className="flex-1"
            >
              Admin Login
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Unified GP51 Dashboard</h1>
          <p className="text-muted-foreground">
            Connected as: {currentUser?.showname || currentUser?.username} 
            {currentUser?.usertype === 3 && <Badge className="ml-2">Admin</Badge>}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={checkHealth} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Check Health
          </Button>
          <Button onClick={runConnectionTest} variant="outline" size="sm">
            Test Connection
          </Button>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Connection</p>
                {getStatusBadge(healthStatus?.isConnected, healthStatus?.isConnected ? 'Online' : 'Offline')}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">Users</p>
                <p className="text-xl font-bold">{users.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Car className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium">Devices</p>
                <p className="text-xl font-bold">{devices.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium">Real-time</p>
                {getStatusBadge(isSubscribed, isSubscribed ? 'Active' : 'Inactive')}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="devices" className="w-full">
        <TabsList>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="positions">Live Positions</TabsTrigger>
          <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
        </TabsList>

        <TabsContent value="devices" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Device Management</h3>
            <Button onClick={fetchDevices} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
          
          <Card>
            <CardContent className="p-6">
              {devices.length > 0 ? (
                <div className="space-y-2">
                  {devices.map((device, index) => (
                    <div key={device.deviceid || index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{device.devicename || `Device ${device.deviceid}`}</p>
                        <p className="text-sm text-muted-foreground">ID: {device.deviceid}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={device.status === 'online' ? 'default' : 'secondary'}>
                          {device.status || 'Unknown'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No devices found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">User Management</h3>
            <Button onClick={fetchUsers} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
          
          <Card>
            <CardContent className="p-6">
              {users.length > 0 ? (
                <div className="space-y-2">
                  {users.map((user, index) => (
                    <div key={user.username || index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{user.showname || user.username}</p>
                        <p className="text-sm text-muted-foreground">@{user.username}</p>
                      </div>
                      <Badge variant={user.usertype === 3 ? 'default' : 'secondary'}>
                        {user.usertype === 3 ? 'Admin' : 'User'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No users found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="positions" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Live Position Tracking</h3>
            <Button onClick={handleRealTimeTracking} variant={isSubscribed ? 'destructive' : 'default'}>
              {isSubscribed ? 'Stop Tracking' : 'Start Tracking'}
            </Button>
          </div>
          
          <Card>
            <CardContent className="p-6">
              {positions.size > 0 ? (
                <div className="space-y-2">
                  {Array.from(positions.entries()).map(([deviceId, positionUpdate]) => (
                    <div key={deviceId} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Device: {deviceId}</p>
                        <p className="text-sm text-muted-foreground">
                          Lat: {positionUpdate.position.latitude.toFixed(6)}, 
                          Lng: {positionUpdate.position.longitude.toFixed(6)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">{positionUpdate.position.speed} km/h</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(positionUpdate.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  {isSubscribed ? 'Waiting for position updates...' : 'Start tracking to see live positions'}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="diagnostics" className="space-y-4">
          <h3 className="text-lg font-semibold">System Diagnostics</h3>
          
          {healthStatus && (
            <Card>
              <CardHeader>
                <CardTitle>Connection Health</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span>Status:</span>
                  {getStatusBadge(healthStatus.isConnected, healthStatus.isConnected ? 'Connected' : 'Disconnected')}
                </div>
                <div className="flex justify-between">
                  <span>Response Time:</span>
                  <span>{healthStatus.responseTime}ms</span>
                </div>
                <div className="flex justify-between">
                  <span>Active Devices:</span>
                  <span>{healthStatus.activeDevices}</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Check:</span>
                  <span>{healthStatus.lastPingTime.toLocaleTimeString()}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {connectionTest && (
            <Card>
              <CardHeader>
                <CardTitle>Connection Test Results</CardTitle>
              </CardHeader>
              <CardContent>
                {connectionTest.success ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span>Connection test passed</span>
                    </div>
                    {connectionTest.data && (
                      <div className="text-sm text-muted-foreground">
                        Device Count: {connectionTest.data.deviceCount || 0}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-red-600" />
                    <span>{connectionTest.error || 'Connection test failed'}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
