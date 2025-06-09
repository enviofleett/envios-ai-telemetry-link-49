
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, RefreshCw, AlertTriangle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { EnhancedGP51SessionManager } from '@/services/enhancedGP51SessionManager';

const GP51AuthenticationHelper: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Enhanced session status query
  const { data: sessionHealth, isLoading, error } = useQuery({
    queryKey: ['gp51-session-health'],
    queryFn: () => EnhancedGP51SessionManager.validateAndRefreshSession(),
    refetchInterval: 30000, // Check every 30 seconds
  });

  // Manual refresh mutation
  const refreshSessionMutation = useMutation({
    mutationFn: async () => {
      return await EnhancedGP51SessionManager.validateAndRefreshSession();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['gp51-session-health'] });
      queryClient.invalidateQueries({ queryKey: ['gp51-status'] });
      
      if (result.isValid) {
        toast({
          title: "Session Refreshed",
          description: `GP51 session validated successfully for ${result.username}`,
        });
      } else {
        toast({
          title: "Session Issue",
          description: result.error || "Session validation failed",
          variant: "destructive"
        });
      }
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
      queryClient.invalidateQueries({ queryKey: ['gp51-session-health'] });
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
    if (error || !sessionHealth?.isValid) return <XCircle className="h-4 w-4 text-red-500" />;
    if (sessionHealth?.needsRefresh) return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const getStatusText = () => {
    if (isLoading) return "Checking...";
    if (error) return "Error";
    if (!sessionHealth?.isValid) return "Disconnected";
    if (sessionHealth?.needsRefresh) return "Needs Refresh";
    return "Connected";
  };

  const getStatusVariant = () => {
    if (isLoading) return "secondary" as const;
    if (error || !sessionHealth?.isValid) return "destructive" as const;
    if (sessionHealth?.needsRefresh) return "outline" as const;
    return "default" as const;
  };

  const getTimeDisplay = () => {
    if (!sessionHealth?.timeUntilExpiry) return null;
    
    const minutes = sessionHealth.timeUntilExpiry;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${remainingMinutes}m`;
  };

  const isExpiringSoon = () => {
    return sessionHealth?.timeUntilExpiry && sessionHealth.timeUntilExpiry < 120; // Less than 2 hours
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          Enhanced GP51 Authentication Status
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
            {sessionHealth?.isValid && sessionHealth?.username && (
              <span className="text-xs text-gray-500">
                as {sessionHealth.username}
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
        {sessionHealth?.isValid && sessionHealth?.expiresAt && (
          <div className="space-y-2">
            <Alert className={isExpiringSoon() ? "border-yellow-200 bg-yellow-50" : ""}>
              {isExpiringSoon() && <AlertTriangle className="h-4 w-4 text-yellow-600" />}
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <span>
                    <strong>Session expires:</strong> {new Date(sessionHealth.expiresAt).toLocaleString()}
                  </span>
                  {getTimeDisplay() && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {getTimeDisplay()} remaining
                    </Badge>
                  )}
                </div>
                {isExpiringSoon() && (
                  <div className="text-yellow-700 font-medium mt-2">
                    ⚠️ Session expires soon! Consider refreshing.
                  </div>
                )}
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Error Information */}
        {sessionHealth?.error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Session Error:</strong> {sessionHealth.error}
              <div className="mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['gp51-session-health'] })}
                >
                  Retry Check
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Disconnected State */}
        {!isLoading && !error && !sessionHealth?.isValid && (
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

        {/* Health Indicators */}
        {sessionHealth?.isValid && (
          <div className="pt-2 border-t">
            <p className="text-xs text-gray-600 mb-2">Session Health:</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>Authentication Valid</span>
              </div>
              <div className="flex items-center gap-2">
                {sessionHealth.needsRefresh ? (
                  <AlertTriangle className="h-3 w-3 text-yellow-500" />
                ) : (
                  <CheckCircle className="h-3 w-3 text-green-500" />
                )}
                <span>Token Status</span>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        {sessionHealth?.isValid && (
          <div className="pt-2 border-t">
            <p className="text-xs text-gray-600 mb-2">Quick Actions:</p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => queryClient.invalidateQueries({ queryKey: ['gp51-session-health'] })}
              >
                Refresh Status
              </Button>
              {sessionHealth.needsRefresh && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefreshSession}
                  disabled={isRefreshing}
                >
                  Force Refresh
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GP51AuthenticationHelper;
