
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { 
  Smartphone, 
  Wifi, 
  WifiOff, 
  Bell, 
  Download, 
  Upload,
  Battery,
  Signal,
  CloudSync,
  Settings,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MobileDevice {
  id: string;
  device_name: string;
  platform: 'ios' | 'android';
  app_version: string;
  last_sync: string;
  sync_status: 'online' | 'offline' | 'syncing';
  battery_level: number;
  signal_strength: number;
  offline_data_size: number;
}

interface MobileSettings {
  pushNotificationsEnabled: boolean;
  offlineSyncEnabled: boolean;
  backgroundSyncEnabled: boolean;
  syncInterval: number;
  dataCompressionEnabled: boolean;
  wifiOnlySync: boolean;
}

interface SyncQueue {
  id: string;
  operation: 'upload' | 'download';
  data_type: string;
  size: number;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
}

const GP51MobileIntegration: React.FC = () => {
  const [mobileDevices, setMobileDevices] = useState<MobileDevice[]>([]);
  const [settings, setSettings] = useState<MobileSettings>({
    pushNotificationsEnabled: true,
    offlineSyncEnabled: true,
    backgroundSyncEnabled: true,
    syncInterval: 300, // 5 minutes
    dataCompressionEnabled: true,
    wifiOnlySync: false
  });
  const [syncQueue, setSyncQueue] = useState<SyncQueue[]>([]);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadMobileDevices();
    loadMobileSettings();
    loadSyncQueue();

    // Set up real-time updates for mobile sync status
    const channel = supabase
      .channel('mobile-sync-status')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mobile_sync_queue'
        },
        (payload) => {
          console.log('📱 Mobile sync update:', payload);
          loadSyncQueue();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadMobileDevices = async () => {
    // Simulate mobile device data - in a real implementation, 
    // this would come from device registration and status tracking
    setMobileDevices([
      {
        id: '1',
        device_name: 'iPhone 13 Pro',
        platform: 'ios',
        app_version: '2.1.0',
        last_sync: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        sync_status: 'online',
        battery_level: 85,
        signal_strength: 4,
        offline_data_size: 2.3
      },
      {
        id: '2',
        device_name: 'Samsung Galaxy S21',
        platform: 'android',
        app_version: '2.0.9',
        last_sync: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        sync_status: 'offline',
        battery_level: 45,
        signal_strength: 2,
        offline_data_size: 5.7
      }
    ]);
  };

  const loadMobileSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('sync_configuration')
        .select('sync_settings')
        .eq('sync_type', 'mobile_settings')
        .single();

      if (data?.sync_settings) {
        setSettings(prev => ({ ...prev, ...data.sync_settings }));
      }
    } catch (error) {
      console.error('Failed to load mobile settings:', error);
    }
  };

  const loadSyncQueue = async () => {
    // Simulate sync queue data
    setSyncQueue([
      {
        id: '1',
        operation: 'upload',
        data_type: 'vehicle_positions',
        size: 1.2,
        priority: 'high',
        status: 'processing',
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        operation: 'download',
        data_type: 'sync_updates',
        size: 0.8,
        priority: 'medium',
        status: 'pending',
        created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString()
      }
    ]);
  };

  const updateMobileSetting = async (key: keyof MobileSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    try {
      const { error } = await supabase
        .from('sync_configuration')
        .upsert({
          sync_type: 'mobile_settings',
          sync_settings: newSettings,
          is_enabled: true
        });

      if (error) throw error;

      toast({
        title: 'Mobile Settings Updated',
        description: `${key} has been updated successfully`,
        duration: 3000
      });
    } catch (error) {
      toast({
        title: 'Update Failed',
        description: `Failed to update ${key}`,
        variant: 'destructive',
        duration: 5000
      });
    }
  };

  const triggerMobileSync = async (deviceId: string) => {
    setIsConfiguring(true);
    try {
      // In a real implementation, this would send a push notification
      // or trigger a sync via the mobile app's API
      console.log(`🔄 Triggering sync for device: ${deviceId}`);
      
      toast({
        title: 'Mobile Sync Triggered',
        description: 'Sync request sent to mobile device',
        duration: 5000
      });
    } catch (error) {
      toast({
        title: 'Sync Failed',
        description: 'Failed to trigger mobile sync',
        variant: 'destructive',
        duration: 5000
      });
    } finally {
      setIsConfiguring(false);
    }
  };

  const configurePushNotifications = async () => {
    setIsConfiguring(true);
    try {
      // Configure push notification settings
      await updateMobileSetting('pushNotificationsEnabled', !settings.pushNotificationsEnabled);
      
      if (settings.pushNotificationsEnabled) {
        toast({
          title: 'Push Notifications Configured',
          description: 'Mobile devices will receive sync notifications',
          duration: 5000
        });
      }
    } finally {
      setIsConfiguring(false);
    }
  };

  const getDeviceIcon = (platform: string) => {
    return <Smartphone className="h-5 w-5" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-100 text-green-800';
      case 'syncing':
        return 'bg-blue-100 text-blue-800';
      case 'offline':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  const formatFileSize = (sizeInMB: number) => {
    return `${sizeInMB.toFixed(1)} MB`;
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    return `${Math.floor(diffMins / 60)}h ago`;
  };

  return (
    <div className="space-y-6">
      {/* Mobile Integration Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Smartphone className="h-5 w-5" />
            <span>Mobile App Integration</span>
          </CardTitle>
          <CardDescription>
            Real-time synchronization and offline capabilities for mobile devices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <Smartphone className="h-6 w-6 mx-auto mb-2 text-blue-500" />
              <div className="text-lg font-bold">{mobileDevices.length}</div>
              <div className="text-sm text-muted-foreground">Connected Devices</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <CloudSync className="h-6 w-6 mx-auto mb-2 text-green-500" />
              <div className="text-lg font-bold">{syncQueue.length}</div>
              <div className="text-sm text-muted-foreground">Sync Queue</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Bell className="h-6 w-6 mx-auto mb-2 text-purple-500" />
              <div className="text-lg font-bold">
                {settings.pushNotificationsEnabled ? 'On' : 'Off'}
              </div>
              <div className="text-sm text-muted-foreground">Push Notifications</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <WifiOff className="h-6 w-6 mx-auto mb-2 text-orange-500" />
              <div className="text-lg font-bold">
                {settings.offlineSyncEnabled ? 'On' : 'Off'}
              </div>
              <div className="text-sm text-muted-foreground">Offline Sync</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mobile Device Status */}
      <Card>
        <CardHeader>
          <CardTitle>Connected Mobile Devices</CardTitle>
          <CardDescription>Status and sync information for mobile app installations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mobileDevices.map((device) => (
              <div key={device.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  {getDeviceIcon(device.platform)}
                  <div>
                    <div className="font-medium">{device.device_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {device.platform.toUpperCase()} • v{device.app_version}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  {/* Signal Strength */}
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      {getSignalBars(device.signal_strength)}
                    </div>
                    <Signal className="h-4 w-4 text-gray-400" />
                  </div>

                  {/* Battery Level */}
                  <div className="flex items-center space-x-2">
                    <div className="text-sm font-mono">{device.battery_level}%</div>
                    <Battery className="h-4 w-4 text-gray-400" />
                  </div>

                  {/* Offline Data */}
                  <div className="text-sm text-muted-foreground">
                    {formatFileSize(device.offline_data_size)} cached
                  </div>

                  {/* Status */}
                  <Badge className={getStatusColor(device.sync_status)}>
                    {device.sync_status.toUpperCase()}
                  </Badge>

                  {/* Last Sync */}
                  <div className="text-sm text-muted-foreground">
                    {formatTimeAgo(device.last_sync)}
                  </div>

                  {/* Actions */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => triggerMobileSync(device.id)}
                    disabled={isConfiguring}
                  >
                    Sync Now
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Mobile Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Mobile Sync Configuration</CardTitle>
          <CardDescription>Configure mobile app synchronization behavior and settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Push Notifications</label>
                  <p className="text-xs text-muted-foreground">Send notifications for sync events</p>
                </div>
                <Switch
                  checked={settings.pushNotificationsEnabled}
                  onCheckedChange={(checked) => updateMobileSetting('pushNotificationsEnabled', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Offline Sync</label>
                  <p className="text-xs text-muted-foreground">Enable offline data caching</p>
                </div>
                <Switch
                  checked={settings.offlineSyncEnabled}
                  onCheckedChange={(checked) => updateMobileSetting('offlineSyncEnabled', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Background Sync</label>
                  <p className="text-xs text-muted-foreground">Sync when app is in background</p>
                </div>
                <Switch
                  checked={settings.backgroundSyncEnabled}
                  onCheckedChange={(checked) => updateMobileSetting('backgroundSyncEnabled', checked)}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Data Compression</label>
                  <p className="text-xs text-muted-foreground">Compress data for mobile transfer</p>
                </div>
                <Switch
                  checked={settings.dataCompressionEnabled}
                  onCheckedChange={(checked) => updateMobileSetting('dataCompressionEnabled', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">WiFi Only Sync</label>
                  <p className="text-xs text-muted-foreground">Only sync when connected to WiFi</p>
                </div>
                <Switch
                  checked={settings.wifiOnlySync}
                  onCheckedChange={(checked) => updateMobileSetting('wifiOnlySync', checked)}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Sync Interval</label>
                <div className="flex items-center space-x-2 mt-1">
                  <input
                    type="range"
                    min="60"
                    max="3600"
                    step="60"
                    value={settings.syncInterval}
                    onChange={(e) => updateMobileSetting('syncInterval', parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm font-mono w-16">
                    {Math.floor(settings.syncInterval / 60)}m
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sync Queue */}
      <Card>
        <CardHeader>
          <CardTitle>Mobile Sync Queue</CardTitle>
          <CardDescription>Pending synchronization operations for mobile devices</CardDescription>
        </CardHeader>
        <CardContent>
          {syncQueue.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Operations</h3>
              <p className="text-gray-500">
                All mobile devices are synchronized and up to date.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {syncQueue.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {item.operation === 'upload' ? (
                      <Upload className="h-4 w-4 text-blue-500" />
                    ) : (
                      <Download className="h-4 w-4 text-green-500" />
                    )}
                    <div>
                      <div className="font-medium text-sm">{item.data_type}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatFileSize(item.size)} • {formatTimeAgo(item.created_at)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Badge variant="outline" className={
                      item.priority === 'high' ? 'border-red-200 text-red-600' :
                      item.priority === 'medium' ? 'border-yellow-200 text-yellow-600' :
                      'border-blue-200 text-blue-600'
                    }>
                      {item.priority.toUpperCase()}
                    </Badge>

                    <Badge className={
                      item.status === 'completed' ? 'bg-green-100 text-green-800' :
                      item.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                      item.status === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }>
                      {item.status.toUpperCase()}
                    </Badge>
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

export default GP51MobileIntegration;
