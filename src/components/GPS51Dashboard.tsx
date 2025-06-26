
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, RefreshCw, Users, Car, Activity } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { gp51DataService } from '@/services/gp51/GP51DataService';
import type { GP51DeviceData, GP51Group } from '@/types/gp51-unified';

interface DashboardSummary {
  totalDevices: number;
  activeDevices: number;
  totalGroups: number;
  connectionStatus: "connected" | "disconnected" | "error";
  lastUpdate: Date;
}

interface GP51Device {
  deviceid: string;
  devicename: string;
  devicetype: string;
  status: string;
  lastactivetime: string;
}

const GPS51Dashboard: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary>({
    totalDevices: 0,
    activeDevices: 0,
    totalGroups: 0,
    connectionStatus: "disconnected",
    lastUpdate: new Date()
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<GP51Device[]>([]);
  const [groups, setGroups] = useState<GP51Group[]>([]);
  const { toast } = useToast();

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await gp51DataService.getDataDirectly();
      
      if (data.success && data.data) {
        const deviceData = Array.isArray(data.data) ? data.data : [];
        
        // Transform GP51DeviceData to GP51Device for legacy compatibility
        const transformedDevices: GP51Device[] = deviceData.map(device => ({
          deviceid: device.deviceId,
          devicename: device.deviceName,
          devicetype: device.deviceType || 'unknown',
          status: device.isActive ? 'active' : 'inactive',
          lastactivetime: typeof device.lastActiveTime === 'string' 
            ? device.lastActiveTime 
            : device.lastActiveTime?.toISOString() || new Date().toISOString()
        }));
        
        setDevices(transformedDevices);
        
        const dashboardSummary: DashboardSummary = {
          totalDevices: transformedDevices.length,
          activeDevices: transformedDevices.filter(d => d.status === 'active').length,
          totalGroups: data.groups?.length || 0,
          connectionStatus: "connected",
          lastUpdate: new Date()
        };
        
        setSummary(dashboardSummary);
        setGroups(data.groups || []);
        
        toast({
          title: "Success",
          description: `Loaded ${transformedDevices.length} devices successfully`,
        });
      } else {
        throw new Error(data.error || 'Failed to fetch data');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch dashboard data';
      setError(errorMessage);
      setSummary(prev => ({ ...prev, connectionStatus: "error" }));
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'connected':
        return 'bg-green-100 text-green-800';
      case 'inactive':
      case 'disconnected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getConnectionStatusIcon = () => {
    switch (summary.connectionStatus) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">GPS51 Dashboard</h1>
          <p className="text-gray-600">Monitor your fleet and device status</p>
        </div>
        <Button 
          onClick={fetchDashboardData} 
          disabled={isLoading}
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center text-red-700">
              <AlertCircle className="h-4 w-4 mr-2" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalDevices}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Devices</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{summary.activeDevices}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Device Groups</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalGroups}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connection Status</CardTitle>
            {getConnectionStatusIcon()}
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium capitalize">{summary.connectionStatus}</div>
            <div className="text-xs text-muted-foreground">
              Last updated: {summary.lastUpdate.toLocaleTimeString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Devices */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Devices</CardTitle>
          <CardDescription>
            Latest device information from GPS51
          </CardDescription>
        </CardHeader>
        <CardContent>
          {devices.length === 0 ? (
            <div className="text-center py-8">
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  Loading devices...
                </div>
              ) : (
                'No devices found. Try refreshing or importing data from GPS51.'
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {devices.slice(0, 10).map((device) => (
                <div key={device.deviceid} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div>
                      <div className="font-medium">{device.devicename}</div>
                      <div className="text-sm text-gray-600">ID: {device.deviceid}</div>
                      <div className="text-sm text-gray-600">Type: {device.devicetype}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(device.status)}>
                      {device.status}
                    </Badge>
                    <div className="text-sm text-gray-500">
                      {new Date(device.lastactivetime).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GPS51Dashboard;
