import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useGP51Credentials } from '@/hooks/useGP51Credentials';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { RefreshCw, TestTube, Zap, AlertCircle } from 'lucide-react';

const GP51ApiSettingsTab: React.FC = () => {
  const { user } = useAuth();
  const {
    username,
    setUsername,
    password,
    setPassword,
    apiUrl,
    setApiUrl,
    handleSaveCredentials,
    isLoading
  } = useGP51Credentials();

  const { toast } = useToast();

  const { data: gp51Status, isLoading: statusLoading, refetch: refetchStatus } = useQuery({
    queryKey: ['gp51-status'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('settings-management', {
        body: { action: 'get-gp51-status' }
      });
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
    enabled: !!user, // Only run when user is authenticated
  });

  // Show authentication required message if user is not logged in
  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            Authentication Required
          </CardTitle>
          <CardDescription>You must be signed in to configure GP51 API settings</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please sign in to your account to access GP51 configuration settings. This ensures your GP51 credentials are securely linked to your user account.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const handleTestConnection = async () => {
    if (!username || !password) {
      toast({
        title: 'Missing Credentials',
        description: 'Please enter username and password before testing connection',
        variant: 'destructive'
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('settings-management', {
        body: { 
          action: 'save-gp51-credentials-basic',
          username,
          password,
          apiUrl: apiUrl || undefined
        }
      });
      
      if (error) throw error;
      
      toast({
        title: 'Connection Test Successful',
        description: 'GP51 credentials are valid and connection is working'
      });
      
      refetchStatus();
    } catch (error: any) {
      toast({
        title: 'Connection Test Failed',
        description: error.message || 'Failed to test GP51 connection',
        variant: 'destructive'
      });
    }
  };

  const handleForceSync = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('passwordless-gp51-import', {
        body: { action: 'import_vehicles' }
      });
      
      if (error) throw error;
      
      toast({
        title: 'Force Sync Initiated',
        description: 'Manual vehicle synchronization has been started'
      });
      
      refetchStatus();
    } catch (error: any) {
      toast({
        title: 'Force Sync Failed',
        description: error.message || 'Failed to initiate manual sync',
        variant: 'destructive'
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSaveCredentials();
  };

  const isConnected = gp51Status?.connected || false;
  const lastSync = gp51Status?.expiresAt ? new Date(gp51Status.expiresAt).toLocaleString() : 'Never';
  const connectedUsername = gp51Status?.username || 'N/A';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          GPS51 API Configuration
          <Badge 
            variant={isConnected ? "default" : "destructive"} 
            className={isConnected ? "text-green-600 border-green-200" : ""}
          >
            {statusLoading ? 'Checking...' : (isConnected ? 'Connected' : 'Disconnected')}
          </Badge>
        </CardTitle>
        <CardDescription>Configure GPS51 platform integration and data synchronization</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="gp51-endpoint">GP51 API Endpoint</Label>
              <Input 
                id="gp51-endpoint" 
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="https://www.gps51.com/webapi (leave empty for default)"
              />
            </div>
            <div>
              <Label htmlFor="gp51-username">GP51 Username</Label>
              <Input 
                id="gp51-username" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter GP51 username"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="gp51-password">GP51 Password</Label>
            <Input 
              id="gp51-password" 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter GP51 password"
              required
            />
          </div>

          <div className="flex gap-2">
            <Button 
              type="submit" 
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              {isLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
              Save GP51 Settings
            </Button>
            <Button 
              type="button"
              variant="outline" 
              onClick={handleTestConnection}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <TestTube className="w-4 h-4" />
              Test Connection
            </Button>
            <Button 
              type="button"
              variant="outline" 
              onClick={handleForceSync}
              disabled={isLoading || !isConnected}
              className="flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              Force Sync
            </Button>
          </div>
        </form>

        <Separator />

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

        <div className="space-y-4">
          <h4 className="font-medium">Connection Status</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="last-sync">Last Session Expiry</Label>
              <Input id="last-sync" value={lastSync} readOnly />
            </div>
            <div>
              <Label htmlFor="connected-user">Connected User</Label>
              <Input id="connected-user" value={connectedUsername} readOnly />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GP51ApiSettingsTab;
