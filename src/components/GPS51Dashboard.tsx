
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { GP51DataService } from '@/services/gp51/GP51DataService';
import type { GP51Device, GP51Group } from '@/types/gp51';
import type { GP51DeviceData } from '@/types/gp51-unified';

interface DashboardSummary {
  totalDevices: number;
  activeDevices: number;
  lastUpdate: string;
  connectionStatus: "error" | "disconnected" | "connected";
}

const GPS51Dashboard: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary>({
    totalDevices: 0,
    activeDevices: 0,
    lastUpdate: 'Never',
    connectionStatus: 'disconnected'
  });
  const [devices, setDevices] = useState<GP51Device[]>([]);
  const [groups, setGroups] = useState<GP51Group[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dataService = new GP51DataService();

  // Transform GP51DeviceData to GP51Device
  const transformDeviceData = (deviceData: GP51DeviceData): GP51Device => ({
    deviceid: deviceData.deviceId,
    devicename: deviceData.deviceName,
    devicetype: deviceData.deviceType || 'unknown',
    status: deviceData.isActive ? 'active' : 'inactive',
    lastactivetime: typeof deviceData.lastActiveTime === 'string' 
      ? deviceData.lastActiveTime 
      : deviceData.lastActiveTime?.toISOString() || new Date().toISOString()
  });

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Fetching dashboard data...');
      
      // Get data from service
      const data = await dataService.getDataDirectly();
      
      if (data && data.length > 0) {
        // Transform the data to match expected format
        const transformedDevices: GP51Device[] = data.map(transformDeviceData);
        setDevices(transformedDevices);
        
        // Update summary
        const dashboardSummary: DashboardSummary = {
          totalDevices: transformedDevices.length,
          activeDevices: transformedDevices.filter(d => d.status === 'active').length,
          lastUpdate: new Date().toLocaleString(),
          connectionStatus: "connected" as const
        };
        
        setSummary(dashboardSummary);
        
        console.log(`✅ Dashboard data loaded: ${transformedDevices.length} devices`);
      } else {
        setSummary(prev => ({
          ...prev,
          connectionStatus: "disconnected" as const,
          lastUpdate: new Date().toLocaleString()
        }));
        console.log('⚠️ No data received from GP51');
      }
    } catch (err) {
      console.error('❌ Dashboard data fetch failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
      setSummary(prev => ({
        ...prev,
        connectionStatus: "error" as const,
        lastUpdate: new Date().toLocaleString()
      }));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-100 text-green-800';
      case 'disconnected': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle className="h-4 w-4" />;
      case 'disconnected': return <AlertTriangle className="h-4 w-4" />;
      case 'error': return <AlertTriangle className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">GPS51 Dashboard</h1>
        <Button 
          onClick={fetchDashboardData} 
          disabled={isLoading}
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Connection Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className={`${getStatusColor(summary.connectionStatus)} flex items-center gap-1`}>
              {getStatusIcon(summary.connectionStatus)}
              {summary.connectionStatus.charAt(0).toUpperCase() + summary.connectionStatus.slice(1)}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalDevices}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Devices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{summary.activeDevices}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Last Update</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">{summary.lastUpdate}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Device List</CardTitle>
        </CardHeader>
        <CardContent>
          {devices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {isLoading ? 'Loading devices...' : 'No devices found'}
            </div>
          ) : (
            <div className="space-y-2">
              {devices.map((device) => (
                <div key={device.deviceid} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium">{device.devicename}</div>
                    <div className="text-sm text-muted-foreground">ID: {device.deviceid}</div>
                  </div>
                  <div className="text-right">
                    <Badge variant={device.status === 'active' ? 'default' : 'secondary'}>
                      {device.status}
                    </Badge>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(device.lastactivetime).toLocaleString()}
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
