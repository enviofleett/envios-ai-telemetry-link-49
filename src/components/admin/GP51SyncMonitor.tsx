
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { SyncStatus, SyncMetrics } from './types/syncTypes';

const GP51SyncMonitor: React.FC = () => {
  const [syncHistory, setSyncHistory] = useState<SyncStatus[]>([]);
  const [metrics, setMetrics] = useState<SyncMetrics>({
    totalSyncs: 0,
    successfulSyncs: 0,
    failedSyncs: 0,
    lastSyncTime: null,
    averageDuration: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);

  const fetchSyncHistory = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('gp51_sync_status')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      const syncData: SyncStatus[] = data || [];
      setSyncHistory(syncData);

      // Calculate metrics
      const completed = syncData.filter(s => s.status === 'completed');
      const failed = syncData.filter(s => s.status === 'failed');
      
      setMetrics({
        totalSyncs: syncData.length,
        successfulSyncs: completed.length,
        failedSyncs: failed.length,
        lastSyncTime: syncData.length > 0 ? syncData[0].created_at : null,
        averageDuration: null // Could calculate if we had duration data
      });

    } catch (error) {
      console.error('Error fetching sync history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const triggerManualSync = async () => {
    setIsTriggering(true);
    try {
      const { data, error } = await supabase.functions.invoke('syncGp51Vehicles', {
        body: { manual: true }
      });

      if (error) throw error;

      // Refresh the sync history after triggering
      setTimeout(() => {
        fetchSyncHistory();
      }, 2000);

    } catch (error) {
      console.error('Error triggering sync:', error);
    } finally {
      setIsTriggering(false);
    }
  };

  useEffect(() => {
    fetchSyncHistory();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'running':
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'default',
      failed: 'destructive',
      running: 'secondary',
      pending: 'outline'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <RefreshCw className="h-5 w-5 text-blue-600" />
              <div>
                <div className="font-semibold">{metrics.totalSyncs}</div>
                <div className="text-sm text-muted-foreground">Total Syncs</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <div className="font-semibold">{metrics.successfulSyncs}</div>
                <div className="text-sm text-muted-foreground">Successful</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <div>
                <div className="font-semibold">{metrics.failedSyncs}</div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-gray-600" />
              <div>
                <div className="font-semibold">
                  {metrics.lastSyncTime 
                    ? new Date(metrics.lastSyncTime).toLocaleTimeString()
                    : 'Never'
                  }
                </div>
                <div className="text-sm text-muted-foreground">Last Sync</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sync Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Sync Controls</CardTitle>
          <CardDescription>
            Manually trigger synchronization or refresh the sync history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Button 
              onClick={triggerManualSync} 
              disabled={isTriggering}
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`h-4 w-4 ${isTriggering ? 'animate-spin' : ''}`} />
              <span>{isTriggering ? 'Syncing...' : 'Trigger Sync'}</span>
            </Button>
            <Button 
              variant="outline" 
              onClick={fetchSyncHistory}
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Refresh History'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sync History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sync History</CardTitle>
          <CardDescription>
            Latest 10 synchronization attempts with GP51 platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          {syncHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No sync history available
            </div>
          ) : (
            <div className="space-y-3">
              {syncHistory.map((sync) => (
                <div key={sync.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(sync.status)}
                    <div>
                      <div className="font-medium">{sync.sync_type}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(sync.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-sm">
                      {sync.successful_syncs > 0 && (
                        <span className="text-green-600">
                          {sync.successful_syncs} successful
                        </span>
                      )}
                      {sync.failed_syncs > 0 && (
                        <span className="text-red-600 ml-2">
                          {sync.failed_syncs} failed
                        </span>
                      )}
                    </div>
                    {getStatusBadge(sync.status)}
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

export default GP51SyncMonitor;
