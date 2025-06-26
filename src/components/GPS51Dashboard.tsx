
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useToast } from "@/hooks/use-toast";
import { GPS51Device } from '@/types/gp51-unified';
import { gp51DataService } from '@/services/gp51/GP51DataService';

interface DashboardStats {
  totalDevices: number;
  onlineDevices: number;
  offlineDevices: number;
  lastSync: Date | null;
}

const GPS51Dashboard: React.FC = () => {
  const [devices, setDevices] = useState<GPS51Device[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalDevices: 0,
    onlineDevices: 0,
    offlineDevices: 0,
    lastSync: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const { toast } = useToast();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      console.log('🔄 Fetching GPS51 data...');
      
      // Get devices using the singleton service
      const response = await gp51DataService.getLiveVehicles();
      
      if (response && typeof response === 'object') {
        // Handle different response structures
        let deviceList: GPS51Device[] = [];
        let groupsList: any[] = [];
        
        if (Array.isArray(response)) {
          deviceList = response;
        } else if ('vehicles' in response && Array.isArray(response.vehicles)) {
          deviceList = response.vehicles;
        } else if ('data' in response) {
          if (Array.isArray(response.data)) {
            deviceList = response.data;
          } else if (response.data && Array.isArray(response.data.vehicles)) {
            deviceList = response.data.vehicles;
          }
        }

        // Handle groups data defensively
        groupsList = response.data?.groups || response.data || [];
        
        setDevices(deviceList);
        setGroups(groupsList);
        
        // Calculate stats
        const totalDevices = deviceList.length;
        const onlineDevices = deviceList.filter(device => 
          device.status === 'active' || device.status === 'online'
        ).length;
        
        setStats({
          totalDevices,
          onlineDevices,
          offlineDevices: totalDevices - onlineDevices,
          lastSync: new Date()
        });
        
        setLastUpdate(new Date());
        
        toast({
          title: "Data Updated",
          description: `Successfully loaded ${totalDevices} devices`,
        });
        
        console.log(`✅ Successfully loaded ${totalDevices} devices and ${groupsList.length} groups`);
      } else {
        console.warn('⚠️ Unexpected response format:', response);
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('❌ Error fetching GPS51 data:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to fetch data',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle groups data defensively
  const handleGroupsResponse = (response: any) => {
    return response.data?.groups || response.data || [];
  };

  useEffect(() => {
    fetchData();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (device: GPS51Device) => {
    const isOnline = device.status === 'active' || device.status === 'online';
    return (
      <Badge variant={isOnline ? "default" : "secondary"} className="ml-2">
        {isOnline ? (
          <>
            <CheckCircle className="w-3 h-3 mr-1" />
            Online
          </>
        ) : (
          <>
            <AlertCircle className="w-3 h-3 mr-1" />
            Offline
          </>
        )}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">GPS51 Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time fleet monitoring and management
          </p>
        </div>
        <Button onClick={fetchData} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDevices}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.onlineDevices}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Offline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.offlineDevices}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Sync</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              {lastUpdate ? (
                <>
                  <Clock className="w-4 h-4 inline mr-1" />
                  {lastUpdate.toLocaleTimeString()}
                </>
              ) : (
                'Never'
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Devices List */}
      <Card>
        <CardHeader>
          <CardTitle>Device Status</CardTitle>
          <CardDescription>
            Current status of all GPS tracking devices
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" />
              <span>Loading devices...</span>
            </div>
          ) : devices.length > 0 ? (
            <div className="space-y-2">
              {devices.map((device, index) => (
                <div key={device.deviceid || index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{device.devicename || 'Unknown Device'}</div>
                    <div className="text-sm text-muted-foreground">
                      ID: {device.deviceid} | Type: {device.devicetype || 'Unknown'}
                    </div>
                  </div>
                  {getStatusBadge(device)}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No devices found. Check your GP51 connection.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Groups Section */}
      {groups.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Device Groups</CardTitle>
            <CardDescription>
              Organized device groups from GP51
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {groups.map((group, index) => (
                <div key={group.id || index} className="p-4 border rounded-lg">
                  <div className="font-medium">{group.group_name || group.name || 'Unnamed Group'}</div>
                  <div className="text-sm text-muted-foreground">
                    {group.device_count || 0} devices
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GPS51Dashboard;
