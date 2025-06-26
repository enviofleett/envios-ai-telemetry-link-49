
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUnifiedGP51Service } from '@/hooks/useUnifiedGP51Service';
import { useRealTimePositions } from '@/hooks/useRealTimePositions';
import { 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Users, 
  Car, 
  MapPin,
  Zap,
  Settings,
  Activity
} from 'lucide-react';

const UnifiedGP51Dashboard: React.FC = () => {
  const {
    session,
    isConnected,
    isLoading,
    error,
    authenticateAdmin,
    testConnection,
    queryMonitorList,
    getLastPosition,
    addUser,
    addDevice,
    clearError
  } = useUnifiedGP51Service();

  const {
    positions,
    isSubscribed,
    subscribe,
    unsubscribe,
    lastUpdate
  } = useRealTimePositions();

  const [credentials, setCredentials] = useState({
    username: 'octopus',
    password: ''
  });

  const [devices, setDevices] = useState<any[]>([]);
  const [deviceStats, setDeviceStats] = useState({
    total: 0,
    online: 0,
    offline: 0
  });

  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    email: '',
    companyName: ''
  });

  const [newDevice, setNewDevice] = useState({
    deviceid: '',
    devicename: '',
    devicetype: 92
  });

  useEffect(() => {
    if (isConnected) {
      loadDevices();
    }
  }, [isConnected]);

  const handleAuthenticate = async () => {
    const success = await authenticateAdmin({
      username: credentials.username,
      password: credentials.password
    });

    if (success) {
      setCredentials({ ...credentials, password: '' });
    }
  };

  const loadDevices = async () => {
    const result = await queryMonitorList();
    if (result.success && result.data) {
      const allDevices: any[] = [];
      
      if (result.data.groups) {
        result.data.groups.forEach((group: any) => {
          if (group.devices) {
            allDevices.push(...group.devices);
          }
        });
      }
      
      setDevices(allDevices);
      setDeviceStats({
        total: allDevices.length,
        online: allDevices.filter(d => d.lastactivetime && 
          new Date(d.lastactivetime).getTime() > Date.now() - 24 * 60 * 60 * 1000).length,
        offline: allDevices.filter(d => !d.lastactivetime || 
          new Date(d.lastactivetime).getTime() <= Date.now() - 24 * 60 * 60 * 1000).length
      });

      // Subscribe to real-time positions for all devices
      const deviceIds = allDevices.map(d => d.deviceid);
      if (deviceIds.length > 0) {
        subscribe(deviceIds);
      }
    }
  };

  const handleAddUser = async () => {
    if (!newUser.username || !newUser.password) return;

    const result = await addUser({
      username: newUser.username,
      password: newUser.password, // Should be MD5 hashed in production
      usertype: 11,
      multilogin: 1,
      email: newUser.email,
      companyName: newUser.companyName
    });

    if (result.success) {
      setNewUser({ username: '', password: '', email: '', companyName: '' });
    }
  };

  const handleAddDevice = async () => {
    if (!newDevice.deviceid || !newDevice.devicename) return;

    const result = await addDevice({
      deviceid: newDevice.deviceid,
      devicename: newDevice.devicename,
      devicetype: newDevice.devicetype,
      creater: credentials.username
    });

    if (result.success) {
      setNewDevice({ deviceid: '', devicename: '', devicetype: 92 });
      loadDevices();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Unified GP51 Dashboard</h1>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <Badge variant="default" className="bg-green-500">
              <CheckCircle className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          ) : (
            <Badge variant="destructive">
              <XCircle className="h-3 w-3 mr-1" />
              Disconnected
            </Badge>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button variant="ghost" size="sm" onClick={clearError} className="ml-2">
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Authentication Section */}
      {!isConnected && (
        <Card>
          <CardHeader>
            <CardTitle>Admin Authentication</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={credentials.username}
                  onChange={(e) => setCredentials({
                    ...credentials,
                    username: e.target.value
                  })}
                  disabled={isLoading}
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={credentials.password}
                  onChange={(e) => setCredentials({
                    ...credentials,
                    password: e.target.value
                  })}
                  disabled={isLoading}
                />
              </div>
            </div>
            <Button onClick={handleAuthenticate} disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Authenticating...
                </>
              ) : (
                'Authenticate'
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Dashboard Content */}
      {isConnected && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="flex items-center p-6">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Admin User</p>
                  <p className="text-2xl font-bold">{session?.username}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center p-6">
                <Car className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Devices</p>
                  <p className="text-2xl font-bold">{deviceStats.total}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center p-6">
                <Activity className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Online</p>
                  <p className="text-2xl font-bold">{deviceStats.online}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center p-6">
                <MapPin className="h-8 w-8 text-red-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Real-Time Updates</p>
                  <p className="text-2xl font-bold">{positions.size}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="devices" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="devices">Devices</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="realtime">Real-Time</TabsTrigger>
              <TabsTrigger value="testing">Testing</TabsTrigger>
            </TabsList>

            <TabsContent value="devices" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Add New Device</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Device ID</Label>
                      <Input
                        value={newDevice.deviceid}
                        onChange={(e) => setNewDevice({
                          ...newDevice,
                          deviceid: e.target.value
                        })}
                        placeholder="Enter device ID"
                      />
                    </div>
                    <div>
                      <Label>Device Name</Label>
                      <Input
                        value={newDevice.devicename}
                        onChange={(e) => setNewDevice({
                          ...newDevice,
                          devicename: e.target.value
                        })}
                        placeholder="Enter device name"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button onClick={handleAddDevice} disabled={isLoading}>
                        Add Device
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Device List ({devices.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {devices.map((device) => (
                      <div key={device.deviceid} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <p className="font-medium">{device.devicename}</p>
                          <p className="text-sm text-muted-foreground">ID: {device.deviceid}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {positions.has(device.deviceid) && (
                            <Badge variant="default" className="bg-green-500">Live</Badge>
                          )}
                          <Badge variant={device.lastactivetime && 
                            new Date(device.lastactivetime).getTime() > Date.now() - 24 * 60 * 60 * 1000 
                            ? "default" : "secondary"}>
                            {device.lastactivetime && 
                            new Date(device.lastactivetime).getTime() > Date.now() - 24 * 60 * 60 * 1000 
                            ? "Online" : "Offline"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Add New User</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Username</Label>
                      <Input
                        value={newUser.username}
                        onChange={(e) => setNewUser({
                          ...newUser,
                          username: e.target.value
                        })}
                        placeholder="Enter username"
                      />
                    </div>
                    <div>
                      <Label>Password</Label>
                      <Input
                        type="password"
                        value={newUser.password}
                        onChange={(e) => setNewUser({
                          ...newUser,
                          password: e.target.value
                        })}
                        placeholder="Enter password"
                      />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser({
                          ...newUser,
                          email: e.target.value
                        })}
                        placeholder="Enter email"
                      />
                    </div>
                    <div>
                      <Label>Company Name</Label>
                      <Input
                        value={newUser.companyName}
                        onChange={(e) => setNewUser({
                          ...newUser,
                          companyName: e.target.value
                        })}
                        placeholder="Enter company name"
                      />
                    </div>
                  </div>
                  <Button onClick={handleAddUser} disabled={isLoading}>
                    Add User
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="realtime" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Real-Time Position Updates</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p>Status: <Badge variant={isSubscribed ? "default" : "secondary"}>
                          {isSubscribed ? "Active" : "Inactive"}
                        </Badge></p>
                        <p className="text-sm text-muted-foreground">
                          Last Update: {lastUpdate ? lastUpdate.toLocaleTimeString() : 'Never'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => subscribe(devices.map(d => d.deviceid))} disabled={isSubscribed}>
                          Start Updates
                        </Button>
                        <Button onClick={unsubscribe} disabled={!isSubscribed} variant="outline">
                          Stop Updates
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {Array.from(positions.entries()).map(([deviceId, update]) => (
                        <div key={deviceId} className="p-3 border rounded">
                          <div className="flex items-center justify-between">
                            <p className="font-medium">{deviceId}</p>
                            <Badge variant="default" className="bg-green-500">
                              <MapPin className="h-3 w-3 mr-1" />
                              Live
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            <p>Lat: {update.position.latitude.toFixed(6)}, Lng: {update.position.longitude.toFixed(6)}</p>
                            <p>Speed: {update.position.speed} km/h | Updated: {update.timestamp.toLocaleTimeString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="testing" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Connection Testing</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button onClick={testConnection} disabled={isLoading}>
                    <Settings className="h-4 w-4 mr-2" />
                    Test Connection
                  </Button>
                  
                  <Button onClick={loadDevices} disabled={isLoading}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reload Devices
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default UnifiedGP51Dashboard;
