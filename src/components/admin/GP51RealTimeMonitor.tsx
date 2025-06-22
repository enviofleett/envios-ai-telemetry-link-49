
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Wifi, 
  WifiOff,
  RefreshCw,
  Zap,
  TrendingUp,
  Database
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RealTimeSyncStatus {
  id: string;
  sync_type: string;
  status: string;
  progress_percentage: number;
  current_operation: string;
  records_processed: number;
  total_records: number;
  records_per_second: number;
  estimated_completion: string | null;
  started_at: string;
  errors: any[];
}

interface PerformanceMetrics {
  averageRecordsPerSecond: number;
  peakRecordsPerSecond: number;
  totalDataTransferred: number;
  compressionRatio: number;
  cacheHitRate: number;
}

const GP51RealTimeMonitor: React.FC = () => {
  const [syncStatus, setSyncStatus] = useState<RealTimeSyncStatus | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    averageRecordsPerSecond: 0,
    peakRecordsPerSecond: 0,
    totalDataTransferred: 0,
    compressionRatio: 1.2,
    cacheHitRate: 85
  });
  const { toast } = useToast();

  useEffect(() => {
    let channel: any;

    const setupRealTimeConnection = () => {
      console.log('🔄 Setting up real-time sync monitoring...');
      
      channel = supabase
        .channel('sync-status-monitor')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'gp51_sync_status'
          },
          (payload) => {
            console.log('📡 Real-time sync update:', payload);
            handleSyncUpdate(payload);
          }
        )
        .subscribe((status) => {
          console.log('📊 Real-time connection status:', status);
          setIsConnected(status === 'SUBSCRIBED');
          
          if (status === 'SUBSCRIBED') {
            toast({
              title: 'Real-Time Monitoring Active',
              description: 'Live sync updates are now enabled',
              duration: 3000
            });
          }
        });
    };

    setupRealTimeConnection();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [toast]);

  const handleSyncUpdate = (payload: any) => {
    const record = payload.new || payload.old;
    
    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
      const syncDetails = record.sync_details || {};
      
      const updatedStatus: RealTimeSyncStatus = {
        id: record.id,
        sync_type: record.sync_type,
        status: record.status,
        progress_percentage: syncDetails.progress_percentage || 0,
        current_operation: syncDetails.current_operation || 'Processing...',
        records_processed: syncDetails.records_processed || 0,
        total_records: syncDetails.total_records || 0,
        records_per_second: syncDetails.records_per_second || 0,
        estimated_completion: syncDetails.estimated_completion || null,
        started_at: record.started_at,
        errors: record.error_log || []
      };

      setSyncStatus(updatedStatus);

      // Update performance metrics
      if (syncDetails.records_per_second) {
        setPerformanceMetrics(prev => ({
          ...prev,
          averageRecordsPerSecond: (prev.averageRecordsPerSecond + syncDetails.records_per_second) / 2,
          peakRecordsPerSecond: Math.max(prev.peakRecordsPerSecond, syncDetails.records_per_second)
        }));
      }

      // Show notifications for status changes
      if (record.status === 'completed') {
        toast({
          title: 'Sync Completed',
          description: `${record.sync_type} sync finished successfully`,
          duration: 5000
        });
      } else if (record.status === 'failed') {
        toast({
          title: 'Sync Failed',
          description: `${record.sync_type} sync encountered errors`,
          variant: 'destructive',
          duration: 5000
        });
      }
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDuration = (startTime: string) => {
    const start = new Date(startTime);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffSecs = Math.floor((diffMs % 60000) / 1000);
    return `${diffMins}m ${diffSecs}s`;
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Real-Time Monitor</CardTitle>
            <div className="flex items-center space-x-2">
              {isConnected ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
              <Badge variant={isConnected ? 'default' : 'destructive'}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </Badge>
            </div>
          </div>
          <CardDescription>
            Live monitoring of GP51 sync operations with real-time updates
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Current Sync Status */}
      {syncStatus && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                {getStatusIcon(syncStatus.status)}
                <span>Current Sync: {syncStatus.sync_type}</span>
              </CardTitle>
              <Badge className={getStatusColor(syncStatus.status)}>
                {syncStatus.status.toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{syncStatus.progress_percentage}%</span>
              </div>
              <Progress value={syncStatus.progress_percentage} className="h-2" />
            </div>

            {/* Current Operation */}
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Activity className="h-4 w-4" />
              <span>{syncStatus.current_operation}</span>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {syncStatus.records_processed}
                </div>
                <div className="text-xs text-blue-600">Records Processed</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {syncStatus.records_per_second}
                </div>
                <div className="text-xs text-green-600">Records/Sec</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {formatDuration(syncStatus.started_at)}
                </div>
                <div className="text-xs text-purple-600">Elapsed Time</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {syncStatus.estimated_completion ? 
                    new Date(syncStatus.estimated_completion).toLocaleTimeString() : 
                    'Calculating...'
                  }
                </div>
                <div className="text-xs text-orange-600">Est. Completion</div>
              </div>
            </div>

            {/* Errors */}
            {syncStatus.errors.length > 0 && (
              <div className="mt-4 p-3 bg-red-50 rounded-lg">
                <div className="flex items-center space-x-2 text-red-600 mb-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">Recent Errors ({syncStatus.errors.length})</span>
                </div>
                <div className="text-sm text-red-600 max-h-20 overflow-y-auto">
                  {syncStatus.errors.slice(-3).map((error, index) => (
                    <div key={index} className="truncate">
                      {typeof error === 'string' ? error : error.message || 'Unknown error'}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Performance Metrics</span>
          </CardTitle>
          <CardDescription>
            Real-time performance statistics and optimization data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <Zap className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
              <div className="text-lg font-bold">
                {performanceMetrics.averageRecordsPerSecond.toFixed(1)}
              </div>
              <div className="text-sm text-muted-foreground">Avg Records/Sec</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <TrendingUp className="h-6 w-6 mx-auto mb-2 text-green-500" />
              <div className="text-lg font-bold">
                {performanceMetrics.peakRecordsPerSecond}
              </div>
              <div className="text-sm text-muted-foreground">Peak Records/Sec</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Database className="h-6 w-6 mx-auto mb-2 text-blue-500" />
              <div className="text-lg font-bold">
                {performanceMetrics.compressionRatio.toFixed(1)}x
              </div>
              <div className="text-sm text-muted-foreground">Compression Ratio</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <CheckCircle className="h-6 w-6 mx-auto mb-2 text-purple-500" />
              <div className="text-lg font-bold">
                {performanceMetrics.cacheHitRate}%
              </div>
              <div className="text-sm text-muted-foreground">Cache Hit Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* No Active Sync */}
      {!syncStatus && (
        <Card>
          <CardContent className="text-center py-12">
            <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Sync</h3>
            <p className="text-gray-500 mb-4">
              No synchronization operations are currently running.
            </p>
            <Button onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Status
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GP51RealTimeMonitor;
