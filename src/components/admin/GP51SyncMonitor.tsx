
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Clock, CheckCircle, XCircle, AlertTriangle, Database } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { SyncStatus, SyncMetrics } from './types/syncTypes';
import { useToast } from '@/hooks/use-toast';

// Type-safe helper functions for Json field access
const getSyncDuration = (syncDetails: any): number | null => {
  if (!syncDetails || typeof syncDetails !== 'object') return null;
  return typeof syncDetails.duration_ms === 'number' ? syncDetails.duration_ms : null;
};

const getLatestErrorMessage = (errorLog: any): string | null => {
  if (!errorLog) return null;
  if (Array.isArray(errorLog) && errorLog.length > 0) {
    const latestError = errorLog[0];
    return typeof latestError?.message === 'string' ? latestError.message : null;
  }
  if (typeof errorLog === 'object' && typeof errorLog.message === 'string') {
    return errorLog.message;
  }
  return null;
};

const GP51SyncMonitor: React.FC = () => {
  const [syncHistory, setSyncHistory] = useState<SyncStatus[]>([]);
  const [syncMetrics, setSyncMetrics] = useState<SyncMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [realTimeConnected, setRealTimeConnected] = useState(false);
  const { toast } = useToast();

  const fetchSyncHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('gp51_sync_status')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      setSyncHistory(data || []);
      calculateMetrics(data || []);
    } catch (error) {
      console.error('Error fetching sync history:', error);
      toast({
        title: "Error",
        description: "Failed to fetch sync history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = (history: SyncStatus[]) => {
    if (history.length === 0) {
      setSyncMetrics({
        totalSyncs: 0,
        successfulSyncs: 0,
        failedSyncs: 0,
        lastSyncTime: null,
        averageDuration: null,
      });
      return;
    }

    const completedSyncs = history.filter(sync => sync.status === 'completed');
    const failedSyncs = history.filter(sync => sync.status === 'failed');
    
    // Calculate average duration for completed syncs with valid duration
    const syncsWithDuration = completedSyncs.filter(sync => {
      const duration = getSyncDuration(sync.sync_details);
      return duration !== null && duration > 0;
    });

    const averageDuration = syncsWithDuration.length > 0
      ? syncsWithDuration.reduce((sum, sync) => {
          const duration = getSyncDuration(sync.sync_details);
          return sum + (duration || 0);
        }, 0) / syncsWithDuration.length
      : null;

    setSyncMetrics({
      totalSyncs: history.length,
      successfulSyncs: completedSyncs.length,
      failedSyncs: failedSyncs.length,
      lastSyncTime: history[0]?.created_at || null,
      averageDuration,
    });
  };

  useEffect(() => {
    fetchSyncHistory();

    // Set up realtime subscription
    const channel = supabase
      .channel('gp51-sync-monitor')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'gp51_sync_status'
        },
        (payload) => {
          console.log('Real-time sync update:', payload);
          fetchSyncHistory(); // Refresh data when changes occur
        }
      )
      .subscribe((status) => {
        setRealTimeConnected(status === 'SUBSCRIBED');
        if (status === 'SUBSCRIBED') {
          console.log('✅ Connected to sync status real-time updates');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'default' as const,
      failed: 'destructive' as const,
      running: 'secondary' as const,
    };
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatDuration = (ms: number | null): string => {
    if (!ms || ms <= 0) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatDateTime = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          <span>Loading sync history...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Real-time Connection Status */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Sync Monitor</h3>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${realTimeConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm text-muted-foreground">
            {realTimeConnected ? 'Live' : 'Disconnected'}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSyncHistory}
            className="ml-2"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Sync Metrics */}
      {syncMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Syncs</p>
                  <p className="text-2xl font-bold">{syncMetrics.totalSyncs}</p>
                </div>
                <Database className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Successful</p>
                  <p className="text-2xl font-bold text-green-600">{syncMetrics.successfulSyncs}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Failed</p>
                  <p className="text-2xl font-bold text-red-600">{syncMetrics.failedSyncs}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Duration</p>
                  <p className="text-2xl font-bold">
                    {formatDuration(syncMetrics.averageDuration)}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sync History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sync History</CardTitle>
        </CardHeader>
        <CardContent>
          {syncHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No sync history available
            </div>
          ) : (
            <div className="space-y-4">
              {syncHistory.map((sync) => {
                const duration = getSyncDuration(sync.sync_details);
                const errorMessage = getLatestErrorMessage(sync.error_log);

                return (
                  <div
                    key={sync.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(sync.status)}
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium capitalize">{sync.sync_type}</span>
                          {getStatusBadge(sync.status)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatDateTime(sync.created_at)}
                        </div>
                        {errorMessage && (
                          <div className="text-sm text-red-600 mt-1">
                            Error: {errorMessage}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="flex items-center space-x-4 text-sm">
                        <span>
                          <span className="text-muted-foreground">Total:</span> {sync.total_devices}
                        </span>
                        <span>
                          <span className="text-muted-foreground">Success:</span> {sync.successful_syncs}
                        </span>
                        <span>
                          <span className="text-muted-foreground">Failed:</span> {sync.failed_syncs}
                        </span>
                        {duration && (
                          <span>
                            <span className="text-muted-foreground">Duration:</span> {formatDuration(duration)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GP51SyncMonitor;
