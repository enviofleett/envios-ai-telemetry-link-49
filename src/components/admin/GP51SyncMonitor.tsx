
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Play, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SyncStatus {
  id: string;
  sync_type: string;
  started_at: string;
  completed_at?: string;
  status: string;
  total_devices: number;
  successful_syncs: number;
  failed_syncs: number;
  error_log: any[];
  sync_details: any;
}

const GP51SyncMonitor: React.FC = () => {
  const [isTriggering, setIsTriggering] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch sync status history
  const { data: syncHistory, isLoading, refetch } = useQuery({
    queryKey: ['gp51-sync-status'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gp51_sync_status')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as SyncStatus[];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Trigger manual sync
  const triggerSyncMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('syncGp51Vehicles', {
        body: { manual_trigger: true }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: 'Sync Triggered',
        description: data.success ? 'Vehicle sync completed successfully' : `Sync completed with ${data.failedSyncs} errors`,
        variant: data.success ? 'default' : 'destructive',
      });
      queryClient.invalidateQueries({ queryKey: ['gp51-sync-status'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle-metrics'] });
    },
    onError: (error) => {
      toast({
        title: 'Sync Failed',
        description: error instanceof Error ? error.message : 'Failed to trigger sync',
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setIsTriggering(false);
    },
  });

  const handleTriggerSync = () => {
    setIsTriggering(true);
    triggerSyncMutation.mutate();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'running':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Running</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const duration = Math.round((end.getTime() - start.getTime()) / 1000);
    
    if (duration < 60) return `${duration}s`;
    if (duration < 3600) return `${Math.round(duration / 60)}m`;
    return `${Math.round(duration / 3600)}h`;
  };

  const latestSync = syncHistory?.[0];

  return (
    <div className="space-y-6">
      {/* Sync Control Panel */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                GP51 Vehicle Sync Monitor
              </CardTitle>
              <CardDescription>
                Monitor and control GP51 vehicle synchronization
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                onClick={handleTriggerSync}
                disabled={isTriggering || latestSync?.status === 'running'}
                size="sm"
              >
                <Play className={`h-4 w-4 mr-1 ${isTriggering ? 'animate-spin' : ''}`} />
                Trigger Sync
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {latestSync && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{latestSync.total_devices}</div>
                <div className="text-sm text-blue-800">Total Devices</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{latestSync.successful_syncs}</div>
                <div className="text-sm text-green-800">Successful</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{latestSync.failed_syncs}</div>
                <div className="text-sm text-red-800">Failed</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {formatDuration(latestSync.started_at, latestSync.completed_at)}
                </div>
                <div className="text-sm text-purple-800">Duration</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sync History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sync History</CardTitle>
          <CardDescription>
            Last 10 synchronization attempts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              Loading sync history...
            </div>
          ) : syncHistory && syncHistory.length > 0 ? (
            <div className="space-y-4">
              {syncHistory.map((sync) => (
                <div key={sync.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div>
                      {getStatusBadge(sync.status)}
                    </div>
                    <div>
                      <div className="font-medium">
                        {sync.sync_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(sync.started_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">
                      {sync.total_devices} devices • {sync.successful_syncs} success • {sync.failed_syncs} failed
                    </div>
                    <div className="text-xs text-gray-500">
                      Duration: {formatDuration(sync.started_at, sync.completed_at)}
                    </div>
                  </div>
                  {sync.error_log && sync.error_log.length > 0 && (
                    <div className="ml-4">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No sync history available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GP51SyncMonitor;
