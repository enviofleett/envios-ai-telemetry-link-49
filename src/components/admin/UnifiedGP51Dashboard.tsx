
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useUnifiedGP51Service } from '@/hooks/useUnifiedGP51Service';
import { useToast } from '@/hooks/use-toast';
import GP51HealthIndicator from './GP51HealthIndicator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  RefreshCw, 
  Database, 
  Activity, 
  Users, 
  Car,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';

const UnifiedGP51Dashboard: React.FC = () => {
  const {
    healthStatus,
    devices,
    groups,
    metrics,
    isLoading,
    error,
    isAuthenticated,
    session,
    refreshAllData,
    fetchDevices,
    getConnectionHealth
  } = useUnifiedGP51Service();

  const { toast } = useToast();
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      handleRefreshAll();
    }
  }, [isAuthenticated]);

  const handleRefreshAll = async () => {
    try {
      await refreshAllData();
      setLastRefresh(new Date());
      toast({
        title: "Data Refreshed",
        description: "All GP51 data has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh GP51 data. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRefreshDevices = async () => {
    try {
      await fetchDevices();
      toast({
        title: "Devices Refreshed",
        description: "Device list has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Device Refresh Failed",
        description: "Failed to refresh device list. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleHealthCheck = async () => {
    try {
      await getConnectionHealth();
      toast({
        title: "Health Check Complete",
        description: "Connection health has been verified.",
      });
    } catch (error) {
      toast({
        title: "Health Check Failed",
        description: "Failed to check connection health. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Please authenticate with GP51 first to access the dashboard features.
        </AlertDescription>
      </Alert>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Error:</strong> {error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Unified GP51 Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive GP51 fleet management and monitoring
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lastRefresh && (
            <span className="text-sm text-muted-foreground">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </span>
          )}
          <Button
            onClick={handleRefreshAll}
            disabled={isLoading}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh All
          </Button>
        </div>
      </div>

      {/* Health Indicator */}
      <GP51HealthIndicator />

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{devices?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Registered devices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Devices</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {metrics ? (metrics.deviceCount || metrics.activeDevices || 0) : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Moving Vehicles</CardTitle>
            <Car className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {metrics ? (metrics.movingVehicles || 0) : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              In motion
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Groups</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{groups?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Device groups
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="devices" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="groups">Groups</TabsTrigger>
          <TabsTrigger value="health">System Health</TabsTrigger>
        </TabsList>

        <TabsContent value="devices" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Device Management</h3>
            <Button onClick={handleRefreshDevices} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Devices
            </Button>
          </div>

          {devices && devices.length > 0 ? (
            <div className="grid gap-4">
              {devices.slice(0, 10).map((device) => (
                <Card key={device.deviceid}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{device.devicename}</h4>
                        <p className="text-sm text-muted-foreground">ID: {device.deviceid}</p>
                        <p className="text-sm text-muted-foreground">
                          Type: {device.devicetype}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant={device.isActive ? "default" : "secondary"}>
                          {device.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          Last seen: {device.lastactivetime ? 
                            new Date(device.lastactivetime).toLocaleString() : 'Never'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {devices.length > 10 && (
                <p className="text-sm text-muted-foreground text-center">
                  Showing 10 of {devices.length} devices
                </p>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No devices found</p>
                <Button onClick={handleRefreshDevices} className="mt-4" variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Devices
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="groups" className="space-y-4">
          <h3 className="text-lg font-medium">Device Groups</h3>
          
          {groups && groups.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {groups.map((group) => (
                <Card key={group.groupid}>
                  <CardHeader>
                    <CardTitle className="text-base">{group.groupname}</CardTitle>
                    <CardDescription>
                      Group ID: {group.groupid}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Devices:</span>
                      <Badge variant="outline">{group.devices?.length || 0}</Badge>
                    </div>
                    {group.remark && (
                      <p className="text-sm text-muted-foreground mt-2">{group.remark}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No groups found</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="health" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">System Health</h3>
            <Button onClick={handleHealthCheck} variant="outline" size="sm">
              <Activity className="h-4 w-4 mr-2" />
              Check Health
            </Button>
          </div>

          {healthStatus ? (
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {healthStatus.isHealthy ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    )}
                    Connection Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium">Status:</span>
                      <Badge className="ml-2" variant={healthStatus.isHealthy ? "default" : "destructive"}>
                        {healthStatus.status}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Connected:</span>
                      <Badge className="ml-2" variant={healthStatus.isConnected ? "default" : "secondary"}>
                        {healthStatus.isConnected ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Session Valid:</span>
                      <Badge className="ml-2" variant={healthStatus.sessionValid ? "default" : "secondary"}>
                        {healthStatus.sessionValid ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Active Devices:</span>
                      <span className="ml-2 font-mono">{healthStatus.activeDevices}</span>
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-sm font-medium">Last Check:</span>
                    <span className="ml-2 text-sm text-muted-foreground">
                      {healthStatus.lastCheck.toLocaleString()}
                    </span>
                  </div>

                  {healthStatus.errorMessage && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{healthStatus.errorMessage}</AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {metrics && (
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Response Time:</span>
                        <span className="ml-2">{metrics.averageResponseTime}ms</span>
                      </div>
                      <div>
                        <span className="font-medium">Error Rate:</span>
                        <span className="ml-2">{(metrics.errorRate * 100).toFixed(2)}%</span>
                      </div>
                      <div>
                        <span className="font-medium">Data Quality:</span>
                        <span className="ml-2">{(metrics.dataQuality * 100).toFixed(1)}%</span>
                      </div>
                      <div>
                        <span className="font-medium">Utilization:</span>
                        <span className="ml-2">{metrics.utilizationRate}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No health data available</p>
                <Button onClick={handleHealthCheck} className="mt-4" variant="outline">
                  <Activity className="h-4 w-4 mr-2" />
                  Check Health
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UnifiedGP51Dashboard;
