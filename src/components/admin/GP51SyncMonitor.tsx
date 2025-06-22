
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle, XCircle, Clock, TrendingUp, Database } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SyncStatus, SyncMetrics } from './types/syncTypes';

const GP51SyncMonitor: React.FC = () => {
  const [syncHistory, setSyncHistory] = useState<SyncStatus[]>([]);
  const [metrics, setMetrics] = useState<SyncMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSyncData();
    
    // Set up realtime subscription for sync status updates
    const channel = supabase
      .channel('sync-status-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'gp51_sync_status'
        },
        (payload) => {
          console.log('Sync status update:', payload);
          fetchSyncData();
        }
      )
      .subscribe();

    // Refresh every 30 seconds
    const interval = setInterval(fetchSyncData, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  const fetchSyncData = async () => {
    try {
      // Fetch recent sync history
      const { data: syncData, error: syncError } = await supabase
        .from('gp51_sync_status')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (syncError) throw syncError;

      setSyncHistory(syncData || []);

      // Calculate metrics
      if (syncData && syncData.length > 0) {
        const totalSyncs = syncData.length;
        const successfulSyncs = syncData.filter(s => s.status === 'completed').length;
        const failedSyncs = syncData.filter(s => s.status === 'failed').length;
        const lastSyncTime = syncData[0]?.created_at || null;
        
        // Calculate average duration for completed syncs
        const completedSyncs = syncData.filter(s => s.status === 'completed' && s.sync_details?.duration_ms);
        const averageDuration = completedSyncs.length > 0 
          ? completedSyncs.reduce((acc, sync) => acc + (sync.sync_details?.duration_ms || 0), 0) / completedSyncs.length
          : null;

        setMetrics({
          totalSyncs,
          successfulSyncs,
          failedSyncs,
          lastSyncTime,
          averageDuration
        });
      }
    } catch (error) {
      console.error('Failed to fetch sync data:', error);
      toast({
        title: "Error",
        description: "Failed to load sync status",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      case 'running': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.round(diffMins / 60)}h ago`;
    return `${Math.round(diffMins / 1440)}d ago`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5" />
            <span>GP51 Sync Monitor</span>
          </CardTitle>
          <CardDescription>Loading sync status...</CardDescription>
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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5" />
              <span>GP51 Sync Monitor</span>
            </CardTitle>
            <CardDescription>
              Real-time monitoring of GP51 synchronization jobs
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchSyncData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Metrics Overview */}
        {metrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{metrics.totalSyncs}</div>
              <div className="text-sm text-blue-600">Total Syncs</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{metrics.successfulSyncs}</div>
              <div className="text-sm text-green-600">Successful</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{metrics.failedSyncs}</div>
              <div className="text-sm text-red-600">Failed</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-bold text-gray-600">
                {formatDuration(metrics.averageDuration)}
              </div>
              <div className="text-sm text-gray-600">Avg Duration</div>
            </div>
          </div>
        )}

        {/* Recent Sync History */}
        <div>
          <h3 className="text-lg font-medium mb-4 flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Recent Sync Jobs</span>
          </h3>
          
          {syncHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No sync jobs found. Sync jobs will appear here once started.
            </div>
          ) : (
            <div className="space-y-3">
              {syncHistory.map((sync) => (
                <div key={sync.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(sync.status)}
                      <div>
                        <div className="font-medium capitalize">{sync.sync_type.replace('_', ' ')}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatDateTime(sync.started_at)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(sync.status)}>
                        {sync.status}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {getRelativeTime(sync.started_at)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Total: </span>
                      <span className="font-medium">{sync.total_devices || 0}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Success: </span>
                      <span className="font-medium text-green-600">{sync.successful_syncs || 0}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Failed: </span>
                      <span className="font-medium text-red-600">{sync.failed_syncs || 0}</span>
                    </div>
                  </div>
                  
                  {sync.sync_details?.duration_ms && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      Duration: {formatDuration(sync.sync_details.duration_ms)}
                    </div>
                  )}
                  
                  {sync.error_log && Array.isArray(sync.error_log) && sync.error_log.length > 0 && (
                    <div className="mt-2 text-sm text-red-600">
                      Latest error: {sync.error_log[0]?.message || 'Unknown error'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default GP51SyncMonitor;
