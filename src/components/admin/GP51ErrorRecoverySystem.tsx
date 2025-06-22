import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, RefreshCw, CheckCircle, Clock, Settings } from 'lucide-react';
import { SyncErrorDetails } from './types/syncTypes';
import { Json } from '@/integrations/supabase/types';

// Helper function to safely extract number from Json
const extractNumber = (json: Json, key: string, defaultValue: number = 0): number => {
  if (typeof json === 'object' && json !== null && !Array.isArray(json)) {
    const value = (json as Record<string, Json>)[key];
    return typeof value === 'number' ? value : defaultValue;
  }
  return defaultValue;
};

// Helper function to safely extract string from Json
const extractString = (json: Json, key: string, defaultValue: string = ''): string => {
  if (typeof json === 'object' && json !== null && !Array.isArray(json)) {
    const value = (json as Record<string, Json>)[key];
    return typeof value === 'string' ? value : defaultValue;
  }
  return defaultValue;
};

// Helper function to safely extract array from Json
const extractArray = (json: Json, key: string, defaultValue: string[] = []): string[] => {
  if (typeof json === 'object' && json !== null && !Array.isArray(json)) {
    const value = (json as Record<string, Json>)[key];
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : defaultValue;
  }
  return defaultValue;
};

const GP51ErrorRecoverySystem: React.FC = () => {
  const [errorHistory, setErrorHistory] = useState<SyncErrorDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecovering, setIsRecovering] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchErrorHistory();
  }, []);

  const fetchErrorHistory = async () => {
    try {
      setIsLoading(true);
      
      // Fetch recent sync errors from the error_log field
      const { data: syncData, error: syncError } = await supabase
        .from('gp51_sync_status')
        .select('*')
        .neq('error_log', '[]')
        .order('created_at', { ascending: false })
        .limit(20);

      if (syncError) throw syncError;

      // Process error logs into SyncErrorDetails format
      const errors: SyncErrorDetails[] = [];
      syncData?.forEach(sync => {
        if (Array.isArray(sync.error_log)) {
          sync.error_log.forEach((error: any) => {
            if (typeof error === 'object' && error !== null) {
              errors.push({
                error_type: extractString(error, 'type', 'Unknown Error'),
                error_message: extractString(error, 'message', 'No message available'),
                timestamp: extractString(error, 'timestamp', sync.created_at),
                retry_count: extractNumber(error, 'retry_count', 0),
                resolution_status: extractString(error, 'status', 'unresolved'),
                suggested_actions: extractArray(error, 'suggested_actions', [])
              });
            }
          });
        }
      });

      setErrorHistory(errors);
    } catch (error) {
      console.error('Error fetching error history:', error);
      toast({
        title: "Error",
        description: "Failed to fetch error history",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const initiateAutoRecovery = async () => {
    try {
      setIsRecovering(true);
      
      // Call the GP51 service management function to attempt recovery
      const { data, error } = await supabase.functions.invoke('gp51-service-management', {
        body: { action: 'auto_recovery' }
      });

      if (error) throw error;

      toast({
        title: "Recovery Initiated",
        description: "Automatic error recovery process has been started",
      });

      // Refresh error history after recovery
      setTimeout(() => {
        fetchErrorHistory();
      }, 2000);

    } catch (error) {
      console.error('Error initiating recovery:', error);
      toast({
        title: "Recovery Failed",
        description: "Failed to initiate automatic recovery",
        variant: "destructive"
      });
    } finally {
      setIsRecovering(false);
    }
  };

  const getErrorBadge = (status: string) => {
    switch (status) {
      case 'resolved':
        return <Badge variant="default" className="bg-green-100 text-green-800">Resolved</Badge>;
      case 'recovering':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Recovering</Badge>;
      case 'unresolved':
        return <Badge variant="destructive">Unresolved</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getErrorTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'connection':
        return 'text-red-600';
      case 'authentication':
        return 'text-orange-600';
      case 'rate_limit':
        return 'text-yellow-600';
      case 'data_validation':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-24 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Recovery System</h2>
          <p className="text-gray-600">Intelligent error detection and automatic recovery</p>
        </div>
        <Button 
          onClick={initiateAutoRecovery} 
          disabled={isRecovering}
          className="flex items-center space-x-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRecovering ? 'animate-spin' : ''}`} />
          <span>{isRecovering ? 'Recovering...' : 'Auto Recovery'}</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Errors</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{errorHistory.length}</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {errorHistory.filter(e => e.resolution_status === 'resolved').length}
            </div>
            <p className="text-xs text-muted-foreground">Auto-resolved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {errorHistory.filter(e => e.resolution_status === 'unresolved').length}
            </div>
            <p className="text-xs text-muted-foreground">Needs attention</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Error History</CardTitle>
          <CardDescription>Recent errors and recovery status</CardDescription>
        </CardHeader>
        <CardContent>
          {errorHistory.length === 0 ? (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>No recent errors detected. System is running smoothly.</AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {errorHistory.map((error, index) => (
                <div key={index} className="flex items-start justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className={`font-medium ${getErrorTypeColor(error.error_type)}`}>
                        {error.error_type}
                      </h4>
                      {getErrorBadge(error.resolution_status)}
                      {error.retry_count > 0 && (
                        <Badge variant="outline">
                          Retry: {error.retry_count}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{error.error_message}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(error.timestamp).toLocaleString()}
                    </p>
                    {error.suggested_actions.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-gray-600 mb-1">Suggested Actions:</p>
                        <ul className="text-xs text-gray-600 list-disc list-inside">
                          {error.suggested_actions.map((action, actionIndex) => (
                            <li key={actionIndex}>{action}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <div className="ml-4">
                    <Button size="sm" variant="outline">
                      <Settings className="h-3 w-3 mr-1" />
                      Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={fetchErrorHistory} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh History
        </Button>
      </div>
    </div>
  );
};

export default GP51ErrorRecoverySystem;
