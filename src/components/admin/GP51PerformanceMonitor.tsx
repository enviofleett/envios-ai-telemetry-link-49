
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  Clock, 
  CheckCircle, 
  XCircle, 
  TrendingUp, 
  Database,
  Wifi,
  AlertTriangle
} from 'lucide-react';
import { gp51DataService } from '@/services/gp51/GP51DataService';
import type { GP51PerformanceMetrics } from '@/types/gp51Performance';

const GP51PerformanceMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<GP51PerformanceMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchMetrics = async () => {
    setIsLoading(true);
    try {
      const performanceData = await gp51DataService.getPerformanceMetrics();
      setMetrics(performanceData);
    } catch (error) {
      console.error('Failed to fetch performance metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    
    // Set up periodic refresh
    const interval = setInterval(fetchMetrics, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const getHealthStatus = () => {
    if (!metrics) return { status: 'unknown', color: 'gray' };
    
    if (metrics.success && metrics.responseTime < 2000) {
      return { status: 'healthy', color: 'green' };
    } else if (metrics.success && metrics.responseTime < 5000) {
      return { status: 'degraded', color: 'yellow' };
    } else {
      return { status: 'critical', color: 'red' };
    }
  };

  const formatResponseTime = (time: number) => {
    return time < 1000 ? `${time}ms` : `${(time / 1000).toFixed(2)}s`;
  };

  const health = getHealthStatus();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              GP51 Performance Monitor
            </CardTitle>
            <Button variant="outline" size="sm" onClick={fetchMetrics} disabled={isLoading}>
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!metrics ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading performance metrics...</div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Health Status */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  {health.status === 'healthy' && <CheckCircle className="h-6 w-6 text-green-600" />}
                  {health.status === 'degraded' && <AlertTriangle className="h-6 w-6 text-yellow-600" />}
                  {health.status === 'critical' && <XCircle className="h-6 w-6 text-red-600" />}
                  <span className="font-medium">System Status</span>
                </div>
                <Badge variant={health.color === 'green' ? 'default' : health.color === 'yellow' ? 'secondary' : 'destructive'}>
                  {health.status}
                </Badge>
                {!metrics.success && metrics.errorType && (
                  <span className="text-sm text-red-600">Error: {metrics.errorType}</span>
                )}
              </div>

              {/* Performance Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">Response Time</span>
                    </div>
                    <div className="text-2xl font-bold">
                      {formatResponseTime(metrics.responseTime)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Database className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Devices</span>
                    </div>
                    <div className="text-2xl font-bold">
                      {metrics.deviceCount}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Wifi className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium">Groups</span>
                    </div>
                    <div className="text-2xl font-bold">
                      {metrics.groupCount}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-orange-600" />
                      <span className="text-sm font-medium">API Calls</span>
                    </div>
                    <div className="text-2xl font-bold">
                      {metrics.apiCallCount}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Error Rate */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Error Rate</span>
                  <span className="text-sm text-muted-foreground">{metrics.errorRate.toFixed(1)}%</span>
                </div>
                <Progress value={metrics.errorRate} className="h-2" />
              </div>

              {/* Last Updated */}
              <div className="text-xs text-muted-foreground">
                Last updated: {new Date(metrics.timestamp).toLocaleString()}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GP51PerformanceMonitor;
