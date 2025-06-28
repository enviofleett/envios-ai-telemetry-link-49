
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Database, 
  Zap, 
  Clock, 
  TrendingUp, 
  AlertTriangle,
  RefreshCw,
  Trash2
} from 'lucide-react';
import { useDatabaseOptimization } from '@/hooks/useDatabaseOptimization';

const DatabaseOptimizationPanel: React.FC = () => {
  const { 
    metrics, 
    isOptimizing, 
    optimizeDatabase, 
    clearCache, 
    refreshMetrics 
  } = useDatabaseOptimization();

  const getCacheHitRateColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceColor = (time: number) => {
    if (time <= 200) return 'text-green-600';
    if (time <= 500) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Database Optimization</h2>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshMetrics}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={clearCache}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Clear Cache
          </Button>
          
          <Button
            onClick={optimizeDatabase}
            disabled={isOptimizing}
            className="flex items-center gap-2"
          >
            <Zap className="h-4 w-4" />
            {isOptimizing ? 'Optimizing...' : 'Optimize Now'}
          </Button>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Query Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getPerformanceColor(metrics.queryPerformance.averageExecutionTime)}`}>
              {metrics.queryPerformance.averageExecutionTime}ms
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.queryPerformance.totalQueries} total queries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getCacheHitRateColor(metrics.cacheStats.hitRate)}`}>
              {metrics.cacheStats.hitRate}%
            </div>
            <Progress value={metrics.cacheStats.hitRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cache Size</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.cacheStats.cacheSize}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.cacheStats.memoryUsage} KB memory
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.cacheStats.totalRequests}
            </div>
            <p className="text-xs text-muted-foreground">
              Cache requests handled
            </p>
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
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {metrics.optimizationSuggestions.map((suggestion, index) => (
                <div key={index} className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{suggestion}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Slow Queries */}
      {metrics.queryPerformance.slowQueries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Slow Queries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {metrics.queryPerformance.slowQueries.map((query, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div>
                    <div className="font-medium">{query.query}</div>
                    <div className="text-sm text-muted-foreground">
                      {query.resultCount} results • {new Date(query.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                  <Badge variant="destructive">
                    {query.executionTime}ms
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cache Statistics Details */}
      <Card>
        <CardHeader>
          <CardTitle>Cache Performance Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {metrics.cacheStats.hitRate}%
              </div>
              <div className="text-sm text-muted-foreground">Hit Rate</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {metrics.cacheStats.missRate}%
              </div>
              <div className="text-sm text-muted-foreground">Miss Rate</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold">
                {metrics.cacheStats.cacheSize}
              </div>
              <div className="text-sm text-muted-foreground">Entries</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold">
                {(metrics.cacheStats.memoryUsage / 1024).toFixed(1)}MB
              </div>
              <div className="text-sm text-muted-foreground">Memory</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DatabaseOptimizationPanel;
