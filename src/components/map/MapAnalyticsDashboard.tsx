
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  Cell
} from 'recharts';
import { mapAnalyticsService } from '@/services/mapAnalytics';
import { Calendar, TrendingUp, Activity, MapPin, Clock } from 'lucide-react';

interface AnalyticsData {
  totalEvents: number;
  uniqueSessions: number;
  avgLoadTime: number;
  popularActions: Array<{ action: string; count: number }>;
  performanceMetrics: Array<{ date: string; loadTime: number; renderTime: number }>;
  zoomDistribution: Array<{ zoom: string; count: number }>;
}

const MapAnalyticsDashboard: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [dateRange, setDateRange] = useState('7d');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const endDate = new Date();
      const startDate = new Date();
      
      switch (dateRange) {
        case '1d':
          startDate.setDate(endDate.getDate() - 1);
          break;
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        default:
          startDate.setDate(endDate.getDate() - 7);
      }

      const [analytics, performance] = await Promise.all([
        mapAnalyticsService.getAnalytics({ start: startDate, end: endDate }),
        mapAnalyticsService.getPerformanceMetrics({ start: startDate, end: endDate })
      ]);

      // Process data
      const uniqueSessions = new Set(analytics.map(a => a.session_id)).size;
      const actionCounts = analytics.reduce((acc, event) => {
        acc[event.action_type] = (acc[event.action_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const popularActions = Object.entries(actionCounts)
        .map(([action, count]) => ({ action, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const loadTimeMetrics = performance.filter(p => p.metric_type === 'load_time');
      const avgLoadTime = loadTimeMetrics.length > 0 
        ? loadTimeMetrics.reduce((sum, m) => sum + m.metric_value, 0) / loadTimeMetrics.length
        : 0;

      // Group performance by date
      const performanceByDate = performance.reduce((acc, metric) => {
        const date = new Date(metric.created_at).toLocaleDateString();
        if (!acc[date]) {
          acc[date] = { date, loadTime: 0, renderTime: 0, loadCount: 0, renderCount: 0 };
        }
        
        if (metric.metric_type === 'load_time') {
          acc[date].loadTime += metric.metric_value;
          acc[date].loadCount++;
        } else if (metric.metric_type === 'render_time') {
          acc[date].renderTime += metric.metric_value;
          acc[date].renderCount++;
        }
        
        return acc;
      }, {} as Record<string, any>);

      const performanceMetrics = Object.values(performanceByDate).map((day: any) => ({
        date: day.date,
        loadTime: day.loadCount > 0 ? Math.round(day.loadTime / day.loadCount) : 0,
        renderTime: day.renderCount > 0 ? Math.round(day.renderTime / day.renderCount) : 0
      }));

      // Zoom distribution
      const zoomCounts = analytics.reduce((acc, event) => {
        if (event.zoom_level) {
          const zoomRange = `${Math.floor(event.zoom_level / 2) * 2}-${Math.floor(event.zoom_level / 2) * 2 + 1}`;
          acc[zoomRange] = (acc[zoomRange] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      const zoomDistribution = Object.entries(zoomCounts)
        .map(([zoom, count]) => ({ zoom, count }))
        .sort((a, b) => parseInt(a.zoom) - parseInt(b.zoom));

      setAnalyticsData({
        totalEvents: analytics.length,
        uniqueSessions,
        avgLoadTime: Math.round(avgLoadTime),
        popularActions,
        performanceMetrics,
        zoomDistribution
      });
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">No analytics data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Map Analytics Dashboard</h2>
          <p className="text-gray-600">Monitor map usage and performance metrics</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={loadAnalytics} variant="outline">
            <Activity className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Events</p>
                <p className="text-2xl font-bold">{analyticsData.totalEvents.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">Unique Sessions</p>
                <p className="text-2xl font-bold">{analyticsData.uniqueSessions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Load Time</p>
                <p className="text-2xl font-bold">{analyticsData.avgLoadTime}ms</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">Events/Session</p>
                <p className="text-2xl font-bold">
                  {analyticsData.uniqueSessions > 0 
                    ? Math.round(analyticsData.totalEvents / analyticsData.uniqueSessions)
                    : 0
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Popular Map Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.popularActions}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="action" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData.performanceMetrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="loadTime" stroke="#10B981" name="Load Time (ms)" />
                <Line type="monotone" dataKey="renderTime" stroke="#F59E0B" name="Render Time (ms)" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Zoom Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Zoom Level Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData.zoomDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ zoom, percent }) => `${zoom}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {analyticsData.zoomDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Usage Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Usage Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.popularActions.map((action, index) => (
                <div key={action.action} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{action.action}</Badge>
                    <span className="text-sm text-gray-600">
                      {((action.count / analyticsData.totalEvents) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <span className="font-medium">{action.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MapAnalyticsDashboard;
