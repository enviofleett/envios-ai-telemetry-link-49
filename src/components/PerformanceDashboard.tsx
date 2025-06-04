
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { memoryMonitor } from '@/services/memoryMonitoringService';
import { optimizedQueryService } from '@/services/optimizedQueryClient';
import { 
  Activity, 
  Database, 
  Memory, 
  Zap, 
  Download,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

const PerformanceDashboard: React.FC = () => {
  const [memoryMetrics, setMemoryMetrics] = useState<any>(null);
  const [queryMetrics, setQueryMetrics] = useState<any>(null);
  const [cacheInfo, setCacheInfo] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  useEffect(() => {
    // Start memory monitoring
    memoryMonitor.startMonitoring(10000); // Every 10 seconds
    setIsMonitoring(true);

    // Set up alert listener
    const unsubscribeAlerts = memoryMonitor.onAlert((alert) => {
      setAlerts(prev => [alert, ...prev.slice(0, 9)]); // Keep last 10 alerts
    });

    // Update metrics periodically
    const interval = setInterval(() => {
      setMemoryMetrics(memoryMonitor.getCurrentMemoryUsage());
      setQueryMetrics(optimizedQueryService.getMetrics());
      setCacheInfo(optimizedQueryService.getDetailedCacheInfo());
    }, 5000);

    return () => {
      memoryMonitor.stopMonitoring();
      unsubscribeAlerts();
      clearInterval(interval);
    };
  }, []);

  const handleExportMetrics = () => {
    const data = {
      memory: memoryMonitor.exportMetrics(),
      queries: queryMetrics,
      cache: cacheInfo,
      alerts,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-metrics-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearCache = () => {
    optimizedQueryService.clearCache();
    setCacheInfo(optimizedQueryService.getDetailedCacheInfo());
  };

  const handleInvalidateStale = () => {
    optimizedQueryService.invalidateStaleQueries();
    setQueryMetrics(optimizedQueryService.getMetrics());
  };

  const formatMemorySize = (bytes: number) => {
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  const getHealthStatus = () => {
    if (!memoryMetrics || !queryMetrics) return 'unknown';
    
    const memoryUsagePercent = (memoryMetrics.usedJSHeapSize / memoryMetrics.jsHeapSizeLimit) * 100;
    const hasRecentAlerts = alerts.some(alert => Date.now() - alert.timestamp < 300000); // 5 minutes
    
    if (hasRecentAlerts || memoryUsagePercent > 85) return 'warning';
    if (memoryUsagePercent > 70) return 'caution';
    return 'healthy';
  };

  const healthStatus = getHealthStatus();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Performance Dashboard</h2>
          <p className="text-gray-600">Monitor application performance and resource usage</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge 
            variant={healthStatus === 'healthy' ? 'default' : healthStatus === 'warning' ? 'destructive' : 'secondary'}
            className="flex items-center gap-1"
          >
            {healthStatus === 'healthy' ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
            {healthStatus.charAt(0).toUpperCase() + healthStatus.slice(1)}
          </Badge>
          <Button variant="outline" size="sm" onClick={handleExportMetrics}>
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Memory className="w-4 h-4 text-blue-500" />
              Memory Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {memoryMetrics ? formatMemorySize(memoryMetrics.usedJSHeapSize) : 'Loading...'}
            </div>
            <p className="text-xs text-gray-600">
              {memoryMetrics ? `${((memoryMetrics.usedJSHeapSize / memoryMetrics.jsHeapSizeLimit) * 100).toFixed(1)}% of limit` : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Database className="w-4 h-4 text-green-500" />
              Query Cache
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {cacheInfo ? cacheInfo.totalQueries : 'Loading...'}
            </div>
            <p className="text-xs text-gray-600">
              {cacheInfo ? `${cacheInfo.activeQueries} active` : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-500" />
              Cache Hit Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {queryMetrics ? `${((queryMetrics.cacheHits / (queryMetrics.cacheHits + queryMetrics.cacheMisses || 1)) * 100).toFixed(1)}%` : 'Loading...'}
            </div>
            <p className="text-xs text-gray-600">
              {queryMetrics ? `${queryMetrics.cacheHits} hits / ${queryMetrics.cacheMisses} misses` : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="w-4 h-4 text-orange-500" />
              Avg Query Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {queryMetrics ? `${queryMetrics.averageQueryTime.toFixed(0)}ms` : 'Loading...'}
            </div>
            <p className="text-xs text-gray-600">
              {queryMetrics ? `${queryMetrics.totalQueries} total queries` : ''}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <Tabs defaultValue="memory" className="w-full">
        <TabsList>
          <TabsTrigger value="memory">Memory</TabsTrigger>
          <TabsTrigger value="queries">Queries</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="cache">Cache Details</TabsTrigger>
        </TabsList>

        <TabsContent value="memory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Memory Metrics
                <Badge variant={isMonitoring ? 'default' : 'secondary'}>
                  {isMonitoring ? 'Monitoring' : 'Stopped'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {memoryMetrics ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-gray-600">Used Heap Size</div>
                    <div className="text-lg font-bold">{formatMemorySize(memoryMetrics.usedJSHeapSize)}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-600">Total Heap Size</div>
                    <div className="text-lg font-bold">{formatMemorySize(memoryMetrics.totalJSHeapSize)}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-600">Heap Limit</div>
                    <div className="text-lg font-bold">{formatMemorySize(memoryMetrics.jsHeapSizeLimit)}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-600">Usage Percentage</div>
                    <div className="text-lg font-bold">
                      {((memoryMetrics.usedJSHeapSize / memoryMetrics.jsHeapSizeLimit) * 100).toFixed(2)}%
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500">Loading memory metrics...</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="queries" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Query Performance
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleInvalidateStale}>
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Invalidate Stale
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleClearCache}>
                    Clear Cache
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {queryMetrics ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-gray-600">Total Queries</div>
                    <div className="text-lg font-bold">{queryMetrics.totalQueries}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-600">Failed Queries</div>
                    <div className="text-lg font-bold text-red-600">{queryMetrics.failedQueries}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-600">Cache Size</div>
                    <div className="text-lg font-bold">{queryMetrics.cacheSize}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-600">Average Response</div>
                    <div className="text-lg font-bold">{queryMetrics.averageQueryTime.toFixed(2)}ms</div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500">Loading query metrics...</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              {alerts.length > 0 ? (
                <div className="space-y-3">
                  {alerts.map((alert, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5" />
                      <div className="flex-1">
                        <div className="font-medium text-red-800">{alert.type.replace('_', ' ').toUpperCase()}</div>
                        <div className="text-sm text-red-700">{alert.message}</div>
                        <div className="text-xs text-red-600 mt-1">
                          {new Date(alert.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  No performance alerts
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cache" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cache Details</CardTitle>
            </CardHeader>
            <CardContent>
              {cacheInfo ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm font-medium text-gray-600">Total Queries</div>
                      <div className="text-lg font-bold">{cacheInfo.totalQueries}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-600">Active Queries</div>
                      <div className="text-lg font-bold">{cacheInfo.activeQueries}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-600">Stale Queries</div>
                      <div className="text-lg font-bold">{cacheInfo.staleQueries}</div>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-600 mb-2">Estimated Cache Size</div>
                    <div className="text-lg font-bold">{cacheInfo.cacheSizeEstimate}</div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500">Loading cache information...</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PerformanceDashboard;
