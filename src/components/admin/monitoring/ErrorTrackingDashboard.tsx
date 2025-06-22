
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { errorTrackingService, ErrorTrackingMetrics } from '@/services/monitoring/ErrorTrackingService';

const ErrorTrackingDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<ErrorTrackingMetrics>({
    totalErrors: 0,
    errorsBySeverity: {},
    errorsBySource: {},
    recentErrors: [],
    errorTrends: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadErrorMetrics();
    const interval = setInterval(loadErrorMetrics, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadErrorMetrics = async () => {
    try {
      const data = await errorTrackingService.getErrorMetrics();
      setMetrics(data);
    } catch (error) {
      console.error('Failed to load error metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="h-4 w-4" />;
      case 'medium':
        return <Clock className="h-4 w-4" />;
      case 'low':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const handleResolveError = async (errorId: string) => {
    try {
      await errorTrackingService.resolveError(errorId, 'Manually resolved by admin');
      await loadErrorMetrics();
    } catch (error) {
      console.error('Failed to resolve error:', error);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error Tracking Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Errors</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalErrors}</div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Errors</CardTitle>
            <TrendingUp className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {metrics.errorsBySeverity.critical || 0}
            </div>
            <p className="text-xs text-muted-foreground">Requires immediate attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <TrendingDown className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {metrics.errorsBySeverity.high || 0}
            </div>
            <p className="text-xs text-muted-foreground">Needs attention soon</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {metrics.recentErrors.filter(e => e.resolved_at).length}
            </div>
            <p className="text-xs text-muted-foreground">Successfully resolved</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Errors by Source</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(metrics.errorsBySource).map(([source, count]) => (
                <div key={source} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="capitalize">{source.replace('_', ' ')}</span>
                  </div>
                  <Badge variant="secondary">{count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Errors by Severity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(metrics.errorsBySeverity).map(([severity, count]) => (
                <div key={severity} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${getSeverityColor(severity)}`}></div>
                    <span className="capitalize">{severity}</span>
                  </div>
                  <Badge variant="secondary">{count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Errors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.recentErrors.map((error) => (
              <div key={error.id} className="flex items-start justify-between p-4 border rounded-lg">
                <div className="flex items-start space-x-3">
                  <div className={`p-1 rounded-full ${getSeverityColor(error.error_severity)}`}>
                    {getSeverityIcon(error.error_severity)}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{error.error_type}</div>
                    <div className="text-sm text-muted-foreground">{error.error_message}</div>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                      <span>Source: {error.error_source}</span>
                      <span>Count: {error.occurrence_count}</span>
                      <span>First: {new Date(error.first_occurred_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                {!error.resolved_at && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleResolveError(error.id)}
                  >
                    Resolve
                  </Button>
                )}
                {error.resolved_at && (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    Resolved
                  </Badge>
                )}
              </div>
            ))}
            {metrics.recentErrors.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No recent errors found. System is running smoothly! 🎉
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ErrorTrackingDashboard;
