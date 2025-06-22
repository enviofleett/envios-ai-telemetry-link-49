import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Activity, TrendingUp, AlertTriangle, CheckCircle, Clock, Database } from 'lucide-react';
import { SyncStatus, SyncAnalyticsSummary } from './types/syncTypes';
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

const GP51AnalyticsDashboard: React.FC = () => {
  const [syncHistory, setSyncHistory] = useState<SyncStatus[]>([]);
  const [analyticsSummary, setAnalyticsSummary] = useState<SyncAnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSyncAnalytics();
  }, []);

  const fetchSyncAnalytics = async () => {
    try {
      setIsLoading(true);
      
      // Fetch recent sync history
      const { data: syncData, error: syncError } = await supabase
        .from('gp51_sync_status')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (syncError) throw syncError;

      setSyncHistory(syncData || []);

      // Calculate analytics summary
      if (syncData && syncData.length > 0) {
        const totalSyncs = syncData.length;
        const successfulSyncs = syncData.filter(s => s.status === 'completed').length;
        const failedSyncs = syncData.filter(s => s.status === 'failed').length;
        const successRate = totalSyncs > 0 ? (successfulSyncs / totalSyncs) * 100 : 0;
        
        // Calculate average duration for completed syncs
        const completedSyncs = syncData.filter(s => s.status === 'completed' && s.completed_at);
        let averageDuration = 0;
        if (completedSyncs.length > 0) {
          const totalDuration = completedSyncs.reduce((sum, sync) => {
            const start = new Date(sync.started_at).getTime();
            const end = new Date(sync.completed_at!).getTime();
            return sum + (end - start);
          }, 0);
          averageDuration = totalDuration / completedSyncs.length / 1000; // Convert to seconds
        }

        const totalDevices = syncData.reduce((sum, sync) => {
          return sum + extractNumber(sync.sync_details, 'total_devices', sync.total_devices || 0);
        }, 0);

        setAnalyticsSummary({
          total_devices: totalDevices,
          successful_syncs: successfulSyncs,
          failed_syncs: failedSyncs,
          success_rate: successRate,
          average_sync_duration: averageDuration,
          last_sync_time: syncData[0]?.created_at || null
        });
      }
    } catch (error) {
      console.error('Error fetching sync analytics:', error);
      toast({
        title: "Error",
        description: "Failed to fetch sync analytics",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>;
      case 'running':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Running</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">GP51 Analytics Dashboard</h2>
        <p className="text-gray-600">Monitor sync performance and system health</p>
      </div>

      {analyticsSummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsSummary.total_devices}</div>
              <p className="text-xs text-muted-foreground">Connected devices</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsSummary.success_rate.toFixed(1)}%</div>
              <Progress value={analyticsSummary.success_rate} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatDuration(analyticsSummary.average_sync_duration)}
              </div>
              <p className="text-xs text-muted-foreground">Per sync operation</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Sync</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-bold">
                {analyticsSummary.last_sync_time ? 
                  new Date(analyticsSummary.last_sync_time).toLocaleString() : 
                  'No recent syncs'
                }
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent Sync History</CardTitle>
          <CardDescription>Last 10 synchronization operations</CardDescription>
        </CardHeader>
        <CardContent>
          {syncHistory.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>No sync history available</AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {syncHistory.map((sync) => (
                <div key={sync.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium">{sync.sync_type}</h4>
                        {getStatusBadge(sync.status)}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Started: {new Date(sync.started_at).toLocaleString()}
                      </p>
                      {sync.completed_at && (
                        <p className="text-sm text-gray-600">
                          Completed: {new Date(sync.completed_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">
                      <span className="text-green-600">{sync.successful_syncs} success</span>
                      {sync.failed_syncs > 0 && (
                        <span className="text-red-600 ml-2">{sync.failed_syncs} failed</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {extractNumber(sync.sync_details, 'total_devices', sync.total_devices || 0)} devices
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={fetchSyncAnalytics} variant="outline">
          <Activity className="h-4 w-4 mr-2" />
          Refresh Analytics
        </Button>
      </div>
    </div>
  );
};

export default GP51AnalyticsDashboard;
