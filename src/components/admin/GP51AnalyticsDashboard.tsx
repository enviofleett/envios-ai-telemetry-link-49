
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, TrendingUp, Activity, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { SyncStatus } from '../types/syncTypes';
import { Json } from '@/integrations/supabase/types';

// Type-safe helper functions for Json data
const getSyncDetailsProperty = (syncDetails: Json, property: string): number => {
  if (typeof syncDetails === 'object' && syncDetails !== null && !Array.isArray(syncDetails)) {
    const value = (syncDetails as Record<string, any>)[property];
    return typeof value === 'number' ? value : 0;
  }
  return 0;
};

const isValidSyncDetails = (syncDetails: Json): syncDetails is Record<string, any> => {
  return typeof syncDetails === 'object' && syncDetails !== null && !Array.isArray(syncDetails);
};

const GP51AnalyticsDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const { data: syncHistory, isLoading } = useQuery({
    queryKey: ['gp51-sync-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gp51_sync_status')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as SyncStatus[];
    },
  });

  const { data: syncMetrics } = useQuery({
    queryKey: ['gp51-sync-metrics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gp51_sync_status')
        .select('status, total_devices, successful_syncs, failed_syncs, sync_details')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      
      const totalSyncs = data?.length || 0;
      const successfulSyncs = data?.filter(s => s.status === 'completed').length || 0;
      const avgDevices = data?.reduce((sum, s) => sum + (s.total_devices || 0), 0) / Math.max(totalSyncs, 1);
      
      return {
        totalSyncs,
        successfulSyncs,
        failedSyncs: totalSyncs - successfulSyncs,
        successRate: totalSyncs > 0 ? (successfulSyncs / totalSyncs) * 100 : 0,
        avgDevicesPerSync: Math.round(avgDevices),
        totalDevicesSynced: data?.reduce((sum, s) => sum + (s.successful_syncs || 0), 0) || 0
      };
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const recentSyncs = syncHistory?.slice(0, 10) || [];
  const performanceData = syncHistory?.slice(0, 30).map(sync => ({
    date: new Date(sync.created_at).toLocaleDateString(),
    devices: sync.total_devices || 0,
    success_rate: sync.total_devices > 0 ? ((sync.successful_syncs || 0) / sync.total_devices) * 100 : 0,
    duration: isValidSyncDetails(sync.sync_details) ? getSyncDetailsProperty(sync.sync_details, 'duration_minutes') : 0
  })) || [];

  return (
    <div className="space-y-6">
      {/* Analytics Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Syncs</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{syncMetrics?.totalSyncs || 0}</div>
            <p className="text-xs text-muted-foreground">
              All time sync operations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{syncMetrics?.successRate.toFixed(1) || 0}%</div>
            <Progress value={syncMetrics?.successRate || 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Devices Synced</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{syncMetrics?.totalDevicesSynced || 0}</div>
            <p className="text-xs text-muted-foreground">
              Avg {syncMetrics?.avgDevicesPerSync || 0} per sync
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Syncs</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{syncMetrics?.failedSyncs || 0}</div>
            <p className="text-xs text-muted-foreground">
              Requires attention
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Sync Activity</CardTitle>
              <CardDescription>Latest synchronization operations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentSyncs.map((sync) => (
                  <div key={sync.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {sync.status === 'completed' ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : sync.status === 'failed' ? (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      ) : (
                        <Clock className="h-5 w-5 text-yellow-500" />
                      )}
                      <div>
                        <p className="font-medium">{sync.sync_type}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(sync.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={sync.status === 'completed' ? 'default' : sync.status === 'failed' ? 'destructive' : 'secondary'}>
                        {sync.status}
                      </Badge>
                      <p className="text-sm text-gray-500 mt-1">
                        {sync.successful_syncs || 0}/{sync.total_devices || 0} devices
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>Sync performance over the last 30 operations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {performanceData.slice(0, 10).map((data, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex justify-between text-sm">
                        <span>{data.date}</span>
                        <span>{data.devices} devices</span>
                      </div>
                      <Progress value={data.success_rate} className="mt-1" />
                    </div>
                    <div className="ml-4 text-right">
                      <div className="text-sm font-medium">{data.success_rate.toFixed(1)}%</div>
                      <div className="text-xs text-gray-500">{data.duration}min</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sync History</CardTitle>
              <CardDescription>Complete synchronization history</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {syncHistory?.map((sync) => (
                  <div key={sync.id} className="flex items-center justify-between p-2 border-b">
                    <div className="flex items-center space-x-2">
                      <Badge variant={sync.status === 'completed' ? 'default' : 'destructive'}>
                        {sync.status}
                      </Badge>
                      <span className="text-sm">{sync.sync_type}</span>
                    </div>
                    <div className="text-right text-sm">
                      <div>{sync.successful_syncs || 0}/{sync.total_devices || 0}</div>
                      <div className="text-gray-500">
                        {new Date(sync.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GP51AnalyticsDashboard;
