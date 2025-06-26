
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Activity, Truck, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { gp51DataService } from '@/services/gp51/GP51DataService';
import type { GPS51Device, GP51LiveVehiclesResponse } from '@/types/gp51-unified';

const GPS51Dashboard: React.FC = () => {
  const [devices, setDevices] = useState<GPS51Device[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');

  // Helper function to get device status safely
  const getDeviceStatus = (device: GPS51Device): string => {
    // Try multiple possible status properties with fallbacks
    if ('status' in device && device.status) return device.status as string;
    if ('connectionStatus' in device && device.connectionStatus) return device.connectionStatus as string;
    if (typeof device.isActive === 'boolean') {
      return device.isActive ? 'online' : 'offline';
    }
    return 'unknown';
  };

  const isDeviceOnline = (device: GPS51Device): boolean => {
    const status = getDeviceStatus(device);
    return ['online', 'connected', 'active'].includes(status.toLowerCase());
  };

  const fetchLiveVehicles = async () => {
    setIsLoading(true);
    try {
      const response = await gp51DataService.getLiveVehicles();
      
      if (response && typeof response === 'object') {
        // Handle different response structures
        const responseData = response as any;
        const vehicles = responseData.vehicles || responseData.data || [];
        const vehicleCount = vehicles.length;
        const activeVehicles = vehicles.filter((v: any) => v.isActive || getDeviceStatus(v) === 'online');

        setDevices(vehicles);
        
        // Handle groups data
        const groupsData = responseData.groups || responseData.data?.groups || responseData.data || [];
        setGroups(groupsData);
        
        setLastSync(new Date());
        setConnectionStatus('connected');
        
        toast.success(`Loaded ${vehicleCount} vehicles, ${activeVehicles.length} active`);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Failed to fetch live vehicles:', error);
      setConnectionStatus('disconnected');
      toast.error('Failed to fetch vehicle data');
    } finally {
      setIsLoading(false);
    }
  };

  const onlineDevices = devices.filter(d => isDeviceOnline(d));
  const offlineDevices = devices.filter(d => !isDeviceOnline(d));

  useEffect(() => {
    fetchLiveVehicles();
  }, []);

  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'online':
      case 'connected':
      case 'active':
        return 'bg-green-500';
      case 'offline':
      case 'disconnected':
      case 'inactive':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const ConnectionStatusBadge = () => {
    const getStatusConfig = () => {
      switch (connectionStatus) {
        case 'connected':
          return { color: 'bg-green-500', icon: CheckCircle, text: 'Connected' };
        case 'disconnected':
          return { color: 'bg-red-500', icon: AlertTriangle, text: 'Disconnected' };
        default:
          return { color: 'bg-yellow-500', icon: Activity, text: 'Checking...' };
      }
    };

    const { color, icon: Icon, text } = getStatusConfig();
    
    return (
      <Badge className={`${color} text-white`}>
        <Icon className="w-3 h-3 mr-1" />
        {text}
      </Badge>
    );
  };

  const onlineDevicesCount = onlineDevices.length;
  const offlineDevicesCount = offlineDevices.length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">GPS51 Dashboard</h1>
          <p className="text-gray-600 mt-1">Real-time vehicle monitoring and management</p>
        </div>
        <div className="flex items-center gap-4">
          <ConnectionStatusBadge />
          <Button 
            onClick={fetchLiveVehicles} 
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Syncing...' : 'Refresh Data'}
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{devices.length}</div>
            <p className="text-xs text-muted-foreground">
              Registered devices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online Vehicles</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{onlineDevicesCount}</div>
            <p className="text-xs text-muted-foreground">
              Currently active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Offline Vehicles</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{offlineDevicesCount}</div>
            <p className="text-xs text-muted-foreground">
              Not responding
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Groups</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{groups.length}</div>
            <p className="text-xs text-muted-foreground">
              Device groups
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sync Status */}
      {lastSync && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Last Synchronization</p>
                <p className="text-xs text-muted-foreground">
                  {lastSync.toLocaleString()}
                </p>
              </div>
              <Badge variant="outline" className="text-green-600 border-green-600">
                Up to date
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Devices List */}
      <Card>
        <CardHeader>
          <CardTitle>Vehicle List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {devices.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Truck className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>No vehicles found</p>
                <p className="text-sm">Click "Refresh Data" to sync with GPS51</p>
              </div>
            ) : (
              devices.map((device) => {
                const status = getDeviceStatus(device);
                return (
                  <div key={device.deviceId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${getStatusBadgeColor(status)}`} />
                      <div>
                        <p className="font-medium">{device.deviceName}</p>
                        <p className="text-sm text-gray-500">
                          ID: {device.deviceId} | Type: {device.deviceType || 'Unknown'}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={getStatusBadgeColor(status) === 'bg-green-500' ? 'text-green-600 border-green-600' : 
                                getStatusBadgeColor(status) === 'bg-red-500' ? 'text-red-600 border-red-600' : 
                                'text-gray-600 border-gray-600'}
                    >
                      {status}
                    </Badge>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GPS51Dashboard;
