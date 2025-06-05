
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  RefreshCw, 
  Database, 
  Clock, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle 
} from 'lucide-react';
import { optimizedQueryService } from '@/services/optimizedQueryClient';

interface PerformanceMetrics {
  totalQueries: number;
  failedQueries: number;
  cacheHits: number;
  cacheMisses: number;
  cacheSize: number;
  averageQueryTime: number;
}

const PerformanceDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    totalQueries: 0,
    failedQueries: 0,
    cacheHits: 0,
    cacheMisses: 0,
    cacheSize: 0,
    averageQueryTime: 0
  });
  const [isLoading, setIsLoading] = useState(false);

  const refreshMetrics = () => {
    setIsLoading(true);
    try {
      const currentMetrics = optimizedQueryService.getMetrics();
      setMetrics(currentMetrics);
    } catch (error) {
      console.error('Failed to refresh metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshMetrics();
    const interval = setInterval(refreshMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleClearCache = () => {
    optimizedQueryService.clearCache();
    refreshMetrics();
  };

  const handleInvalidateStale = () => {
    optimizedQueryService.invalidateStaleQueries();
    refreshMetrics();
  };

  const cacheHitRate = metrics.totalQueries > 0 
    ? Math.round((metrics.cacheHits / metrics.totalQueries) * 100) 
    : 0;

  const errorRate = metrics.totalQueries > 0 
    ? Math.round((metrics.failedQueries / metrics.totalQueries) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Performance Dashboard</h2>
          <p className="text-gray-600">Monitor query performance and cache efficiency</p>
        </div>
        <Button 
          onClick={refreshMetrics} 
          disabled={isLoading}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Queries</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalQueries}</div>
            <p className="text-xs text-muted-foreground">
              Since application start
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cacheHitRate}%</div>
            <Progress value={cacheHitRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.cacheHits} hits of {metrics.totalQueries} queries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Badge variant={errorRate === 0 ? "secondary" : "destructive"}>
                {errorRate}%
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {metrics.failedQueries} failed queries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cache Size</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.cacheSize}</div>
            <p className="text-xs text-muted-foreground">
              Cached query results
            </p>
          </CardContent>
        </Card>
      </div>

      {/* System Health Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            System Health
          </CardTitle>
          <CardDescription>
            Overall system performance indicators
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Query Performance</span>
            <Badge variant={cacheHitRate > 70 ? "secondary" : "outline"}>
              {cacheHitRate > 70 ? "Good" : "Needs Optimization"}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Error Rate</span>
            <Badge variant={errorRate < 5 ? "secondary" : "destructive"}>
              {errorRate < 5 ? "Healthy" : "High Error Rate"}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Cache Efficiency</span>
            <Badge variant={metrics.cacheHits > metrics.cacheMisses ? "secondary" : "outline"}>
              {metrics.cacheHits > metrics.cacheMisses ? "Efficient" : "Suboptimal"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Cache Management */}
      <Card>
        <CardHeader>
          <CardTitle>Cache Management</CardTitle>
          <CardDescription>
            Manage query cache to optimize performance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={handleClearCache} variant="outline" size="sm">
              <Database className="h-4 w-4 mr-2" />
              Clear Cache
            </Button>
            <Button onClick={handleInvalidateStale} variant="outline" size="sm">
              <Clock className="h-4 w-4 mr-2" />
              Invalidate Stale
            </Button>
          </div>
          
          <div className="text-sm text-gray-600">
            <p>• Clear Cache: Removes all cached query results</p>
            <p>• Invalidate Stale: Removes only outdated cache entries</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceDashboard;
