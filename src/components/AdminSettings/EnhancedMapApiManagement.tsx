
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useMapConfigs } from '@/hooks/useMapTilerApi';
import { 
  Map, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  TrendingUp,
  Bell,
  Settings,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';
import LoadingSpinner from '@/components/LoadingSpinner';

const EnhancedMapApiManagement: React.FC = () => {
  const { configs, isLoading, saveConfig, deleteConfig, refetch } = useMapConfigs();
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        refetch();
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
  }, [autoRefresh, refetch]);

  const getTodayUsage = (config: any) => {
    if (!config.map_api_usage || config.map_api_usage.length === 0) return 0;
    
    const today = new Date().toISOString().split('T')[0];
    const todayUsage = config.map_api_usage.find((usage: any) => 
      usage.usage_date === today
    );
    
    return todayUsage?.request_count || 0;
  };

  const getUsagePercentage = (config: any) => {
    const usage = getTodayUsage(config);
    return (usage / config.threshold_value) * 100;
  };

  const getAlertLevel = (config: any) => {
    const percentage = getUsagePercentage(config);
    
    if (percentage >= 95) return { level: 'critical', color: 'bg-red-500', threshold: 95 };
    if (percentage >= 90) return { level: 'high', color: 'bg-orange-500', threshold: 90 };
    if (percentage >= 80) return { level: 'warning', color: 'bg-yellow-500', threshold: 80 };
    return { level: 'normal', color: 'bg-green-500', threshold: 0 };
  };

  const getStatusBadge = (config: any) => {
    if (!config.is_active) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    
    const alertLevel = getAlertLevel(config);
    
    switch (alertLevel.level) {
      case 'critical':
        return <Badge className="bg-red-500 text-white">Critical Usage</Badge>;
      case 'high':
        return <Badge className="bg-orange-500 text-white">High Usage</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-500 text-white">Warning</Badge>;
      default:
        return <Badge className="bg-green-500 text-white">Active</Badge>;
    }
  };

  const handleToggleAutoFallback = async (config: any, enabled: boolean) => {
    try {
      await saveConfig({
        ...config,
        auto_fallback_enabled: enabled
      });
      toast.success('Auto-fallback setting updated');
      refetch();
    } catch (error) {
      toast.error('Failed to update auto-fallback setting');
    }
  };

  const handleUpdateThresholds = async (config: any, thresholds: {
    alert_threshold_80: number;
    alert_threshold_90: number;
    alert_threshold_95: number;
  }) => {
    try {
      await saveConfig({
        ...config,
        ...thresholds
      });
      toast.success('Alert thresholds updated');
      refetch();
    } catch (error) {
      toast.error('Failed to update alert thresholds');
    }
  };

  const calculateEfficiency = (config: any) => {
    const usage = getTodayUsage(config);
    const weight = config.performance_weight || 1;
    const efficiency = usage > 0 ? (usage / config.threshold_value) * weight : 0;
    return Math.min(efficiency * 100, 100);
  };

  const getRecommendedAction = (config: any) => {
    const percentage = getUsagePercentage(config);
    
    if (!config.is_active) return 'Activate this configuration to enable usage';
    if (percentage >= 95) return 'Consider switching to fallback or increasing limit';
    if (percentage >= 90) return 'Monitor closely - approaching limit';
    if (percentage >= 80) return 'Usage warning - prepare fallback if needed';
    return 'Operating normally';
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <LoadingSpinner />
            <span className="ml-2">Loading enhanced map configurations...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const activeConfigs = configs.filter(c => c.is_active);
  const totalDailyUsage = activeConfigs.reduce((sum, config) => sum + getTodayUsage(config), 0);
  const avgUsagePercentage = activeConfigs.length > 0 
    ? activeConfigs.reduce((sum, config) => sum + getUsagePercentage(config), 0) / activeConfigs.length
    : 0;

  return (
    <div className="space-y-6">
      {/* System Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Enhanced Map API Management
            </CardTitle>
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="auto-refresh"
                  checked={autoRefresh}
                  onCheckedChange={setAutoRefresh}
                />
                <Label htmlFor="auto-refresh" className="text-sm">Auto-refresh</Label>
              </div>
              <Button onClick={refetch} variant="outline" size="sm">
                <TrendingUp className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{activeConfigs.length}</div>
              <div className="text-sm text-gray-600">Active Configs</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">{totalDailyUsage.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Today's Requests</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{avgUsagePercentage.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">Avg Usage</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {activeConfigs.filter(c => c.auto_fallback_enabled).length}
              </div>
              <div className="text-sm text-gray-600">Auto-fallback Enabled</div>
            </div>
          </div>

          {/* System Alerts */}
          {activeConfigs.some(config => getUsagePercentage(config) >= 90) && (
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>High Usage Alert:</strong> One or more API configurations are approaching their daily limits.
                Consider enabling auto-fallback or increasing thresholds.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* API Configurations */}
      <div className="grid gap-6">
        {configs.map((config) => {
          const usagePercentage = getUsagePercentage(config);
          const alertLevel = getAlertLevel(config);
          const efficiency = calculateEfficiency(config);
          const recommendation = getRecommendedAction(config);

          return (
            <Card key={config.id} className="overflow-hidden">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{config.name}</h3>
                      {getStatusBadge(config)}
                      <Badge variant="outline">Priority {config.fallback_priority}</Badge>
                      {config.auto_fallback_enabled && (
                        <Badge variant="outline" className="text-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Auto-fallback
                        </Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Provider:</span>
                        <span className="ml-1 capitalize">{config.provider_type}</span>
                      </div>
                      <div>
                        <span className="font-medium">Daily Limit:</span>
                        <span className="ml-1">{config.threshold_value.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="font-medium">Today's Usage:</span>
                        <span className="ml-1">{getTodayUsage(config).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="font-medium">Performance Weight:</span>
                        <span className="ml-1">{config.performance_weight || 1}x</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Usage Progress */}
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span>Usage Progress</span>
                    <span className="font-medium">{usagePercentage.toFixed(1)}%</span>
                  </div>
                  <Progress 
                    value={Math.min(usagePercentage, 100)} 
                    className="h-3"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0</span>
                    <span className="text-yellow-600">80%</span>
                    <span className="text-orange-600">90%</span>
                    <span className="text-red-600">95%</span>
                    <span>{config.threshold_value.toLocaleString()}</span>
                  </div>
                </div>

                {/* Alert Thresholds */}
                <div className="grid grid-cols-3 gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-xs text-gray-600">Warning (80%)</div>
                    <div className="font-medium text-yellow-600">
                      {Math.round(config.threshold_value * 0.8).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-600">High (90%)</div>
                    <div className="font-medium text-orange-600">
                      {Math.round(config.threshold_value * 0.9).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-600">Critical (95%)</div>
                    <div className="font-medium text-red-600">
                      {Math.round(config.threshold_value * 0.95).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Auto-fallback Controls */}
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">Auto-fallback</div>
                    <div className="text-sm text-gray-600">
                      Automatically switch when threshold is reached
                    </div>
                  </div>
                  <Switch
                    checked={config.auto_fallback_enabled || false}
                    onCheckedChange={(enabled) => handleToggleAutoFallback(config, enabled)}
                  />
                </div>

                {/* Recommendations */}
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Bell className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-blue-900">Recommendation</div>
                      <div className="text-sm text-blue-700">{recommendation}</div>
                    </div>
                  </div>
                </div>

                {/* Last Alert */}
                {config.last_alert_sent && (
                  <div className="text-xs text-gray-500">
                    <Clock className="h-3 w-3 inline mr-1" />
                    Last alert: {new Date(config.last_alert_sent).toLocaleString()}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default EnhancedMapApiManagement;
