
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { 
  Smartphone, 
  Wifi, 
  WifiOff, 
  Download, 
  Upload, 
  Bell, 
  Settings, 
  Cloud,
  Battery,
  Signal,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface MobileDevice {
  id: string;
  deviceName: string;
  platform: 'ios' | 'android';
  version: string;
  lastSeen: string;
  status: 'online' | 'offline' | 'syncing';
  batteryLevel: number;
  signalStrength: number;
  syncEnabled: boolean;
  offlineCapable: boolean;
}

interface MobileIntegrationSettings {
  pushNotifications: boolean;
  backgroundSync: boolean;
  offlineMode: boolean;
  dataCompression: boolean;
  wifiOnly: boolean;
  syncInterval: number;
}

const GP51MobileIntegration: React.FC = () => {
  const [activeTab, setActiveTab] = useState('devices');
  const [settings, setSettings] = useState<MobileIntegrationSettings>({
    pushNotifications: true,
    backgroundSync: true,
    offlineMode: true,
    dataCompression: true,
    wifiOnly: false,
    syncInterval: 15
  });

  const queryClient = useQueryClient();

  const { data: mobileDevices, isLoading } = useQuery({
    queryKey: ['mobile-devices'],
    queryFn: async (): Promise<MobileDevice[]> => {
      // Mock data - in real implementation, this would fetch from your mobile device registry
      return [
        {
          id: '1',
          deviceName: 'Fleet Manager iPhone',
          platform: 'ios',
          version: '17.0',
          lastSeen: new Date().toISOString(),
          status: 'online',
          batteryLevel: 85,
          signalStrength: 4,
          syncEnabled: true,
          offlineCapable: true
        },
        {
          id: '2',
          deviceName: 'Driver Android',
          platform: 'android',
          version: '14.0',
          lastSeen: new Date(Date.now() - 5 * 60000).toISOString(),
          status: 'syncing',
          batteryLevel: 42,
          signalStrength: 3,
          syncEnabled: true,
          offlineCapable: true
        },
        {
          id: '3',
          deviceName: 'Supervisor Tablet',
          platform: 'android',
          version: '13.0',
          lastSeen: new Date(Date.now() - 30 * 60000).toISOString(),
          status: 'offline',
          batteryLevel: 0,
          signalStrength: 0,
          syncEnabled: false,
          offlineCapable: false
        }
      ];
    },
  });

  const { data: syncStats } = useQuery({
    queryKey: ['mobile-sync-stats'],
    queryFn: async () => {
      // Mock mobile sync statistics
      return {
        totalDevices: mobileDevices?.length || 0,
        onlineDevices: mobileDevices?.filter(d => d.status === 'online').length || 0,
        syncingDevices: mobileDevices?.filter(d => d.status === 'syncing').length || 0,
        offlineDevices: mobileDevices?.filter(d => d.status === 'offline').length || 0,
        lastSyncTime: new Date().toISOString(),
        pendingNotifications: 3,
        dataUsage: 245.6 // MB
      };
    },
    enabled: !!mobileDevices
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: Partial<MobileIntegrationSettings>) => {
      // Mock settings update
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mobile-sync-stats'] });
    },
  });

  const triggerSyncMutation = useMutation({
    mutationFn: async (deviceId: string) => {
      // Mock sync trigger
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mobile-devices'] });
    },
  });

  const handleSettingChange = (key: keyof MobileIntegrationSettings, value: boolean | number) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    updateSettingsMutation.mutate({ [key]: value });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'syncing':
        return <Cloud className="h-5 w-5 text-blue-500 animate-pulse" />;
      case 'offline':
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getSignalBars = (strength: number) => {
    return Array.from({ length: 4 }, (_, i) => (
      <div
        key={i}
        className={`w-1 h-3 rounded-sm ${
          i < strength ? 'bg-green-500' : 'bg-gray-300'
        }`}
      />
    ));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mobile Integration Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Smartphone className="h-5 w-5 text-blue-600" />
                <span>Mobile App Integration</span>
              </CardTitle>
              <CardDescription>
                Manage mobile device synchronization and offline capabilities
              </CardDescription>
            </div>
            <Badge variant="default">
              {syncStats?.onlineDevices || 0} Online
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center p-4 bg-blue-50 rounded-lg">
              <Smartphone className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <div className="font-semibold text-blue-800">Total Devices</div>
                <div className="text-sm text-blue-600">{syncStats?.totalDevices || 0} registered</div>
              </div>
            </div>
            <div className="flex items-center p-4 bg-green-50 rounded-lg">
              <Wifi className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <div className="font-semibold text-green-800">Online</div>
                <div className="text-sm text-green-600">{syncStats?.onlineDevices || 0} connected</div>
              </div>
            </div>
            <div className="flex items-center p-4 bg-yellow-50 rounded-lg">
              <Cloud className="h-8 w-8 text-yellow-600 mr-3" />
              <div>
                <div className="font-semibold text-yellow-800">Syncing</div>
                <div className="text-sm text-yellow-600">{syncStats?.syncingDevices || 0} in progress</div>
              </div>
            </div>
            <div className="flex items-center p-4 bg-red-50 rounded-lg">
              <WifiOff className="h-8 w-8 text-red-600 mr-3" />
              <div>
                <div className="font-semibold text-red-800">Offline</div>
                <div className="text-sm text-red-600">{syncStats?.offlineDevices || 0} disconnected</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="sync">Sync Status</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="devices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Registered Mobile Devices</CardTitle>
              <CardDescription>Devices connected to the GP51 sync system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mobileDevices?.map((device) => (
                  <div key={device.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(device.status)}
                      <div>
                        <div className="font-medium">{device.deviceName}</div>
                        <div className="text-sm text-gray-500">
                          {device.platform} {device.version} • Last seen {new Date(device.lastSeen).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Battery className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{device.batteryLevel}%</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Signal className="h-4 w-4 text-gray-500" />
                        <div className="flex space-x-0.5">
                          {getSignalBars(device.signalStrength)}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => triggerSyncMutation.mutate(device.id)}
                        disabled={device.status === 'offline'}
                      >
                        Sync Now
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sync" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Synchronization Status</CardTitle>
              <CardDescription>Real-time sync progress and statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Data Usage Today</span>
                      <span className="text-sm text-gray-600">{syncStats?.dataUsage || 0} MB</span>
                    </div>
                    <Progress value={65} className="mb-2" />
                    <div className="text-xs text-gray-500">65% of daily limit</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Sync Success Rate</span>
                      <span className="text-sm text-gray-600">98.5%</span>
                    </div>
                    <Progress value={98.5} className="mb-2" />
                    <div className="text-xs text-gray-500">Last 24 hours</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Recent Sync Activities</h4>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-white border rounded">
                      <div className="flex items-center space-x-3">
                        <Download className="h-4 w-4 text-green-500" />
                        <div>
                          <div className="text-sm font-medium">Vehicle data sync</div>
                          <div className="text-xs text-gray-500">{i} minutes ago</div>
                        </div>
                      </div>
                      <Badge variant="default">Completed</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Push Notifications</CardTitle>
              <CardDescription>Manage mobile app notifications and alerts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <Bell className="h-4 w-4" />
                  <AlertDescription>
                    {syncStats?.pendingNotifications || 0} pending notifications to be sent to mobile devices
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Sync Completion Alerts</div>
                      <div className="text-sm text-gray-500">Notify when sync operations complete</div>
                    </div>
                    <Switch checked={true} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Error Notifications</div>
                      <div className="text-sm text-gray-500">Alert on sync failures or issues</div>
                    </div>
                    <Switch checked={true} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Daily Summary</div>
                      <div className="text-sm text-gray-500">Daily sync performance summary</div>
                    </div>
                    <Switch checked={false} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mobile Integration Settings</CardTitle>
              <CardDescription>Configure mobile app behavior and sync preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Background Sync</div>
                      <div className="text-sm text-gray-500">Allow syncing when app is in background</div>
                    </div>
                    <Switch 
                      checked={settings.backgroundSync}
                      onCheckedChange={(checked) => handleSettingChange('backgroundSync', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Offline Mode</div>
                      <div className="text-sm text-gray-500">Cache data for offline access</div>
                    </div>
                    <Switch 
                      checked={settings.offlineMode}
                      onCheckedChange={(checked) => handleSettingChange('offlineMode', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Data Compression</div>
                      <div className="text-sm text-gray-500">Compress data to reduce bandwidth usage</div>
                    </div>
                    <Switch 
                      checked={settings.dataCompression}
                      onCheckedChange={(checked) => handleSettingChange('dataCompression', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">WiFi Only Sync</div>
                      <div className="text-sm text-gray-500">Only sync when connected to WiFi</div>
                    </div>
                    <Switch 
                      checked={settings.wifiOnly}
                      onCheckedChange={(checked) => handleSettingChange('wifiOnly', checked)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GP51MobileIntegration;
