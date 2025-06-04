
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const AdminSettings = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: gp51Status, isLoading: statusLoading } = useQuery({
    queryKey: ['gp51-status'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('settings-management', {
        body: { action: 'get-gp51-status' }
      });
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const saveCredentialsMutation = useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      const { data, error } = await supabase.functions.invoke('settings-management', {
        body: { 
          action: 'save-gp51-credentials',
          username,
          password
        }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['gp51-status'] });
      setUsername('');
      setPassword('');
      toast({ 
        title: 'GP51 Credentials Saved',
        description: data.message || 'Successfully connected to GP51! These credentials will be used for automated imports.'
      });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Connection Failed', 
        description: error.message || 'Failed to connect to GP51',
        variant: 'destructive' 
      });
    },
  });

  const refreshConnectionMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('settings-management', {
        body: { action: 'get-gp51-status' }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gp51-status'] });
      toast({ 
        title: 'Connection Refreshed',
        description: 'GP51 connection status updated successfully'
      });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Refresh Failed', 
        description: error.message || 'Failed to refresh GP51 connection status',
        variant: 'destructive' 
      });
    },
  });

  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast({
        title: 'Missing Information',
        description: 'Please provide both username and password',
        variant: 'destructive'
      });
      return;
    }
    saveCredentialsMutation.mutate({ username, password });
  };

  const getConnectionStatus = () => {
    if (statusLoading) return { icon: null, text: 'Checking...', variant: 'secondary' as const };
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          GP51 LIVE Platform Connection
          <Badge variant="outline" className="text-xs">
            Admin Only
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Status:</span>
            <Badge variant={status.variant} className="flex items-center gap-1">
              {status.icon}
              {status.text}
            </Badge>
            {gp51Status?.connected && (
              <span className="text-xs text-gray-500">
                as {gp51Status.username}
              </span>
            )}
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => refreshConnectionMutation.mutate()}
            disabled={refreshConnectionMutation.isPending}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {gp51Status?.connected && gp51Status?.expiresAt && (
          <Alert>
            <AlertDescription>
              Token expires: {new Date(gp51Status.expiresAt).toLocaleString()}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSaveCredentials} className="space-y-4">
          <div>
            <Label htmlFor="gp51-username">GP51 Username</Label>
            <Input
              id="gp51-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your GP51 username"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="gp51-password">GP51 Password</Label>
            <Input
              id="gp51-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your GP51 password"
              required
            />
          </div>

          <Button 
            type="submit" 
            disabled={saveCredentialsMutation.isPending}
            className="w-full"
          >
            {saveCredentialsMutation.isPending ? 'Connecting...' : 'Save & Connect'}
          </Button>
        </form>

        <Alert>
          <AlertDescription className="text-sm">
            <strong>Automated Import Integration:</strong> These credentials will be securely stored and used 
            for automated passwordless imports. Once connected, the system can import GP51 user and vehicle 
            data without requiring manual password input for each import operation.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default AdminSettings;
