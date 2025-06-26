import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, RefreshCw, Car, Users, Database, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { gp51DataService } from '@/services/gp51/GP51DataService';
import type { GP51Device, GP51Group } from '@/types/gp51-unified';

interface DashboardSummary {
  totalDevices: number;
  activeDevices: number;
  totalGroups: number;
  connectionStatus: "connected" | "disconnected" | "error";
  lastSync: string;
}

const GPS51Dashboard: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary>({
    totalDevices: 0,
    activeDevices: 0,
    totalGroups: 0,
    connectionStatus: "disconnected",
    lastSync: "Never"
  });
  const [devices, setDevices] = useState<GP51Device[]>([]);
  const [groups, setGroups] = useState<GP51Group[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get devices data
      const deviceResponse = await gp51DataService.getDataDirectly();
      let deviceData: GP51Device[] = [];
      
      if (deviceResponse.success && deviceResponse.data) {
        deviceData = Array.isArray(deviceResponse.data) ? deviceResponse.data : [];
      }

      // Get groups data with defensive access
      const groupResponse = await gp51DataService.getDataDirectly();
      let groupData: GP51Group[] = [];
      
      if (groupResponse.success) {
        // Handle different possible response structures for groups
        groupData = groupResponse.data?.groups || 
                   (Array.isArray(groupResponse.data) ? groupResponse.data : []) ||
                   [];
      }

      // Update summary
      const dashboardSummary: DashboardSummary = {
        totalDevices: deviceData.length,
        activeDevices: deviceData.filter(d => d.status === 'active').length,
        totalGroups: groupData.length,
        connectionStatus: deviceResponse.success ? "connected" : "error",
        lastSync: new Date().toLocaleString()
      };

      setSummary(dashboardSummary);
      setDevices(deviceData);
      setGroups(groupData);

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load dashboard data';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-500';
      case 'disconnected': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected': return 'Connected';
      case 'disconnected': return 'Disconnected';
      case 'error': return 'Error';
      default: return 'Unknown';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">GPS51 Dashboard</h1>
        <Button onClick={loadDashboardData} disabled={isLoading} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
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
            <CardTitle className="text-sm font-medium">Groups</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalGroups}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connection Status</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(summary.connectionStatus)}`} />
              <span className="text-sm font-medium">{getStatusText(summary.connectionStatus)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Devices */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Devices</CardTitle>
        </CardHeader>
        <CardContent>
          {devices.length === 0 ? (
            <p className="text-muted-foreground">No devices found</p>
          ) : (
            <div className="space-y-2">
              {devices.slice(0, 10).map((device) => (
                <div key={device.deviceid} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <span className="font-medium">{device.devicename}</span>
                    <span className="text-sm text-muted-foreground ml-2">({device.deviceid})</span>
                  </div>
                  <Badge variant={device.status === 'active' ? 'default' : 'secondary'}>
                    {device.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Groups Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Groups Overview</CardTitle>
        </CardHeader>
        <CardContent>
          {groups.length === 0 ? (
            <p className="text-muted-foreground">No groups found</p>
          ) : (
            <div className="space-y-2">
              {groups.slice(0, 5).map((group) => (
                <div key={group.id} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <span className="font-medium">{group.group_name}</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      ({group.device_count} devices)
                    </span>
                  </div>
                  <Badge variant="outline">{group.device_count}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="text-center text-sm text-muted-foreground">
        Last synchronized: {summary.lastSync}
      </div>
    </div>
  );
};

export default GPS51Dashboard;
