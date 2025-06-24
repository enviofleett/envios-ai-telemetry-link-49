
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Activity, Clock, CheckCircle, AlertTriangle, BarChart3, RefreshCw } from 'lucide-react';
import { gp51DataService, GP51PerformanceMetrics } from '@/services/gp51/GP51DataService';
import { gp51ErrorReporter } from '@/services/gp51/errorReporter';

const GP51PerformanceMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<GP51PerformanceMetrics[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    refreshMetrics();
  }, []);

  const refreshMetrics = () => {
    setIsRefreshing(true);
    const currentMetrics = gp51DataService.getPerformanceMetrics();
    setMetrics(currentMetrics);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const getAverageResponseTime = () => {
    if (metrics.length === 0) return 0;
    return Math.round(metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length);
  };

  const getSuccessRate = () => {
    if (metrics.length === 0) return 100;
    const successCount = metrics.filter(m => m.success).length;
    return Math.round((successCount / metrics.length) * 100);
  };

  const getRecentMetrics = () => {
    return metrics.slice(-10).reverse();
  };

  const getErrorSummary = () => {
    return gp51ErrorReporter.getErrorSummary();
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getStatusBadge = (success: boolean, errorType?: string) => {
    if (success) {
      return <Badge className="bg-green-100 text-green-800">Success</Badge>;
    } else {
      return (
        <Badge className="bg-red-100 text-red-800">
          {errorType || 'Error'}
        </Badge>
      );
    }
  };

  const errorSummary = getErrorSummary();
  const successRate = getSuccessRate();
  const avgResponseTime = getAverageResponseTime();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-blue-600" />
              <CardTitle>GP51 Performance Monitor</CardTitle>
            </div>
            <Button variant="outline" size="sm" onClick={refreshMetrics} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          <CardDescription>
            Real-time monitoring of GP51 API performance and reliability
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="flex items-center p-4 bg-blue-50 rounded-lg">
              <BarChart3 className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <div className="font-semibold text-blue-800">{metrics.length}</div>
                <div className="text-sm text-blue-600">Total Requests</div>
              </div>
            </div>
            <div className="flex items-center p-4 bg-green-50 rounded-lg">
              <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <div className="font-semibold text-green-800">{successRate}%</div>
                <div className="text-sm text-green-600">Success Rate</div>
              </div>
            </div>
            <div className="flex items-center p-4 bg-purple-50 rounded-lg">
              <Clock className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <div className="font-semibold text-purple-800">{avgResponseTime}ms</div>
                <div className="text-sm text-purple-600">Avg Response</div>
              </div>
            </div>
            <div className="flex items-center p-4 bg-orange-50 rounded-lg">
              <AlertTriangle className="h-8 w-8 text-orange-600 mr-3" />
              <div>
                <div className="font-semibold text-orange-800">{errorSummary.total}</div>
                <div className="text-sm text-orange-600">Active Errors</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent API Calls</CardTitle>
          <CardDescription>Last 10 GP51 API requests with performance details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {getRecentMetrics().length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No API calls recorded yet. Try fetching device data to see metrics.
              </div>
            ) : (
              getRecentMetrics().map((metric, index) => (
                <div key={`${metric.requestStartTime}-${index}`} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getStatusBadge(metric.success, metric.errorType)}
                    <span className="text-sm font-medium">
                      {formatTimestamp(metric.requestStartTime)}
                    </span>
                    {metric.deviceCount !== undefined && (
                      <span className="text-sm text-gray-600">
                        {metric.deviceCount} devices
                      </span>
                    )}
                    {metric.groupCount !== undefined && (
                      <span className="text-sm text-gray-600">
                        {metric.groupCount} groups
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">{metric.responseTime}ms</span>
                    <div className={`w-2 h-2 rounded-full ${
                      metric.responseTime < 1000 ? 'bg-green-500' :
                      metric.responseTime < 3000 ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {errorSummary.total > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-700">Error Summary</CardTitle>
            <CardDescription>Current error breakdown by type and severity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">By Type</h4>
                <div className="space-y-1">
                  {Object.entries(errorSummary.byType).map(([type, count]) => (
                    <div key={type} className="flex justify-between text-sm">
                      <span className="capitalize">{type}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">By Severity</h4>
                <div className="space-y-1">
                  {Object.entries(errorSummary.bySeverity).map(([severity, count]) => (
                    <div key={severity} className="flex justify-between text-sm">
                      <span className="capitalize">{severity}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-4"
              onClick={() => gp51ErrorReporter.clearErrorQueue()}
            >
              Clear Error Queue
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GP51PerformanceMonitor;
