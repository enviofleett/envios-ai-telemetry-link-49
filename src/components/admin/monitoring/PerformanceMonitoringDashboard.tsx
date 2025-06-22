
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Clock, CheckCircle, AlertCircle, Zap } from 'lucide-react';
import { performanceMonitoringService, PerformanceMetrics } from '@/services/monitoring/PerformanceMonitoringService';

const PerformanceMonitoringDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    averageOperationTime: 0,
    successRate: 0,
    errorRate: 0,
    throughput: 0,
    latestOperations: [],
    performanceTrends: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPerformanceMetrics();
    const interval = setInterval(loadPerformanceMetrics, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadPerformanceMetrics = async () => {
    try {
      const data = await performanceMonitoringService.getPerformanceMetrics();
      setMetrics(data);
    } catch (error) {
      console.error('Failed to load performance metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getOperationStatusColor = (successful: number, failed: number) => {
    const total = successful + failed;
    if (total === 0) return 'bg-gray-500';
    const successRate = (successful / total) * 100;
    if (successRate >= 95) return 'bg-green-500';
    if (successRate >= 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Monitoring Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Operation Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(metrics.averageOperationTime)}</div>
            <p className="text-xs text-muted-foreground">Last 7 days average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.successRate}%</div>
            <p className="text-xs text-muted-foreground">Operations completed successfully</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics.errorRate}%</div>
            <p className="text-xs text-muted-foreground">Operations with errors</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Throughput</CardTitle>
            <Zap className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{metrics.throughput}</div>
            <p className="text-xs text-muted-foreground">Records per hour</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Operations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.latestOperations.map((operation) => (
              <div key={operation.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full ${getOperationStatusColor(operation.records_successful, operation.records_failed)}`}></div>
                  <div>
                    <div className="font-medium capitalize">
                      {operation.operation_type.replace('_', ' ')}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDuration(operation.operation_duration_ms)} • 
                      {operation.records_processed} records • 
                      {operation.api_calls_made} API calls
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-2">
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      {operation.records_successful} success
                    </Badge>
                    {operation.records_failed > 0 && (
                      <Badge variant="destructive">
                        {operation.records_failed} failed
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {new Date(operation.completed_at).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
            {metrics.latestOperations.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No recent operations found.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Performance Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>System Health</span>
                <Badge variant={metrics.successRate >= 95 ? "default" : "destructive"}>
                  {metrics.successRate >= 95 ? "Healthy" : "Degraded"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Performance Status</span>
                <Badge variant={metrics.averageOperationTime < 5000 ? "default" : "secondary"}>
                  {metrics.averageOperationTime < 5000 ? "Optimal" : "Slow"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Error Status</span>
                <Badge variant={metrics.errorRate < 5 ? "default" : "destructive"}>
                  {metrics.errorRate < 5 ? "Low" : "High"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                • Monitor sync operations in real-time
              </div>
              <div className="text-sm text-muted-foreground">
                • Track API performance and bottlenecks
              </div>
              <div className="text-sm text-muted-foreground">
                • Analyze error patterns and trends
              </div>
              <div className="text-sm text-muted-foreground">
                • Set up performance alerts and thresholds
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PerformanceMonitoringDashboard;
