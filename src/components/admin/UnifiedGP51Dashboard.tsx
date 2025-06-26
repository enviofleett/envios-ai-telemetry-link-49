
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  RefreshCw, 
  Activity, 
  Users, 
  MapPin, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  Settings,
  Info
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUnifiedGP51Service } from '@/hooks/useUnifiedGP51Service';
import type { GP51DeviceData, GP51Group } from '@/types/gp51-unified';
import GroupGrid from '../GroupGrid';
import GP51DiagnosticsPanel from '../DiagnosticPanel';

interface DashboardMetrics {
  totalDevices: number;
  activeDevices: number;
  inactiveDevices: number;
  totalGroups: number;
  lastSync: Date;
  connectionHealth: 'healthy' | 'warning' | 'error';
}

const UnifiedGP51Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalDevices: 0,
    activeDevices: 0,
    inactiveDevices: 0,
    totalGroups: 0,
    lastSync: new Date(),
    connectionHealth: 'error'
  });
  
  const [devices, setDevices] = useState<GP51DeviceData[]>([]);
  const [groups, setGroups] = useState<GP51Group[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { toast } = useToast();
  const {
    isConnected,
    isAuthenticated,
    fetchDevices,
    getConnectionHealth,
    connect
  } = useUnifiedGP51Service();

  const calculateMetrics = (deviceData: GP51DeviceData[], groupData: GP51Group[]): DashboardMetrics => {
    const activeDevices = deviceData.filter(d => d.isActive).length;
    
    return {
      totalDevices: deviceData.length,
      activeDevices,
      inactiveDevices: deviceData.length - activeDevices,
      totalGroups: groupData.length,
      lastSync: new Date(),
      connectionHealth: isConnected ? 'healthy' : 'error'
    };
  };

  const fetchAllData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch devices
      await fetchDevices();
      
      // Get connection health
      const health = await getConnectionHealth();
      
      // Update metrics
      const newMetrics = calculateMetrics(devices, groups);
      setMetrics(newMetrics);
      
      toast({
        title: "Data Refreshed",
        description: `Loaded ${devices.length} devices and ${groups.length} groups`,
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data';
      setError(errorMessage);
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      const success = await connect();
      if (success) {
        await fetchAllData();
        toast({
          title: "Connected",
          description: "Successfully connected to GP51",
        });
      } else {
        throw new Error('Connection failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Connection failed';
      setError(errorMessage);
      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getHealthIcon = () => {
    switch (metrics.connectionHealth) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
  };

  const getHealthColor = () => {
    switch (metrics.connectionHealth) {
      case 'healthy':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      default:
        return 'text-red-600';
    }
  };

  const getStatusBadge = (device: GP51DeviceData) => {
    const isActive = device.isActive;
    return (
      <Badge variant={isActive ? "default" : "secondary"}>
        {isActive ? 'Active' : 'Inactive'}
      </Badge>
    );
  };

  const formatDate = (dateValue: string | Date | null | undefined) => {
    if (!dateValue) return 'Never';
    
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString();
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchAllData();
    }
  }, [isAuthenticated]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Unified GP51 Dashboard</h1>
          <p className="text-gray-600">Comprehensive GP51 system management and monitoring</p>
        </div>
        <div className="flex space-x-2">
          {!isConnected && (
            <Button onClick={handleConnect} disabled={isLoading}>
              <Activity className="h-4 w-4 mr-2" />
              Connect
            </Button>
          )}
          <Button onClick={fetchAllData} disabled={isLoading || !isConnected} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Connection Status Alert */}
      {!isConnected && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Not Connected:</strong> Please establish a connection to GP51 to access live data.
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Error:</strong> {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalDevices}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Devices</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.activeDevices}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Devices</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics.inactiveDevices}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Device Groups</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalGroups}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connection Health</CardTitle>
            {getHealthIcon()}
          </CardHeader>
          <CardContent>
            <div className={`text-sm font-medium capitalize ${getHealthColor()}`}>
              {metrics.connectionHealth}
            </div>
            <div className="text-xs text-muted-foreground">
              Last sync: {metrics.lastSync.toLocaleTimeString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="groups">Groups</TabsTrigger>
          <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
                <CardDescription>Current GP51 system status and health</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Connection Status</span>
                  <Badge variant={isConnected ? "default" : "destructive"}>
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Authentication</span>
                  <Badge variant={isAuthenticated ? "default" : "secondary"}>
                    {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Data Freshness</span>
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="h-4 w-4 mr-1" />
                    {metrics.lastSync.toLocaleTimeString()}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common GP51 management actions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full" onClick={fetchAllData} disabled={isLoading || !isConnected}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh All Data
                </Button>
                <Button className="w-full" variant="outline" disabled={!isConnected}>
                  <MapPin className="h-4 w-4 mr-2" />
                  View Live Positions
                </Button>
                <Button className="w-full" variant="outline" disabled={!isConnected}>
                  <Settings className="h-4 w-4 mr-2" />
                  Manage Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="devices" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Device List ({devices.length})</CardTitle>
              <CardDescription>All devices managed by GP51</CardDescription>
            </CardHeader>
            <CardContent>
              {devices.length === 0 ? (
                <div className="text-center py-8">
                  <Database className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">No devices found</p>
                  <p className="text-sm text-gray-500">
                    {isConnected ? 'Try refreshing the data' : 'Connect to GP51 to view devices'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {devices.slice(0, 20).map((device) => (
                    <div key={device.deviceId} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{device.deviceName}</h4>
                          <p className="text-sm text-gray-600">ID: {device.deviceId}</p>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                            <span>Type: {device.deviceType || 'Unknown'}</span>
                            {device.groupName && <span>Group: {device.groupName}</span>}
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          {getStatusBadge(device)}
                          <div className="text-right text-sm">
                            <div className="text-gray-500">Last Active</div>
                            <div className="font-medium">{formatDate(device.lastActiveTime)}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="groups" className="space-y-6">
          <GroupGrid 
            groups={groups}
            loading={isLoading}
            onRefresh={fetchAllData}
          />
        </TabsContent>

        <TabsContent value="diagnostics" className="space-y-6">
          <GP51DiagnosticsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UnifiedGP51Dashboard;
