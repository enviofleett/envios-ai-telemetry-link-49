import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RefreshCw, TestTube, Zap, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import GP51ConnectionInfo from '@/components/AdminSettings/GP51ConnectionInfo';

const GP51ApiSettingsTab: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isForcingSync, setIsForcingSync] = useState(false);

  // Fetch GP51 status
  const { data: gp51Status, isLoading: statusLoading } = useQuery({
    queryKey: ['gp51-status'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('settings-management', {
        body: { action: 'get-gp51-status' }
      });
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
  });

  // Fetch vehicle statistics
  const { data: vehicleStats } = useQuery({
    queryKey: ['vehicle-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('status, updated_at')
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      
      const total = data?.length || 0;
      const online = data?.filter(v => v.status === 'online').length || 0;
      const lastUpdate = data?.[0]?.updated_at;
      
      return { total, online, lastUpdate };
    },
    refetchInterval: 60000,
  });

  // Test connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: async () => {
      setIsTestingConnection(true);
      const { data, error } = await supabase.functions.invoke('gp51-service-management', {
        body: { action: 'test_connection' }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Connection Test Successful",
          description: `Connected to GP51 for user: ${data.username}`,
        });
      } else {
        toast({
          title: "Connection Test Failed",
          description: data.error || "Failed to connect to GP51",
          variant: "destructive"
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Connection Test Error",
        description: error.message || "Failed to test GP51 connection",
        variant: "destructive"
      });
    },
    onSettled: () => {
      setIsTestingConnection(false);
      queryClient.invalidateQueries({ queryKey: ['gp51-status'] });
    }
  });

  // Force sync mutation
  const forceSyncMutation = useMutation({
    mutationFn: async () => {
      setIsForcingSync(true);
      const { data, error } = await supabase.functions.invoke('gp51-service-management', {
        body: { action: 'querymonitorlist' }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Force Sync Initiated",
        description: "GP51 data synchronization has been triggered",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Force Sync Failed",
        description: error.message || "Failed to trigger GP51 synchronization",
        variant: "destructive"
      });
    },
    onSettled: () => {
      setIsForcingSync(false);
      queryClient.invalidateQueries({ queryKey: ['vehicle-stats'] });
    }
  });

  const getConnectionStatus = () => {
    if (statusLoading) return { icon: <RefreshCw className="h-4 w-4 animate-spin" />, text: 'Checking...', variant: 'secondary' as const };
    if (gp51Status?.connected) {
      return { 
        icon: <CheckCircle className="h-4 w-4" />, 
        text: 'Connected', 
        variant: 'default' as const 
      };
    }
    return { 
      icon: <XCircle className="h-4 w-4" />, 
      text: 'Disconnected', 
      variant: 'destructive' as const 
    };
  };

  const status = getConnectionStatus();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            GPS51 API Configuration
            <Badge variant={status.variant} className="flex items-center gap-1">
              {status.icon}
              {status.text}
            </Badge>
          </CardTitle>
          <CardDescription>Configure GPS51 platform integration and data synchronization</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Connection Status and Controls */}
          <div className="space-y-4">
            <GP51ConnectionInfo 
              gp51Status={gp51Status} 
              statusLoading={statusLoading}
            />
            
            {gp51Status?.connected && gp51Status?.expiresAt && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Session expires: {new Date(gp51Status.expiresAt).toLocaleString()}
                  {gp51Status.warningMessage && (
                    <span className="block mt-1 text-amber-600">{gp51Status.warningMessage}</span>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>

          <Separator />

          {/* GP51 Credentials Form */}
          <div className="space-y-4">
            <h4 className="font-medium">Connection Credentials</h4>
            <GP51CredentialsForm />
          </div>

          <Separator />

          {/* Data Synchronization Settings */}
          <div className="space-y-4">
            <h4 className="font-medium">Data Synchronization</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sync-interval">Sync Interval</Label>
                <Select defaultValue="30">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 seconds</SelectItem>
                    <SelectItem value="30">30 seconds</SelectItem>
                    <SelectItem value="60">1 minute</SelectItem>
                    <SelectItem value="300">5 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="retry-attempts">Retry Attempts</Label>
                <Select defaultValue="3">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 attempt</SelectItem>
                    <SelectItem value="3">3 attempts</SelectItem>
                    <SelectItem value="5">5 attempts</SelectItem>
                    <SelectItem value="10">10 attempts</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Protocol Settings */}
          <div className="space-y-4">
            <h4 className="font-medium">Protocol Settings</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-device-discovery">Auto Device Discovery</Label>
                <Switch id="auto-device-discovery" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="real-time-tracking">Real-time Position Updates</Label>
                <Switch id="real-time-tracking" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="historical-data">Historical Data Import</Label>
                <Switch id="historical-data" />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="device-commands">Enable Device Commands</Label>
                <Switch id="device-commands" defaultChecked />
              </div>
            </div>
          </div>

          <Separator />

          {/* Real-time Connection Status */}
          <div className="space-y-4">
            <h4 className="font-medium">Live Connection Status</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="last-sync">Last Successful Sync</Label>
                <Input 
                  id="last-sync" 
                  value={vehicleStats?.lastUpdate ? new Date(vehicleStats.lastUpdate).toLocaleString() : 'No data'} 
                  readOnly 
                />
              </div>
              <div>
                <Label htmlFor="active-devices">Active Devices</Label>
                <Input 
                  id="active-devices" 
                  value={vehicleStats ? `${vehicleStats.online} / ${vehicleStats.total}` : 'Loading...'} 
                  readOnly 
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button 
              onClick={() => testConnectionMutation.mutate()}
              disabled={isTestingConnection || !gp51Status?.connected}
              variant="outline"
            >
              <TestTube className="h-4 w-4 mr-2" />
              {isTestingConnection ? 'Testing...' : 'Test Connection'}
            </Button>
            <Button 
              onClick={() => forceSyncMutation.mutate()}
              disabled={isForcingSync || !gp51Status?.connected}
              variant="outline"
            >
              <Zap className="h-4 w-4 mr-2" />
              {isForcingSync ? 'Syncing...' : 'Force Sync'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GP51ApiSettingsTab;
