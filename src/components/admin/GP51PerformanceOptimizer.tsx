
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Zap, 
  TrendingUp, 
  Clock, 
  Database, 
  Wifi, 
  BarChart3,
  RefreshCw,
  Settings,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { gp51PerformanceOptimizer, PerformanceMetrics, OptimizationResult } from '@/services/gp51/GP51PerformanceOptimizer';
import { useToast } from '@/hooks/use-toast';

const GP51PerformanceOptimizer: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const { toast } = useToast();

  const analyzePerformance = async () => {
    setIsAnalyzing(true);
    try {
      const result = await gp51PerformanceOptimizer.analyzePerformance();
      setMetrics(result);
      toast({
        title: "Performance Analysis Complete",
        description: "System performance metrics have been updated"
      });
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze performance",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const optimizePerformance = async () => {
    setIsOptimizing(true);
    try {
      const result = await gp51PerformanceOptimizer.optimizePerformance();
      setOptimizationResult(result);
      setMetrics(result.metrics);
      
      toast({
        title: "Optimization Complete",
        description: `Performance improved by ${result.improvementPercentage.toFixed(1)}%`,
      });
    } catch (error) {
      toast({
        title: "Optimization Failed",
        description: error instanceof Error ? error.message : "Failed to optimize performance",
        variant: "destructive"
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  useEffect(() => {
    analyzePerformance();
  }, []);

  const getMetricStatus = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return 'good';
    if (value <= thresholds.warning) return 'warning';
    return 'critical';
  };

  const getMetricColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-blue-600" />
              <CardTitle>GP51 Performance Optimizer</CardTitle>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={analyzePerformance}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <BarChart3 className="h-4 w-4 mr-2" />
                )}
                Analyze
              </Button>
              <Button
                size="sm"
                onClick={optimizePerformance}
                disabled={isOptimizing || isAnalyzing}
              >
                {isOptimizing ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Zap className="h-4 w-4 mr-2" />
                )}
                Optimize
              </Button>
            </div>
          </div>
          <CardDescription>
            Monitor and optimize GP51 integration performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          {metrics ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Response Time</span>
                  </div>
                  <Badge variant={getMetricStatus(metrics.apiResponseTime, { good: 1000, warning: 3000 }) === 'good' ? 'default' : 'destructive'}>
                    {formatDuration(metrics.apiResponseTime)}
                  </Badge>
                </div>
                <Progress 
                  value={Math.min(100, (5000 - metrics.apiResponseTime) / 50)} 
                  className="h-2"
                />
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Database className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Cache Hit Rate</span>
                  </div>
                  <Badge variant={metrics.cacheHitRate > 70 ? 'default' : 'destructive'}>
                    {metrics.cacheHitRate.toFixed(1)}%
                  </Badge>
                </div>
                <Progress value={metrics.cacheHitRate} className="h-2" />
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium">Error Rate</span>
                  </div>
                  <Badge variant={metrics.errorRate < 5 ? 'default' : 'destructive'}>
                    {metrics.errorRate.toFixed(1)}%
                  </Badge>
                </div>
                <Progress value={Math.max(0, 100 - metrics.errorRate)} className="h-2" />
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium">Throughput</span>
                  </div>
                  <Badge variant="outline">
                    {metrics.throughput} ops/min
                  </Badge>
                </div>
                <Progress value={Math.min(100, metrics.throughput * 5)} className="h-2" />
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Wifi className="h-4 w-4 text-indigo-500" />
                    <span className="text-sm font-medium">Data Freshness</span>
                  </div>
                  <Badge variant={metrics.dataFreshness < 300000 ? 'default' : 'destructive'}>
                    {formatDuration(metrics.dataFreshness)}
                  </Badge>
                </div>
                <Progress 
                  value={Math.max(0, 100 - (metrics.dataFreshness / 600000) * 100)} 
                  className="h-2"
                />
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Settings className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Last Optimized</span>
                  </div>
                  <Badge variant="outline">
                    {metrics.lastOptimized.toLocaleTimeString()}
                  </Badge>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
              <span className="ml-2 text-gray-500">Loading performance metrics...</span>
            </div>
          )}

          {optimizationResult && (
            <Card className="bg-green-50 border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center text-green-800">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Optimization Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-green-700 mb-2">
                      Performance improved by <strong>{optimizationResult.improvementPercentage.toFixed(1)}%</strong>
                    </p>
                    <Progress value={optimizationResult.improvementPercentage} className="h-2" />
                  </div>

                  {optimizationResult.appliedOptimizations.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-green-800 mb-2">Applied Optimizations:</h4>
                      <ul className="text-sm text-green-700 space-y-1">
                        {optimizationResult.appliedOptimizations.map((optimization, index) => (
                          <li key={index} className="flex items-center">
                            <CheckCircle className="h-3 w-3 mr-2" />
                            {optimization}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {optimizationResult.recommendations.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-green-800 mb-2">Recommendations:</h4>
                      <ul className="text-sm text-green-700 space-y-1">
                        {optimizationResult.recommendations.map((recommendation, index) => (
                          <li key={index} className="flex items-start">
                            <AlertTriangle className="h-3 w-3 mr-2 mt-0.5 flex-shrink-0" />
                            {recommendation}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GP51PerformanceOptimizer;
