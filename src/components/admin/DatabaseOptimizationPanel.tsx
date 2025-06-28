
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useDatabaseOptimization } from '@/hooks/useDatabaseOptimization';
import { 
  Database, 
  Zap, 
  TrendingUp, 
  Clock, 
  HardDrive, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Activity
} from 'lucide-react';

const DatabaseOptimizationPanel: React.FC = () => {
  const { 
    metrics, 
    isOptimizing, 
    optimizeDatabase, 
    clearCache, 
    refreshMetrics 
  } = useDatabaseOptimization();

  if (!metrics) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Database className="h-6 w-6" />
            Database Optimization
          </h2>
          <Button onClick={refreshMetrics} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading metrics...</p>
        </div>
      </div>
    );
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(1)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Database className="h-6 w-6" />
          Database Optimization
        </h2>
        <div className="flex gap-2">
          <Button onClick={refreshMetrics} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={clearCache} variant="outline" size="sm">
            <HardDrive className="h-4 w-4 mr-2" />
            Clear Cache
          </Button>
          <Button 
            onClick={optimizeDatabase} 
            disabled={isOptimizing}
            size="sm"
          >
            <Zap className="h-4 w-4 mr-2" />
            {isOptimizing ? 'Optimizing...' : 'Optimize'}
          </Button>
        </div>
      </div>

      {/* Performance Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Query Time</p>
                <p className="text-2xl font-bold">
                  {formatTime(metrics.queryPerformance.averageExecutionTime)}
                </p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cache Hit Rate</p>
                <p className="text-2xl font-bold">{metrics.cacheStats.hitRate.toFixed(1)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
            <Progress value={metrics.cacheStats.hitRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Queries</p>
                <p className="text-2xl font-bold">{metrics.queryPerformance.totalQueries}</p>
              </div>
              <Activity className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cache Entries</p>
                <p className="text-2xl font-bold">{metrics.cacheStats.totalEntries}</p>
              </div>
              <HardDrive className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Cache Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              Cache Statistics
            </CardTitle>
            <CardDescription>
              Current cache performance and usage metrics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Hit Rate</p>
                <p className="text-xl font-bold text-green-600">
                  {metrics.cacheStats.hitRate.toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Miss Rate</p>
                <p className="text-xl font-bold text-red-600">
                  {metrics.cacheStats.missRate.toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Memory Usage</p>
                <p className="text-xl font-bold">
                  {formatBytes(metrics.cacheStats.memoryUsage)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Access Time</p>
                <p className="text-xl font-bold">
                  {formatTime(metrics.cacheStats.averageAccessTime)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Query Performance
            </CardTitle>
            <CardDescription>
              Database query execution statistics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Queries</p>
                <p className="text-xl font-bold">{metrics.queryPerformance.totalQueries}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cache Hit Rate</p>
                <p className="text-xl font-bold text-green-600">
                  {metrics.queryPerformance.cacheHitRate.toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Slow Queries</p>
                <p className="text-xl font-bold text-orange-600">
                  {metrics.queryPerformance.slowQueries.length}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Time</p>
                <p className="text-xl font-bold">
                  {formatTime(metrics.queryPerformance.averageExecutionTime)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Optimization Suggestions */}
      {metrics.optimizationSuggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Optimization Suggestions
            </CardTitle>
            <CardDescription>
              Recommendations to improve database performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.optimizationSuggestions.map((suggestion, index) => (
                <Alert key={index}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{suggestion}</AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Slow Queries */}
      {metrics.queryPerformance.slowQueries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-red-500" />
              Slow Queries
            </CardTitle>
            <CardDescription>
              Queries that are taking longer than expected
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.queryPerformance.slowQueries.slice(0, 5).map((query, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{query.queryKey}</p>
                    <p className="text-sm text-muted-foreground">
                      Executed at: {new Date(query.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={query.executionTime > 2000 ? "destructive" : "secondary"}>
                      {formatTime(query.executionTime)}
                    </Badge>
                    {query.cacheHit && (
                      <Badge variant="outline">Cache Hit</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Indicator */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <p className="text-sm text-muted-foreground">
              Database optimization system is running smoothly
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DatabaseOptimizationPanel;
