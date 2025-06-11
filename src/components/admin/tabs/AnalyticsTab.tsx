
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, TrendingUp, Users, Car, Activity, Download, RefreshCw } from 'lucide-react';

const AnalyticsTab: React.FC = () => {
  const [timeRange, setTimeRange] = useState('7d');

  const handleExportReport = () => {
    // TODO: Implement actual export functionality
    const data = JSON.stringify({ message: "Analytics data placeholder" }, null, 2);
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

  // Placeholder data - will be replaced with actual analytics service
  const metrics = [
    {
      title: 'Total Users',
      value: '0',
      change: '+0%',
      trend: 'up',
      icon: Users
    },
    {
      title: 'Active Vehicles',
      value: '0',
      change: '+0%',
      trend: 'up',
      icon: Car
    },
    {
      title: 'System Uptime',
      value: '100%',
      change: '+0.1%',
      trend: 'up',
      icon: Activity
    },
    {
      title: 'API Requests',
      value: '0K',
      change: '+0%',
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
                System usage analytics and performance metrics (Service temporarily unavailable)
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" disabled>
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

              <div className="text-center py-8 text-muted-foreground">
                <p>Analytics service is being rebuilt. Data will be available soon.</p>
              </div>
            </TabsContent>

            <TabsContent value="users" className="space-y-4">
              <div className="text-center py-8 text-muted-foreground">
                <p>User analytics data will be available once the service is restored.</p>
              </div>
            </TabsContent>

            <TabsContent value="system" className="space-y-4">
              <div className="text-center py-8 text-muted-foreground">
                <p>System metrics will be available once the service is restored.</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsTab;
