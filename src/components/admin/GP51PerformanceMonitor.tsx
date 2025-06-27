
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RefreshCw, TrendingUp, TrendingDown, Activity, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { GP51PerformanceMetrics } from '@/types/gp51-unified';
import { gp51DataService } from '@/services/gp51/GP51DataService';

interface PerformanceAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  timestamp: Date;
  metric: string;
  value: number;
  threshold: number;
}

const GP51PerformanceMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<GP51PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const { toast } = useToast();

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const data = await gp51DataService.getPerformanceMetrics();
      setMetrics(data);
      
      // Check for performance alerts
      checkPerformanceAlerts(data);
      
    } catch (error) {
      console.error('Failed to fetch performance metrics:', error);
      toast({
        title: "Error",
        description: "Failed to load performance metrics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkPerformanceAlerts = (data: GP51PerformanceMetrics) => {
    const newAlerts: PerformanceAlert[] = [];
    
    // Check response time
    if (data.averageResponseTime > 5000) {
      newAlerts.push({
        id: 'response_time',
        type: 'warning',
        message: 'High response time detected',
        timestamp: new Date(),
        metric: 'Response Time',
        value: data.averageResponseTime,
        threshold: 5000
      });
    }

    // Check error rate
    if (data.errorRate > 0.05) {
      newAlerts.push({
        id: 'error_rate',
        type: 'error',
        message: 'Error rate exceeds threshold',
        timestamp: new Date(),
        metric: 'Error Rate',
        value: data.errorRate * 100,
        threshold: 5
      });
    }

    // Check data quality
    if (data.dataQuality < 0.8) {
      newAlerts.push({
        id: 'data_quality',
        type: 'warning',
        message: 'Data quality below acceptable level',
        timestamp: new Date(),
        metric: 'Data Quality',
        value: data.dataQuality * 100,
        threshold: 80
      });
    }

    // Check online percentage
    if (data.onlinePercentage < 70) {
      newAlerts.push({
        id: 'online_percentage',
        type: 'warning',
        message: 'Low vehicle online percentage',
        timestamp: new Date(),
        metric: 'Online Percentage',
        value: data.onlinePercentage,
        threshold: 70
      });
    }

    setAlerts(newAlerts);
  };

  useEffect(() => {
    fetchMetrics();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getMetricTrend = (value: number, threshold: number, isHigherBetter: boolean = true) => {
    const isGood = isHigherBetter ? value >= threshold : value <= threshold;
    return isGood ? 'good' : 'bad';
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  if (!metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Monitor</CardTitle>
          <CardDescription>Loading performance metrics...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Performance Monitor</CardTitle>
              <CardDescription>
                Real-time performance metrics and system health indicators
              </CardDescription>
            </div>
            <Button onClick={fetchMetrics} disabled={loading} variant="outline" size="sm">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Response Time */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Response Time</span>
                {getMetricTrend(metrics.averageResponseTime, 2000, false) === 'good' ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
              </div>
              <div className="text-2xl font-bold">
                {formatDuration(metrics.averageResponseTime)}
              </div>
              <Progress 
                value={Math.min(100, (2000 / metrics.averageResponseTime) * 100)} 
                className="h-2"
              />
            </div>

            {/* Error Rate */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Error Rate</span>
                {getMetricTrend(metrics.errorRate, 0.05, false) === 'good' ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
              </div>
              <div className="text-2xl font-bold">
                {formatPercentage(metrics.errorRate)}
              </div>
              <Progress 
                value={Math.max(0, 100 - (metrics.errorRate * 2000))} 
                className="h-2"
              />
            </div>

            {/* Data Quality */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Data Quality</span>
                {getMetricTrend(metrics.dataQuality, 0.8, true) === 'good' ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
              </div>
              <div className="text-2xl font-bold">
                {formatPercentage(metrics.dataQuality)}
              </div>
              <Progress value={metrics.dataQuality * 100} className="h-2" />
            </div>

            {/* Online Percentage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Online Vehicles</span>
                {getMetricTrend(metrics.onlinePercentage, 70, true) === 'good' ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
              </div>
              <div className="text-2xl font-bold">
                {metrics.onlinePercentage.toFixed(1)}%
              </div>
              <Progress value={metrics.onlinePercentage} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vehicle Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Fleet Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{metrics.totalVehicles}</div>
              <div className="text-sm text-muted-foreground">Total Vehicles</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{metrics.activeVehicles}</div>
              <div className="text-sm text-muted-foreground">Active Vehicles</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{metrics.activeDevices}</div>
              <div className="text-sm text-muted-foreground">Active Devices</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{metrics.utilizationRate.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Utilization Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Performance Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border ${
                    alert.type === 'error' ? 'border-red-200 bg-red-50' :
                    alert.type === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                    'border-blue-200 bg-blue-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{alert.message}</div>
                      <div className="text-sm text-muted-foreground">
                        {alert.metric}: {alert.value} (threshold: {alert.threshold})
                      </div>
                    </div>
                    <Badge variant={alert.type === 'error' ? 'destructive' : 'secondary'}>
                      {alert.type.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Health Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Health Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Last Updated</span>
              <span className="font-medium">{metrics.lastUpdateTime.toLocaleTimeString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Overall Health</span>
              <Badge variant={alerts.length === 0 ? 'default' : 'destructive'}>
                {alerts.length === 0 ? 'Healthy' : `${alerts.length} Issues`}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Fleet Utilization</span>
              <span className="font-medium">{metrics.utilizationRate.toFixed(1)}%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GP51PerformanceMonitor;
