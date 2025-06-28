import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, CheckCircle, XCircle, AlertTriangle, Activity, Database, Users, MapPin } from 'lucide-react';
import { useUnifiedGP51Service } from '@/hooks/useUnifiedGP51Service';
import type { GP51HealthStatus, GP51Device, GP51Group } from '@/types/gp51-unified';
import { formatTimeString } from '@/types/gp51-unified';

const UnifiedGP51Dashboard: React.FC = () => {
  const {
    healthStatus,
    devices,
    groups,
    loading,
    isLoading,
    devicesLoading,
    error,
    isAuthenticated,
    session,
    authenticate,
    testConnection,
    disconnect,
    getConnectionHealth,
    fetchDevices,
    refreshAllData
  } = useUnifiedGP51Service();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  const handleAuthenticate = async () => {
    if (!username || !password) return;
    
    setIsConnecting(true);
    try {
      await authenticate(username, password);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    await disconnect();
    setUsername('');
    setPassword('');
  };

  const getStatusIcon = (status?: GP51HealthStatus) => {
    if (!status) return <XCircle className="h-5 w-5 text-gray-400" />;
    
    if (status.isConnected) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    } else {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusBadge = (status?: GP51HealthStatus) => {
    if (!status) return <Badge variant="secondary">Unknown</Badge>;
    
    if (status.isConnected) {
      return <Badge className="bg-green-100 text-green-800">Connected</Badge>;
    } else {
      return <Badge variant="destructive">Disconnected</Badge>;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto p-6 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>GP51 Authentication</CardTitle>
            <CardDescription>
              Connect to your GP51 tracking system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-2 border rounded-md"
                placeholder="Enter your GP51 username"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 border rounded-md"
                placeholder="Enter your GP51 password"
              />
            </div>
            
            {error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <Button 
              onClick={handleAuthenticate} 
              disabled={isConnecting || !username || !password}
              className="w-full"
            >
              {isConnecting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                'Connect to GP51'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fixed: Handle missing properties with fallbacks
  const isSessionValid = healthStatus?.sessionValid || false;
  const hasActiveSession = isSessionValid || Boolean(session);
  const activeDevicesCount = healthStatus?.activeDevices || devices.length;
  const errorMessage = healthStatus?.errorMessage || healthStatus?.lastError || healthStatus?.error || error;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Unified GP51 Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Complete GP51 integration management and monitoring
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusIcon(healthStatus)}
          {getStatusBadge(healthStatus)}
        </div>
      </div>

      {/* Connection Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connection Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {healthStatus?.isConnected ? 'Online' : 'Offline'}
            </div>
            <p className="text-xs text-muted-foreground">
              Session: {hasActiveSession ? 'Active' : 'Inactive'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Devices</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeDevicesCount}</div>
            <p className="text-xs text-muted-foreground">
              Total devices monitored
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Device Groups</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{groups.length}</div>
            <p className="text-xs text-muted-foreground">
              Organized groups
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {healthStatus?.responseTime || 0}ms
            </div>
            <p className="text-xs text-muted-foreground">
              Average API response
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {errorMessage}
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="groups">Groups</TabsTrigger>
          <TabsTrigger value="health">Health</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>System Overview</CardTitle>
                  <CardDescription>
                    Current status of your GP51 integration
                  </CardDescription>
                </div>
                <Button onClick={refreshAllData} disabled={isLoading} variant="outline">
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh All
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm font-medium">Authentication Status</div>
                  <Badge variant={isAuthenticated ? 'default' : 'destructive'}>
                    {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Session Status</div>
                  <Badge variant={hasActiveSession ? 'default' : 'secondary'}>
                    {hasActiveSession ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>

              {healthStatus && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Last Health Check</div>
                  <div className="text-sm text-gray-600">
                    {formatTimeString(healthStatus.lastCheck)}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devices" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Connected Devices</CardTitle>
                  <CardDescription>
                    Manage and monitor your GP51 devices
                  </CardDescription>
                </div>
                <Button onClick={fetchDevices} disabled={devicesLoading} variant="outline">
                  <RefreshCw className={`h-4 w-4 mr-2 ${devicesLoading ? 'animate-spin' : ''}`} />
                  Refresh Devices
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {devicesLoading ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p>Loading devices...</p>
                </div>
              ) : devices.length > 0 ? (
                <div className="space-y-2">
                  {devices.slice(0, 10).map((device) => (
                    <div key={device.deviceid} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{device.devicename}</div>
                        <div className="text-sm text-gray-600">ID: {device.deviceid}</div>
                      </div>
                      <Badge variant={device.isfree === 1 ? 'default' : 'secondary'}>
                        {device.isfree === 1 ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  ))}
                  {devices.length > 10 && (
                    <div className="text-center text-sm text-gray-600 pt-2">
                      And {devices.length - 10} more devices...
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-600">
                  No devices found. Try refreshing or check your connection.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="groups" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Device Groups</CardTitle>
              <CardDescription>
                Organize and manage device groups
              </CardDescription>
            </CardHeader>
            <CardContent>
              {groups.length > 0 ? (
                <div className="space-y-2">
                  {groups.map((group) => (
                    <div key={group.groupid} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{group.groupname}</div>
                        <div className="text-sm text-gray-600">
                          {group.devices?.length || 0} devices
                        </div>
                      </div>
                      <Badge variant="outline">
                        Group {group.groupid}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-600">
                  No groups found. Groups will appear here when devices are loaded.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Connection Health</CardTitle>
                  <CardDescription>
                    Monitor GP51 API connection status and performance
                  </CardDescription>
                </div>
                <Button onClick={getConnectionHealth} disabled={loading} variant="outline">
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Check Health
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {healthStatus ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Connection Quality</div>
                      <div className="flex items-center space-x-2">
                        <div className="capitalize">{healthStatus.connectionQuality}</div>
                        <Badge variant={
                          healthStatus.connectionQuality === 'excellent' ? 'default' :
                          healthStatus.connectionQuality === 'good' ? 'secondary' : 'destructive'
                        }>
                          {healthStatus.connectionQuality}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Error Count</div>
                      <div className="text-2xl font-bold">{healthStatus.errorCount}</div>
                    </div>
                  </div>

                  {healthStatus.lastError && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Last Error: {healthStatus.lastError}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-600">
                  Click "Check Health" to run a connection health check.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UnifiedGP51Dashboard;
