
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, RefreshCw, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const GP51AuthenticationHelper: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Query GP51 status
  const { data: gp51Status, isLoading, error } = useQuery({
    queryKey: ['gp51-status'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('settings-management', {
        body: { action: 'get-gp51-status' }
      });
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Refresh session mutation
  const refreshSessionMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('gp51-service-management', {
        body: { action: 'refresh_session' }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gp51-status'] });
      toast({
        title: "Session Refreshed",
        description: "GP51 session has been successfully refreshed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Refresh Failed",
        description: error.message || "Failed to refresh GP51 session",
        variant: "destructive"
      });
    },
  });

  // Test connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('gp51-service-management', {
        body: { action: 'test_connection' }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['gp51-status'] });
      toast({
        title: "Connection Test Successful",
        description: `Successfully connected to GP51 as ${data.username}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Connection Test Failed",
        description: error.message || "Failed to connect to GP51",
        variant: "destructive"
      });
    },
  });

  const handleRefreshSession = () => {
    setIsRefreshing(true);
    refreshSessionMutation.mutate();
    setTimeout(() => setIsRefreshing(false), 3000);
  };

  const getStatusIcon = () => {
    if (isLoading) return <RefreshCw className="h-4 w-4 animate-spin" />;
    if (error || !gp51Status?.connected) return <XCircle className="h-4 w-4 text-red-500" />;
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const getStatusText = () => {
    if (isLoading) return "Checking...";
    if (error) return "Error";
    if (!gp51Status?.connected) return "Disconnected";
    return "Connected";
  };

  const getStatusVariant = () => {
    if (isLoading) return "secondary" as const;
    if (error || !gp51Status?.connected) return "destructive" as const;
    return "default" as const;
  };

  const isSessionExpiringSoon = () => {
    if (!gp51Status?.expiresAt) return false;
    const expiresAt = new Date(gp51Status.expiresAt);
    const now = new Date();
    const timeDiff = expiresAt.getTime() - now.getTime();
    const hoursUntilExpiry = timeDiff / (1000 * 60 * 60);
    return hoursUntilExpiry < 2; // Warning if expires within 2 hours
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          GP51 Authentication Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Connection Status:</span>
            <Badge variant={getStatusVariant()} className="flex items-center gap-1">
              {getStatusIcon()}
              {getStatusText()}
            </Badge>
            {gp51Status?.connected && (
              <span className="text-xs text-gray-500">
                as {gp51Status.username}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => testConnectionMutation.mutate()}
              disabled={testConnectionMutation.isPending}
            >
              <RefreshCw className={`h-4 w-4 ${testConnectionMutation.isPending ? 'animate-spin' : ''}`} />
              Test
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshSession}
              disabled={refreshSessionMutation.isPending || isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshSessionMutation.isPending || isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Session Details */}
        {gp51Status?.connected && gp51Status?.expiresAt && (
          <div className="space-y-2">
            <Alert className={isSessionExpiringSoon() ? "border-yellow-200 bg-yellow-50" : ""}>
              {isSessionExpiringSoon() && <AlertTriangle className="h-4 w-4 text-yellow-600" />}
              <AlertDescription>
                <strong>Session expires:</strong> {new Date(gp51Status.expiresAt).toLocaleString()}
                {isSessionExpiringSoon() && (
                  <span className="block text-yellow-700 font-medium mt-1">
                    ⚠️ Session expires soon! Consider refreshing.
                  </span>
                )}
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Error Information */}
        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Authentication Error:</strong> {error.message}
              <div className="mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['gp51-status'] })}
                >
                  Retry Check
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Disconnected State */}
        {!isLoading && !error && !gp51Status?.connected && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>GP51 Not Connected:</strong> Please authenticate with GP51 in Admin Settings.
              <div className="mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.href = '/settings'}
                >
                  Go to Settings
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Quick Actions */}
        {gp51Status?.connected && (
          <div className="pt-2 border-t">
            <p className="text-xs text-gray-600 mb-2">Quick Actions:</p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => queryClient.invalidateQueries({ queryKey: ['gp51-status'] })}
              >
                Refresh Status
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GP51AuthenticationHelper;
