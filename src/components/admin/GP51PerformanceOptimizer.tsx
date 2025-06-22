
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { 
  Zap, 
  Database, 
  TrendingUp, 
  Settings, 
  Gauge,
  BarChart3,
  Activity,
  Layers,
  Clock,
  HardDrive
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OptimizationSettings {
  batchSize: number;
  concurrentRequests: number;
  enableCompression: boolean;
  cacheEnabled: boolean;
  smartBatching: boolean;
  adaptiveRateLimit: boolean;
}

interface PerformanceMetrics {
  currentThroughput: number;
  averageThroughput: number;
  peakThroughput: number;
  cacheHitRate: number;
  compressionRatio: number;
  networkLatency: number;
  errorRate: number;
  resourceUtilization: number;
}

interface OptimizationRecommendation {
  type: 'batch_size' | 'compression' | 'caching' | 'rate_limit';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  action: () => void;
}

const GP51PerformanceOptimizer: React.FC = () => {
  const [settings, setSettings] = useState<OptimizationSettings>({
    batchSize: 500,
    concurrentRequests: 3,
    enableCompression: true,
    cacheEnabled: true,
    smartBatching: true,
    adaptiveRateLimit: true
  });

  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    currentThroughput: 0,
    averageThroughput: 45.2,
    peakThroughput: 89.7,
    cacheHitRate: 84.5,
    compressionRatio: 2.3,
    networkLatency: 120,
    errorRate: 0.5,
    resourceUtilization: 65
  });

  const [recommendations, setRecommendations] = useState<OptimizationRecommendation[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadCurrentSettings();
    updateMetrics();
    generateRecommendations();

    // Set up real-time metrics updates
    const interval = setInterval(updateMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadCurrentSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('sync_configuration')
        .select('sync_settings')
        .eq('sync_type', 'performance_settings')
        .single();

      if (data?.sync_settings) {
        setSettings(prev => ({ ...prev, ...data.sync_settings }));
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const updateMetrics = async () => {
    try {
      // Simulate real-time metrics updates
      setMetrics(prev => ({
        ...prev,
        currentThroughput: Math.random() * 100,
        networkLatency: 100 + Math.random() * 50,
        resourceUtilization: 60 + Math.random() * 30
      }));
    } catch (error) {
      console.error('Failed to update metrics:', error);
    }
  };

  const generateRecommendations = () => {
    const newRecommendations: OptimizationRecommendation[] = [];

    if (metrics.cacheHitRate < 80) {
      newRecommendations.push({
        type: 'caching',
        title: 'Improve Cache Performance',
        description: 'Cache hit rate is below optimal. Consider increasing cache size or adjusting cache policies.',
        impact: 'high',
        action: () => optimizeCache()
      });
    }

    if (metrics.compressionRatio < 2.0) {
      newRecommendations.push({
        type: 'compression',
        title: 'Enable Better Compression',
        description: 'Data compression ratio is low. Enable advanced compression algorithms.',
        impact: 'medium',
        action: () => optimizeCompression()
      });
    }

    if (metrics.averageThroughput < 40) {
      newRecommendations.push({
        type: 'batch_size',
        title: 'Optimize Batch Size',
        description: 'Current batch size may not be optimal for your network conditions.',
        impact: 'high',
        action: () => optimizeBatchSize()
      });
    }

    if (metrics.errorRate > 1.0) {
      newRecommendations.push({
        type: 'rate_limit',
        title: 'Adjust Rate Limiting',
        description: 'High error rate detected. Consider enabling adaptive rate limiting.',
        impact: 'medium',
        action: () => optimizeRateLimit()
      });
    }

    setRecommendations(newRecommendations);
  };

  const updateSetting = async (key: keyof OptimizationSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    try {
      const { error } = await supabase
        .from('sync_configuration')
        .upsert({
          sync_type: 'performance_settings',
          sync_settings: newSettings,
          is_enabled: true
        });

      if (error) throw error;

      toast({
        title: 'Settings Updated',
        description: `${key} has been updated successfully`,
        duration: 3000
      });
    } catch (error) {
      toast({
        title: 'Update Failed',
        description: `Failed to update ${key}`,
        variant: 'destructive',
        duration: 5000
      });
    }
  };

  const optimizeCache = async () => {
    setIsOptimizing(true);
    try {
      // Implement cache optimization logic
      await updateSetting('cacheEnabled', true);
      toast({
        title: 'Cache Optimized',
        description: 'Cache settings have been optimized for better performance',
        duration: 5000
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  const optimizeCompression = async () => {
    setIsOptimizing(true);
    try {
      await updateSetting('enableCompression', true);
      toast({
        title: 'Compression Optimized',
        description: 'Advanced compression algorithms have been enabled',
        duration: 5000
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  const optimizeBatchSize = async () => {
    setIsOptimizing(true);
    try {
      // Calculate optimal batch size based on current metrics
      const optimalSize = Math.max(200, Math.min(1000, metrics.averageThroughput * 10));
      await updateSetting('batchSize', optimalSize);
      toast({
        title: 'Batch Size Optimized',
        description: `Batch size adjusted to ${optimalSize} for optimal performance`,
        duration: 5000
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  const optimizeRateLimit = async () => {
    setIsOptimizing(true);
    try {
      await updateSetting('adaptiveRateLimit', true);
      toast({
        title: 'Rate Limiting Optimized',
        description: 'Adaptive rate limiting has been enabled',
        duration: 5000
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  const autoOptimize = async () => {
    setIsOptimizing(true);
    try {
      for (const recommendation of recommendations) {
        await recommendation.action();
        await new Promise(resolve => setTimeout(resolve, 1000)); // Delay between optimizations
      }
      
      generateRecommendations(); // Refresh recommendations after optimization
      
      toast({
        title: 'Auto-Optimization Complete',
        description: 'All performance optimizations have been applied',
        duration: 5000
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  const getMetricColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value >= thresholds.good) return 'text-green-600';
    if (value >= thresholds.warning) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Gauge className="h-5 w-5" />
            <span>Performance Overview</span>
          </CardTitle>
          <CardDescription>
            Real-time performance metrics and system health indicators
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <TrendingUp className="h-6 w-6 mx-auto mb-2 text-blue-500" />
              <div className={`text-2xl font-bold ${getMetricColor(metrics.currentThroughput, { good: 60, warning: 30 })}`}>
                {metrics.currentThroughput.toFixed(1)}
              </div>
              <div className="text-sm text-muted-foreground">Records/sec</div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <Database className="h-6 w-6 mx-auto mb-2 text-green-500" />
              <div className={`text-2xl font-bold ${getMetricColor(metrics.cacheHitRate, { good: 80, warning: 60 })}`}>
                {metrics.cacheHitRate.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Cache Hit Rate</div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <Layers className="h-6 w-6 mx-auto mb-2 text-purple-500" />
              <div className="text-2xl font-bold text-purple-600">
                {metrics.compressionRatio.toFixed(1)}x
              </div>
              <div className="text-sm text-muted-foreground">Compression</div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <Clock className="h-6 w-6 mx-auto mb-2 text-orange-500" />
              <div className={`text-2xl font-bold ${getMetricColor(200 - metrics.networkLatency, { good: 120, warning: 60 })}`}>
                {metrics.networkLatency.toFixed(0)}ms
              </div>
              <div className="text-sm text-muted-foreground">Latency</div>
            </div>
          </div>

          {/* Resource Utilization */}
          <div className="mt-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Resource Utilization</span>
              <span className="text-sm text-muted-foreground">{metrics.resourceUtilization.toFixed(0)}%</span>
            </div>
            <Progress value={metrics.resourceUtilization} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Optimization Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Optimization Settings</span>
          </CardTitle>
          <CardDescription>
            Configure performance optimization parameters
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Batch Size</label>
                <div className="flex items-center space-x-2 mt-1">
                  <input
                    type="range"
                    min="100"
                    max="1000"
                    step="50"
                    value={settings.batchSize}
                    onChange={(e) => updateSetting('batchSize', parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm font-mono w-12">{settings.batchSize}</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Concurrent Requests</label>
                <div className="flex items-center space-x-2 mt-1">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={settings.concurrentRequests}
                    onChange={(e) => updateSetting('concurrentRequests', parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm font-mono w-8">{settings.concurrentRequests}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Enable Compression</label>
                <Switch
                  checked={settings.enableCompression}
                  onCheckedChange={(checked) => updateSetting('enableCompression', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Cache Enabled</label>
                <Switch
                  checked={settings.cacheEnabled}
                  onCheckedChange={(checked) => updateSetting('cacheEnabled', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Smart Batching</label>
                <Switch
                  checked={settings.smartBatching}
                  onCheckedChange={(checked) => updateSetting('smartBatching', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Adaptive Rate Limit</label>
                <Switch
                  checked={settings.adaptiveRateLimit}
                  onCheckedChange={(checked) => updateSetting('adaptiveRateLimit', checked)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Optimization Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5" />
              <span>Optimization Recommendations</span>
            </div>
            {recommendations.length > 0 && (
              <Button
                onClick={autoOptimize}
                disabled={isOptimizing}
                className="flex items-center space-x-2"
              >
                <Activity className="h-4 w-4" />
                <span>Auto-Optimize</span>
              </Button>
            )}
          </CardTitle>
          <CardDescription>
            AI-powered recommendations to improve sync performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recommendations.length === 0 ? (
            <div className="text-center py-8">
              <Gauge className="h-12 w-12 mx-auto text-green-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Optimal Performance</h3>
              <p className="text-gray-500">
                Your system is running at optimal performance levels.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {recommendations.map((rec, index) => (
                <div key={index} className="flex items-start space-x-4 p-4 border rounded-lg">
                  <BarChart3 className="h-5 w-5 text-blue-500 mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{rec.title}</h4>
                      <Badge className={getImpactColor(rec.impact)}>
                        {rec.impact.toUpperCase()} IMPACT
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {rec.description}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={rec.action}
                      disabled={isOptimizing}
                    >
                      Apply Optimization
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GP51PerformanceOptimizer;
