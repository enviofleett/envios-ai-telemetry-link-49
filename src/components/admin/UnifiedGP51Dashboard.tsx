
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Settings, 
  Users, 
  Car, 
  Activity, 
  Shield,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { useUnifiedGP51Service } from '@/hooks/useUnifiedGP51Service';
import { useToast } from '@/hooks/use-toast';

const UnifiedGP51Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  
  const {
    authenticate,
    logout,
    disconnect,
    clearError,
    getConnectionHealth,
    testConnection,
    session,
    isConnected,
    isAuthenticated,
    currentUser,
    isLoading,
    error,
    users,
    devices,
    fetchUsers,
    fetchDevices
  } = useUnifiedGP51Service();

  const { toast } = useToast();

  // Check health on mount and periodically
  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const checkHealth = async () => {
    if (!isAuthenticated) return;
    
    setIsCheckingHealth(true);
    try {
      const health = await getConnectionHealth();
      setHealthStatus(health);
    } catch (error) {
      console.error('Health check failed:', error);
    } finally {
      setIsCheckingHealth(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      const result = await testConnection();
      
      toast({
        title: result.success ? "Connection Successful" : "Connection Failed",
        description: result.success ? 
          "GP51 connection is working properly" : 
          (result.error || 'Unknown error occurred'),
        variant: result.success ? "default" : "destructive"
      });
    } catch (error) {
      toast({
        title: "Test Failed",
        description: "Connection test encountered an error",
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = () => {
    if (isCheckingHealth) return <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />;
    if (isConnected && healthStatus?.isConnected) return <CheckCircle className="h-5 w-5 text-green-600" />;
    return <XCircle className="h-5 w-5 text-red-600" />;
  };

  const getStatusBadge = () => {
    if (isCheckingHealth) return <Badge variant="outline">Checking...</Badge>;
    if (isConnected && healthStatus?.isConnected) return <Badge variant="default" className="bg-green-500">Connected</Badge>;
    return <Badge variant="destructive">Disconnected</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="h-6 w-6 text-blue-600" />
              <div>
                <CardTitle>Unified GP51 Dashboard</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Complete GP51 platform integration and management
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {getStatusIcon()}
              {getStatusBadge()}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={clearError}>
                Dismiss
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Session Info */}
      {session && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Active Session</p>
                <p className="text-sm text-muted-foreground">
                  User: {session.username} | Connected: {session.isConnected ? 'Yes' : 'No'}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleTestConnection} disabled={isLoading}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Test Connection
                </Button>
                <Button variant="outline" size="sm" onClick={logout} disabled={isLoading}>
                  Logout
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Dashboard */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Connection Status</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {healthStatus ? `Response time: ${healthStatus.responseTime}ms` : 'No data'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{users.length}</div>
                <p className="text-xs text-muted-foreground">
                  GP51 user accounts
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Devices</CardTitle>
                <Car className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{devices.length}</div>
                <p className="text-xs text-muted-foreground">
                  Connected vehicles
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">User Management</h3>
            <Button onClick={fetchUsers} disabled={isLoading || !isAuthenticated}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Users
            </Button>
          </div>

          <Card>
            <CardContent className="pt-6">
              {users.length === 0 ? (
                <p className="text-center text-muted-foreground">No users found</p>
              ) : (
                <div className="space-y-2">
                  {users.map((user, index) => (
                    <div key={index} className="flex justify-between items-center p-3 border rounded">
                      <div>
                        <p className="font-medium">{user.showname}</p>
                        <p className="text-sm text-muted-foreground">{user.username}</p>
                      </div>
                      <Badge variant="outline">Type: {user.usertype}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devices" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Device Management</h3>
            <Button onClick={fetchDevices} disabled={isLoading || !isAuthenticated}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Devices
            </Button>
          </div>

          <Card>
            <CardContent className="pt-6">
              {devices.length === 0 ? (
                <p className="text-center text-muted-foreground">No devices found</p>
              ) : (
                <div className="space-y-2">
                  {devices.map((device, index) => (
                    <div key={index} className="flex justify-between items-center p-3 border rounded">
                      <div>
                        <p className="font-medium">{device.devicename}</p>
                        <p className="text-sm text-muted-foreground">ID: {device.deviceid}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline">Type: {device.devicetype}</Badge>
                        <Badge variant={device.status === 'online' ? 'default' : 'secondary'}>
                          {device.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">System Monitoring</h3>
            <Button onClick={checkHealth} disabled={isCheckingHealth}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isCheckingHealth ? 'animate-spin' : ''}`} />
              Check Health
            </Button>
          </div>

          {healthStatus && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Connection Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <Badge variant={healthStatus.isConnected ? 'default' : 'destructive'}>
                        {healthStatus.isConnected ? 'Connected' : 'Disconnected'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Token Valid:</span>
                      <Badge variant={healthStatus.tokenValid ? 'default' : 'destructive'}>
                        {healthStatus.tokenValid ? 'Valid' : 'Invalid'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Session Valid:</span>
                      <Badge variant={healthStatus.sessionValid ? 'default' : 'destructive'}>
                        {healthStatus.sessionValid ? 'Valid' : 'Invalid'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Response Time:</span>
                      <span>{healthStatus.responseTime}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Active Devices:</span>
                      <span>{healthStatus.activeDevices}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">System Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Last Check:</span>
                      <span className="text-sm">
                        {healthStatus.lastCheck ? new Date(healthStatus.lastCheck).toLocaleTimeString() : 'Never'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Errors:</span>
                      <span>{healthStatus.errors?.length || 0}</span>
                    </div>
                    {healthStatus.errors?.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-red-600">Recent Errors:</p>
                        <ul className="text-sm text-red-600 mt-1">
                          {healthStatus.errors.slice(0, 3).map((error: string, index: number) => (
                            <li key={index}>• {error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UnifiedGP51Dashboard;
