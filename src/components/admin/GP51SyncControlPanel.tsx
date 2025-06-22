
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Play, Pause, RotateCcw, Settings, Clock, Database } from 'lucide-react';

interface SyncConfiguration {
  id: string;
  sync_type: string;
  is_enabled: boolean;
  sync_interval_minutes: number;
  last_sync_at?: string;
  next_sync_at?: string;
  retry_count: number;
  max_retries: number;
  sync_settings: any;
}

const GP51SyncControlPanel: React.FC = () => {
  const [configurations, setConfigurations] = useState<SyncConfiguration[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchConfigurations();
  }, []);

  const fetchConfigurations = async () => {
    try {
      const { data, error } = await supabase
        .from('sync_configuration')
        .select('*')
        .order('sync_type');

      if (error) throw error;
      setConfigurations(data || []);
    } catch (error) {
      console.error('Failed to fetch sync configurations:', error);
      toast({
        title: "Error",
        description: "Failed to load sync configurations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateConfiguration = async (id: string, updates: Partial<SyncConfiguration>) => {
    try {
      const { error } = await supabase
        .from('sync_configuration')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setConfigurations(configs => 
        configs.map(config => 
          config.id === id ? { ...config, ...updates } : config
        )
      );

      toast({
        title: "Success",
        description: "Configuration updated successfully"
      });
    } catch (error) {
      console.error('Failed to update configuration:', error);
      toast({
        title: "Error",
        description: "Failed to update configuration",
        variant: "destructive"
      });
    }
  };

  const triggerManualSync = async (syncType: string) => {
    setSyncing(syncType);
    try {
      const { data, error } = await supabase.functions.invoke('syncGp51Vehicles', {
        body: { syncType, manual: true }
      });

      if (error) throw error;

      toast({
        title: "Sync Started",
        description: `Manual ${syncType} sync has been initiated`
      });

      // Refresh configurations to show updated sync times
      setTimeout(fetchConfigurations, 2000);
    } catch (error) {
      console.error('Failed to trigger sync:', error);
      toast({
        title: "Sync Failed",
        description: "Failed to start manual sync",
        variant: "destructive"
      });
    } finally {
      setSyncing(null);
    }
  };

  const getSyncTypeIcon = (syncType: string) => {
    switch (syncType) {
      case 'vehicle_sync': return <Database className="h-4 w-4" />;
      case 'user_sync': return <Settings className="h-4 w-4" />;
      case 'device_sync': return <Clock className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  const getSyncTypeLabel = (syncType: string) => {
    switch (syncType) {
      case 'vehicle_sync': return 'Vehicle Data Sync';
      case 'user_sync': return 'User Mapping Sync';
      case 'device_sync': return 'Device Metadata Sync';
      default: return syncType;
    }
  };

  const formatLastSync = (lastSync?: string) => {
    if (!lastSync) return 'Never';
    const date = new Date(lastSync);
    return date.toLocaleString();
  };

  const formatNextSync = (nextSync?: string) => {
    if (!nextSync) return 'Not scheduled';
    const date = new Date(nextSync);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffMins = Math.round(diffMs / (1000 * 60));
    
    if (diffMins < 0) return 'Overdue';
    if (diffMins < 60) return `In ${diffMins} minutes`;
    if (diffMins < 1440) return `In ${Math.round(diffMins / 60)} hours`;
    return `In ${Math.round(diffMins / 1440)} days`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>GP51 Sync Control Panel</CardTitle>
          <CardDescription>Loading sync configurations...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>GP51 Sync Control Panel</CardTitle>
        <CardDescription>
          Configure and manage automated synchronization with GP51 platform
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {configurations.map((config) => (
          <div key={config.id} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                {getSyncTypeIcon(config.sync_type)}
                <div>
                  <h3 className="font-medium">{getSyncTypeLabel(config.sync_type)}</h3>
                  <p className="text-sm text-muted-foreground">
                    Syncs every {config.sync_interval_minutes} minutes
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={config.is_enabled ? "default" : "secondary"}>
                  {config.is_enabled ? "Enabled" : "Disabled"}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => triggerManualSync(config.sync_type)}
                  disabled={syncing === config.sync_type}
                >
                  {syncing === config.sync_type ? (
                    <RotateCcw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  {syncing === config.sync_type ? 'Syncing...' : 'Sync Now'}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <Label className="text-xs text-muted-foreground">Last Sync</Label>
                <p className="text-sm">{formatLastSync(config.last_sync_at)}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Next Sync</Label>
                <p className="text-sm">{formatNextSync(config.next_sync_at)}</p>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={config.is_enabled}
                  onCheckedChange={(enabled) =>
                    updateConfiguration(config.id, { is_enabled: enabled })
                  }
                />
                <Label>Enable automatic sync</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Label htmlFor={`interval-${config.id}`} className="text-sm">
                  Interval (minutes)
                </Label>
                <Input
                  id={`interval-${config.id}`}
                  type="number"
                  min="5"
                  max="1440"
                  value={config.sync_interval_minutes}
                  onChange={(e) =>
                    updateConfiguration(config.id, {
                      sync_interval_minutes: parseInt(e.target.value) || 15
                    })
                  }
                  className="w-20"
                />
              </div>
            </div>

            {config.retry_count > 0 && (
              <div className="mt-2 text-sm text-amber-600">
                Retry count: {config.retry_count}/{config.max_retries}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default GP51SyncControlPanel;
