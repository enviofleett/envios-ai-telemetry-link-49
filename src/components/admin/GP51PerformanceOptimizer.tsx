
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { 
  Zap, 
  Database, 
  Clock, 
  TrendingUp, 
  Settings, 
  BarChart3,
  Server,
  RefreshCw,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Json } from '@/integrations/supabase/types';

// Type-safe helper for accessing optimization settings
const getOptimizationSetting = (settings: Json, key: string, defaultValue: any): any => {
  if (typeof settings === 'object' && settings !== null && !Array.isArray(settings)) {
    const value = (settings as Record<string, any>)[key];
    return value !== undefined ? value : defaultValue;
  }
  return defaultValue;
};

const isValidOptimizationSettings = (settings: Json): settings is Record<string, any> => {
  return typeof settings === 'object' && settings !== null && !Array.isArray(settings);
};

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  status: 'good' | 'warning' | 'critical';
}

interface OptimizationSettings {
  batchSize: number;
  concurrentRequests: number;
  cacheEnabled: boolean;
  compressionEnabled: boolean;
  rateLimitEnabled: boolean;
  retryAttempts: number;
  timeout: number;
  priorityMode: boolean;
}

const GP51PerformanceOptimizer: React.FC = () => {
  const [activeTab, setActiveTab] = useState('metrics');
  const [settings, setSettings] = useState<OptimizationSettings>({
    batchSize: 50,
    concurrentRequests: 5,
    cacheEnabled: true,
    compressionEnabled: true,
    rateLimitEnabled: true,
    retryAttempts: 3,
    timeout: 30000,
    priorityMode: false
  });

  const queryClient = useQueryClient();

  const { data: performanceMetrics, isLoading } = useQuery({
    queryKey: ['performance-metrics'],
    queryFn: async (): Promise<PerformanceMetric[]> => {
      // Mock performance metrics - in real implementation, this would fetch actual metrics
      return [
        {
          name: 'Sync Throughput',
          value: 145.2,
          unit: 'records/min',
          trend: 'up',
          status: 'good'
        },
        {
          name: 'API Response Time',
          value: 287,
          unit: 'ms',
          trend: 'down',
          status: 'good'
        },
        {
          name: 'Error Rate',
          value: 2.1,
          unit: '%',
          trend: 'stable',
          status: 'warning'
        },
        {
          name: 'Memory Usage',
          value: 67.8,
          unit: '%',
          trend: 'up',
          status: 'warning'
        },
        {
          name: 'Cache Hit Rate',
          value: 94.5,
          unit: '%',
          trend: 'up',
          status: 'good'
        },
        {
          name: 'Network Utilization',
          value: 23.4,
          unit: '%',
          trend: 'stable',
          status: 'good'
        }
      ];
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const { data: optimizationStatus } = useQuery({
    queryKey: ['optimization-status'],
    queryFn: async () => {
      // Mock optimization status
      return {
        cacheSize: 1248,
        optimizedRequests: 15420,
        timesSaved: 3.2,
        lastOptimization: new Date().toISOString(),
        activeOptimizations: 7,
        recommendations: [
          'Increase batch size for better throughput',
          'Enable compression to reduce bandwidth',
          'Consider increasing cache TTL'
        ]
      };
    },
  });

  const applyOptimizationMutation = useMutation({
    mutationFn: async (newSettings: OptimizationSettings) => {
      // Mock optimization application
      await new Promise(resolve => setTimeout(resolve, 2000));
      return { success: true, message: 'Optimization settings applied successfully' };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['performance-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['optimization-status'] });
    },
  });

  const clearCacheMutation = useMutation({
    mutationFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['optimization-status'] });
    },
  });

  const handleSettingChange = <K extends keyof OptimizationSettings>(
    key: K, 
    value: OptimizationSettings[K]
  ) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
  };

  const applyOptimizations = () => {
    applyOptimizationMutation.mutate(settings);
  };

  const getMetricStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />;
      case 'stable': return <BarChart3 className="h-4 w-4 text-gray-500" />;
      default: return <BarChart3 className="h-4 w-4 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-orange-600" />
                <span>Performance Optimizer</span>
              </CardTitle>
              <CardDescription>
                Monitor and optimize GP51 sync performance with intelligent automation
              </CardDescription>
            </div>
            <Badge variant="default">
              {optimizationStatus?.activeOptimizations || 0} Active
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center p-4 bg-orange-50 rounded-lg">
              <Zap className="h-8 w-8 text-orange-600 mr-3" />
              <div>
                <div className="font-semibold text-orange-800">Throughput</div>
                <div className="text-sm text-orange-600">
                  {performanceMetrics?.find(m => m.name === 'Sync Throughput')?.value || 0} records/min
                </div>
              </div>
            </div>
            <div className="flex items-center p-4 bg-blue-50 rounded-lg">
              <Clock className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <div className="font-semibold text-blue-800">Response Time</div>
                <div className="text-sm text-blue-600">
                  {performanceMetrics?.find(m => m.name === 'API Response Time')?.value || 0}ms avg
                </div>
              </div>
            </div>
            <div className="flex items-center p-4 bg-green-50 rounded-lg">
              <Database className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <div className="font-semibold text-green-800">Cache Hit Rate</div>
                <div className="text-sm text-green-600">
                  {performanceMetrics?.find(m => m.name === 'Cache Hit Rate')?.value || 0}%
                </div>
              </div>
            </div>
            <div className="flex items-center p-4 bg-purple-50 rounded-lg">
              <Server className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <div className="font-semibold text-purple-800">Time Saved</div>
                <div className="text-sm text-purple-600">{optimizationStatus?.timesSaved || 0}x faster</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="cache">Cache</TabsTrigger>
          <TabsTrigger value="recommendations">AI Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Real-Time Performance Metrics</CardTitle>
              <CardDescription>Live performance indicators and trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {performanceMetrics?.map((metric, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{metric.name}</span>
                        {getTrendIcon(metric.trend)}
                      </div>
                      <Badge variant={metric.status === 'good' ? 'default' : metric.status === 'warning' ? 'secondary' : 'destructive'}>
                        {metric.status}
                      </Badge>
                    </div>
                    <div className={`text-2xl font-bold ${getMetricStatusColor(metric.status)}`}>
                      {metric.value} {metric.unit}
                    </div>
                    <Progress 
                      value={metric.status === 'good' ? 80 : metric.status === 'warning' ? 60 : 30} 
                      className="mt-2"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Optimization Settings</CardTitle>
              <CardDescription>Configure performance optimization parameters</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Batch Size</label>
                      <div className="mt-2">
                        <Slider
                          value={[settings.batchSize]}
                          onValueChange={(value) => handleSettingChange('batchSize', value[0])}
                          max={200}
                          min={10}
                          step={10}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>10</span>
                          <span>Current: {settings.batchSize}</span>
                          <span>200</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Concurrent Requests</label>
                      <div className="mt-2">
                        <Slider
                          value={[settings.concurrentRequests]}
                          onValueChange={(value) => handleSettingChange('concurrentRequests', value[0])}
                          max={20}
                          min={1}
                          step={1}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>1</span>
                          <span>Current: {settings.concurrentRequests}</span>
                          <span>20</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Retry Attempts</label>
                      <div className="mt-2">
                        <Slider
                          value={[settings.retryAttempts]}
                          onValueChange={(value) => handleSettingChange('retryAttempts', value[0])}
                          max={10}
                          min={0}
                          step={1}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>0</span>
                          <span>Current: {settings.retryAttempts}</span>
                          <span>10</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Enable Caching</div>
                        <div className="text-sm text-gray-500">Cache frequently accessed data</div>
                      </div>
                      <Switch 
                        checked={settings.cacheEnabled}
                        onCheckedChange={(checked) => handleSettingChange('cacheEnabled', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Data Compression</div>
                        <div className="text-sm text-gray-500">Compress API responses</div>
                      </div>
                      <Switch 
                        checked={settings.compressionEnabled}
                        onCheckedChange={(checked) => handleSettingChange('compressionEnabled', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Rate Limiting</div>
                        <div className="text-sm text-gray-500">Prevent API overload</div>
                      </div>
                      <Switch 
                        checked={settings.rateLimitEnabled}
                        onCheckedChange={(checked) => handleSettingChange('rateLimitEnabled', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Priority Mode</div>
                        <div className="text-sm text-gray-500">Prioritize critical operations</div>
                      </div>
                      <Switch 
                        checked={settings.priorityMode}
                        onCheckedChange={(checked) => handleSettingChange('priorityMode', checked)}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button 
                    onClick={applyOptimizations}
                    disabled={applyOptimizationMutation.isPending}
                    className="flex items-center space-x-2"
                  >
                    {applyOptimizationMutation.isPending ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Applying...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        <span>Apply Settings</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cache" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cache Management</CardTitle>
              <CardDescription>Monitor and manage performance cache</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">Cache Size</div>
                    <div className="text-2xl font-bold">{optimizationStatus?.cacheSize || 0} MB</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">Cached Requests</div>
                    <div className="text-2xl font-bold">{optimizationStatus?.optimizedRequests || 0}</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">Hit Rate</div>
                    <div className="text-2xl font-bold">
                      {performanceMetrics?.find(m => m.name === 'Cache Hit Rate')?.value || 0}%
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">Clear Cache</div>
                    <div className="text-sm text-gray-500">Remove all cached data to free memory</div>
                  </div>
                  <Button 
                    variant="outline"
                    onClick={() => clearCacheMutation.mutate()}
                    disabled={clearCacheMutation.isPending}
                  >
                    {clearCacheMutation.isPending ? 'Clearing...' : 'Clear Cache'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI-Powered Recommendations</CardTitle>
              <CardDescription>Intelligent suggestions to improve performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {optimizationStatus?.recommendations?.map((recommendation, index) => (
                  <Alert key={index}>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{recommendation}</AlertDescription>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GP51PerformanceOptimizer;
