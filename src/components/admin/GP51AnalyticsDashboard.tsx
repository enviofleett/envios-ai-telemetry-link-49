
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  Calendar, 
  Download, 
  Filter,
  Clock,
  Database,
  Activity,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SyncAnalytics {
  totalSyncs: number;
  successfulSyncs: number;
  failedSyncs: number;
  averageDuration: number;
  dataVolume: number;
  lastSyncTime: string | null;
}

interface TrendData {
  date: string;
  syncs: number;
  success_rate: number;
  duration: number;
  data_volume: number;
}

interface ErrorAnalytics {
  type: string;
  count: number;
  percentage: number;
  color: string;
}

const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6'];

const GP51AnalyticsDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<SyncAnalytics>({
    totalSyncs: 0,
    successfulSyncs: 0,
    failedSyncs: 0,
    averageDuration: 0,
    dataVolume: 0,
    lastSyncTime: null
  });

  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [errorAnalytics, setErrorAnalytics] = useState<ErrorAnalytics[]>([]);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadAnalytics();
    loadTrendData();
    loadErrorAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      const { data, error } = await supabase
        .from('gp51_sync_status')
        .select('*')
        .gte('created_at', getDateRange())
        .order('created_at', { ascending: false });

      if (error) throw error;

      const totalSyncs = data.length;
      const successfulSyncs = data.filter(s => s.status === 'completed').length;
      const failedSyncs = data.filter(s => s.status === 'failed').length;
      
      const completedSyncs = data.filter(s => s.status === 'completed' && s.started_at && s.completed_at);
      const averageDuration = completedSyncs.length > 0 
        ? completedSyncs.reduce((sum, sync) => {
            const duration = new Date(sync.completed_at).getTime() - new Date(sync.started_at).getTime();
            return sum + (duration / 1000 / 60); // Convert to minutes
          }, 0) / completedSyncs.length
        : 0;

      const dataVolume = data.reduce((sum, sync) => {
        const details = sync.sync_details || {};
        return sum + (details.total_devices || 0);
      }, 0);

      setAnalytics({
        totalSyncs,
        successfulSyncs,
        failedSyncs,
        averageDuration,
        dataVolume,
        lastSyncTime: data.length > 0 ? data[0].created_at : null
      });
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  };

  const loadTrendData = async () => {
    try {
      const { data, error } = await supabase
        .from('gp51_sync_status')
        .select('*')
        .gte('created_at', getDateRange())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group data by date
      const groupedData = data.reduce((acc, sync) => {
        const date = new Date(sync.created_at).toISOString().split('T')[0];
        
        if (!acc[date]) {
          acc[date] = {
            date,
            syncs: 0,
            successful: 0,
            total_duration: 0,
            completed_count: 0,
            data_volume: 0
          };
        }
        
        acc[date].syncs += 1;
        if (sync.status === 'completed') {
          acc[date].successful += 1;
          if (sync.started_at && sync.completed_at) {
            const duration = new Date(sync.completed_at).getTime() - new Date(sync.started_at).getTime();
            acc[date].total_duration += (duration / 1000 / 60);
            acc[date].completed_count += 1;
          }
        }
        
        const details = sync.sync_details || {};
        acc[date].data_volume += (details.total_devices || 0);
        
        return acc;
      }, {} as any);

      const trendArray = Object.values(groupedData).map((day: any) => ({
        date: day.date,
        syncs: day.syncs,
        success_rate: day.syncs > 0 ? (day.successful / day.syncs * 100) : 0,
        duration: day.completed_count > 0 ? (day.total_duration / day.completed_count) : 0,
        data_volume: day.data_volume
      }));

      setTrendData(trendArray);
    } catch (error) {
      console.error('Failed to load trend data:', error);
    }
  };

  const loadErrorAnalytics = async () => {
    try {
      const { data, error } = await supabase
        .from('gp51_sync_status')
        .select('error_log')
        .eq('status', 'failed')
        .gte('created_at', getDateRange());

      if (error) throw error;

      const errorTypes = data.reduce((acc, sync) => {
        const errorLog = sync.error_log;
        let errorType = 'Unknown';

        if (errorLog) {
          const errorStr = JSON.stringify(errorLog).toLowerCase();
          if (errorStr.includes('auth') || errorStr.includes('token')) {
            errorType = 'Authentication';
          } else if (errorStr.includes('network') || errorStr.includes('timeout')) {
            errorType = 'Network';
          } else if (errorStr.includes('rate') || errorStr.includes('limit')) {
            errorType = 'Rate Limit';
          } else if (errorStr.includes('validation') || errorStr.includes('data')) {
            errorType = 'Data Validation';
          } else {
            errorType = 'API Error';
          }
        }

        acc[errorType] = (acc[errorType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const total = Object.values(errorTypes).reduce((sum, count) => sum + count, 0);
      
      const errorAnalyticsArray = Object.entries(errorTypes).map(([type, count], index) => ({
        type,
        count,
        percentage: total > 0 ? (count / total * 100) : 0,
        color: COLORS[index % COLORS.length]
      }));

      setErrorAnalytics(errorAnalyticsArray);
    } catch (error) {
      console.error('Failed to load error analytics:', error);
    }
  };

  const getDateRange = () => {
    const now = new Date();
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const startDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
    return startDate.toISOString();
  };

  const generateReport = async () => {
    setIsGeneratingReport(true);
    try {
      // Generate comprehensive report
      const reportData = {
        period: timeRange,
        analytics,
        trendData,
        errorAnalytics,
        generatedAt: new Date().toISOString()
      };

      // Convert to CSV or JSON for download
      const reportContent = JSON.stringify(reportData, null, 2);
      const blob = new Blob([reportContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `gp51-sync-report-${timeRange}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Report Generated',
        description: 'Sync analytics report has been downloaded',
        duration: 5000
      });
    } catch (error) {
      toast({
        title: 'Report Generation Failed',
        description: 'Failed to generate analytics report',
        variant: 'destructive',
        duration: 5000
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const getSuccessRate = () => {
    return analytics.totalSyncs > 0 ? (analytics.successfulSyncs / analytics.totalSyncs * 100) : 0;
  };

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Sync Analytics Dashboard</span>
              </CardTitle>
              <CardDescription>
                Comprehensive analytics and reporting for GP51 synchronization operations
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                {(['7d', '30d', '90d'] as const).map((range) => (
                  <Button
                    key={range}
                    variant={timeRange === range ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTimeRange(range)}
                  >
                    {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
                  </Button>
                ))}
              </div>
              <Button
                onClick={generateReport}
                disabled={isGeneratingReport}
                className="flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Export Report</span>
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Database className="h-6 w-6 mx-auto mb-2 text-blue-500" />
            <div className="text-2xl font-bold text-blue-600">{analytics.totalSyncs}</div>
            <div className="text-sm text-muted-foreground">Total Syncs</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-500" />
            <div className="text-2xl font-bold text-green-600">{getSuccessRate().toFixed(1)}%</div>
            <div className="text-sm text-muted-foreground">Success Rate</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-red-500" />
            <div className="text-2xl font-bold text-red-600">{analytics.failedSyncs}</div>
            <div className="text-sm text-muted-foreground">Failed Syncs</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-6 w-6 mx-auto mb-2 text-purple-500" />
            <div className="text-2xl font-bold text-purple-600">{analytics.averageDuration.toFixed(1)}m</div>
            <div className="text-sm text-muted-foreground">Avg Duration</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Activity className="h-6 w-6 mx-auto mb-2 text-orange-500" />
            <div className="text-2xl font-bold text-orange-600">{analytics.dataVolume.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Records Synced</div>
          </CardContent>
        </Card>
      </div>

      {/* Trend Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sync Success Rate Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Success Rate Trend</CardTitle>
            <CardDescription>Daily sync success rate over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="success_rate" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Success Rate (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sync Volume and Duration */}
        <Card>
          <CardHeader>
            <CardTitle>Sync Volume & Duration</CardTitle>
            <CardDescription>Daily sync count and average duration</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="syncs" 
                  stackId="1" 
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.6}
                  name="Sync Count"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Error Analysis and Data Volume */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Error Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Error Type Distribution</CardTitle>
            <CardDescription>Breakdown of sync errors by category</CardDescription>
          </CardHeader>
          <CardContent>
            {errorAnalytics.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={errorAnalytics}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ type, percentage }) => `${type} (${percentage.toFixed(1)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {errorAnalytics.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12">
                <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Errors</h3>
                <p className="text-gray-500">
                  No sync errors found in the selected time period.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Data Volume Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Data Volume Trend</CardTitle>
            <CardDescription>Daily data synchronization volume</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar 
                  dataKey="data_volume" 
                  fill="#8b5cf6" 
                  name="Records Synced"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity Summary</CardTitle>
          <CardDescription>Latest sync operations and their status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium">Last Sync</span>
              <span className="text-sm text-muted-foreground">
                {analytics.lastSyncTime 
                  ? new Date(analytics.lastSyncTime).toLocaleString()
                  : 'No recent syncs'
                }
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="text-sm font-medium">Success Rate ({timeRange})</span>
              <Badge className="bg-green-100 text-green-800">
                {getSuccessRate().toFixed(1)}%
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium">Average Duration</span>
              <span className="text-sm text-blue-700 font-medium">
                {analytics.averageDuration.toFixed(1)} minutes
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GP51AnalyticsDashboard;
