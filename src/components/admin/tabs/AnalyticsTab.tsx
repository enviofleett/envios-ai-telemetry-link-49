
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, TrendingUp, Users, Car, Activity, Download, RefreshCw } from 'lucide-react';
import { useAnalyticsData } from '@/hooks/useAnalyticsData';

const AnalyticsTab: React.FC = () => {
  const [timeRange, setTimeRange] = useState('7d');
  const { data: analytics, isLoading, error, refetch } = useAnalyticsData();

  const handleExportReport = () => {
    // TODO: Implement actual export functionality
    const data = JSON.stringify(analytics, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="grid grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-20 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Error loading analytics: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            No analytics data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const metrics = [
    {
      title: 'Total Users',
      value: analytics.userMetrics.total.toLocaleString(),
      change: analytics.userMetrics.growth,
      trend: 'up',
      icon: Users
    },
    {
      title: 'Active Vehicles',
      value: analytics.vehicleMetrics.online.toString(),
      change: analytics.vehicleMetrics.growth,
      trend: 'up',
      icon: Car
    },
    {
      title: 'System Uptime',
      value: analytics.systemMetrics.uptime,
      change: '+0.1%',
      trend: 'up',
      icon: Activity
    },
    {
      title: 'API Requests',
      value: (analytics.systemMetrics.apiRequests / 1000).toFixed(1) + 'K',
      change: '+15%',
      trend: 'up',
      icon: BarChart3
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Analytics Dashboard
              </CardTitle>
              <CardDescription>
                System usage analytics and performance metrics
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24h">Last 24h</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={handleExportReport}>
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="system">System</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {metrics.map((metric) => {
                  const Icon = metric.icon;
                  return (
                    <Card key={metric.title}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">{metric.title}</p>
                            <p className="text-2xl font-bold">{metric.value}</p>
                            <div className="flex items-center gap-1 mt-1">
                              <TrendingUp className="h-3 w-3 text-green-600" />
                              <span className="text-xs text-green-600">{metric.change}</span>
                            </div>
                          </div>
                          <Icon className="h-8 w-8 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Top Users by Vehicle Count</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analytics.topUsers.map((user, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-muted-foreground">{user.vehicles} vehicles</p>
                          </div>
                          <Badge variant="outline">{user.usage}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analytics.recentActivity.map((activity, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <p className="font-medium">{activity.event}</p>
                            <p className="text-sm text-muted-foreground">{activity.count} occurrences</p>
                          </div>
                          <Badge variant={activity.trend.startsWith('+') ? 'default' : 'secondary'}>
                            {activity.trend}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="users" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold">{analytics.userMetrics.total}</p>
                    <p className="text-sm text-muted-foreground">Total Users</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-green-600">{analytics.userMetrics.active}</p>
                    <p className="text-sm text-muted-foreground">Active Users</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-blue-600">{analytics.userMetrics.newThisMonth}</p>
                    <p className="text-sm text-muted-foreground">New This Month</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="system" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-green-600">{analytics.systemMetrics.uptime}</p>
                    <p className="text-sm text-muted-foreground">Uptime</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold">{analytics.systemMetrics.apiRequests.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">API Requests</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold">{analytics.systemMetrics.averageResponseTime}ms</p>
                    <p className="text-sm text-muted-foreground">Avg Response Time</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-red-600">{analytics.systemMetrics.errorRate}</p>
                    <p className="text-sm text-muted-foreground">Error Rate</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsTab;
