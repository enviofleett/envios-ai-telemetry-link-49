
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Activity, 
  Database, 
  Wifi, 
  Clock,
  MemoryStick,
  Zap
} from 'lucide-react';
import { useSystemHealth } from '@/hooks/useSystemHealth';

const SystemHealthDashboard: React.FC = () => {
  const { healthStatus, isLoading, resolveAlert, clearResolvedAlerts } = useSystemHealth();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!healthStatus) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            System health monitoring unavailable
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'critical':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      healthy: 'default',
      warning: 'secondary', 
      critical: 'destructive'
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getMetricIcon = (metricName: string) => {
    switch (metricName) {
      case 'gp51_api':
        return <Wifi className="h-4 w-4" />;
      case 'database':
        return <Database className="h-4 w-4" />;
      case 'sync_service':
        return <Activity className="h-4 w-4" />;
      case 'memory_usage':
        return <MemoryStick className="h-4 w-4" />;
      case 'polling_service':
        return <Zap className="h-4 w-4" />;
      case 'system_response_time':
        return <Clock className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const formatMetricName = (name: string) => {
    return name.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatUptime = (uptime: number) => {
    const hours = Math.floor(uptime / (1000 * 60 * 60));
    const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const getOverallHealthColor = () => {
    switch (healthStatus.overall) {
      case 'healthy':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'critical':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Overall System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon(healthStatus.overall)}
            <span className={getOverallHealthColor()}>
              System Status: {healthStatus.overall.charAt(0).toUpperCase() + healthStatus.overall.slice(1)}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{formatUptime(healthStatus.uptime)}</div>
              <div className="text-sm text-gray-600">System Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{healthStatus.responseTime}ms</div>
              <div className="text-sm text-gray-600">Response Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{healthStatus.alerts.length}</div>
              <div className="text-sm text-gray-600">Active Alerts</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Health Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>System Health Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {healthStatus.metrics.map((metric, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getMetricIcon(metric.name)}
                    <span className="font-medium text-sm">
                      {formatMetricName(metric.name)}
                    </span>
                  </div>
                  {getStatusBadge(metric.status)}
                </div>
                
                <div className="text-lg font-bold mb-1">
                  {metric.value}
                </div>
                
                {metric.message && (
                  <div className="text-xs text-gray-600">
                    {metric.message}
                  </div>
                )}
                
                <div className="text-xs text-gray-500 mt-2">
                  Last checked: {metric.lastChecked.toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Active Alerts */}
      {healthStatus.alerts.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-red-600">Active Alerts</CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={clearResolvedAlerts}
            >
              Clear Resolved
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {healthStatus.alerts.map((alert) => (
                <div 
                  key={alert.id} 
                  className={`p-3 border rounded-lg ${
                    alert.type === 'error' ? 'border-red-200 bg-red-50' :
                    alert.type === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                    'border-blue-200 bg-blue-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {alert.type === 'error' && <XCircle className="h-4 w-4 text-red-600" />}
                        {alert.type === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-600" />}
                        {alert.type === 'info' && <CheckCircle className="h-4 w-4 text-blue-600" />}
                        <Badge variant={alert.type === 'error' ? 'destructive' : alert.type === 'warning' ? 'secondary' : 'default'}>
                          {alert.type.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="text-sm font-medium mb-1">
                        {alert.message}
                      </div>
                      <div className="text-xs text-gray-500">
                        {alert.timestamp.toLocaleString()}
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => resolveAlert(alert.id)}
                    >
                      Resolve
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Health Score */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Health Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {['healthy', 'warning', 'critical'].map((status) => {
              const count = healthStatus.metrics.filter(m => m.status === status).length;
              const percentage = healthStatus.metrics.length > 0 ? 
                (count / healthStatus.metrics.length) * 100 : 0;
              
              return (
                <div key={status} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-1">
                      {getStatusIcon(status)}
                      {status.charAt(0).toUpperCase() + status.slice(1)} ({count})
                    </span>
                    <span>{percentage.toFixed(1)}%</span>
                  </div>
                  <Progress 
                    value={percentage} 
                    className={`h-2 ${
                      status === 'healthy' ? '[&>div]:bg-green-500' :
                      status === 'warning' ? '[&>div]:bg-yellow-500' :
                      '[&>div]:bg-red-500'
                    }`}
                  />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemHealthDashboard;
