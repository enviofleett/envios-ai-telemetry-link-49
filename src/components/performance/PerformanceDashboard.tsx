
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { usePerformanceMetrics } from '@/hooks/usePerformanceMetrics';
import { Activity, Database, Zap, AlertTriangle, TrendingUp, RefreshCw } from 'lucide-react';

export const PerformanceDashboard: React.FC = () => {
  const { metrics, isLoading, lastUpdated, refreshMetrics, clearCache, acknowledgeAlert, resolveAlert } = usePerformanceMetrics();

  if (isLoading || !metrics) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Performance Dashboard</h2>
          <Button onClick={refreshMetrics} disabled={isLoading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getHealthStatus = (value: number, threshold: number) => {
    if (value >= threshold * 0.9) return 'healthy';
    if (value >= threshold * 0.7) return 'warning';
    return 'critical';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Performance Dashboard</h2>
          {lastUpdated && (
            <p className="text-sm text-muted-foreground">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button onClick={clearCache} variant="outline" size="sm">
            Clear Cache
          </Button>
          <Button onClick={refreshMetrics} size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* SLA Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.sla.uptime.toFixed(2)}%</div>
            <Progress 
              value={metrics.sla.uptime} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.sla.responseTime.toFixed(0)}ms</div>
            <Badge variant={metrics.sla.responseTime < 2000 ? 'secondary' : 'destructive'} className="mt-2">
              Target: 2000ms
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.sla.errorRate.toFixed(2)}%</div>
            <Badge variant={metrics.sla.errorRate < 1 ? 'secondary' : 'destructive'} className="mt-2">
              Target: &lt;1%
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Throughput</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.sla.throughput.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground mt-2">requests/min</p>
          </CardContent>
        </Card>
      </div>

      {/* Database & Cache Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Total Queries</span>
              <span className="font-mono">{metrics.database.totalQueries}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Avg Query Time</span>
              <span className="font-mono">{metrics.database.averageQueryTime.toFixed(2)}ms</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Slow Queries</span>
              <Badge variant={metrics.database.slowQueries > 5 ? 'destructive' : 'secondary'}>
                {metrics.database.slowQueries}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">DB Error Rate</span>
              <Badge variant={metrics.database.errorRate > 1 ? 'destructive' : 'secondary'}>
                {metrics.database.errorRate.toFixed(2)}%
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Cache Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Hit Rate</span>
              <div className="flex items-center gap-2">
                <span className="font-mono">{metrics.cache.hitRate.toFixed(1)}%</span>
                <Progress value={metrics.cache.hitRate} className="w-20" />
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Cache Hits</span>
              <span className="font-mono">{metrics.cache.hits}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Cache Misses</span>
              <span className="font-mono">{metrics.cache.misses}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Cache Size</span>
              <span className="font-mono">{metrics.cache.totalSize} entries</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Avg Access Time</span>
              <span className="font-mono">{metrics.cache.averageAccessTime.toFixed(2)}ms</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Alerts */}
      {metrics.alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Active Alerts ({metrics.alerts.length})
            </CardTitle>
            <CardDescription>
              Performance alerts requiring attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.alerts.slice(0, 5).map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={getSeverityColor(alert.severity)}>
                        {alert.severity}
                      </Badge>
                      <span className="text-sm font-medium">{alert.type}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{alert.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(alert.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {!alert.acknowledged && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => acknowledgeAlert(alert.id)}
                      >
                        Acknowledge
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={() => resolveAlert(alert.id)}
                    >
                      Resolve
                    </Button>
                  </div>
                </div>
              ))}
              {metrics.alerts.length > 5 && (
                <p className="text-sm text-muted-foreground text-center">
                  +{metrics.alerts.length - 5} more alerts
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
