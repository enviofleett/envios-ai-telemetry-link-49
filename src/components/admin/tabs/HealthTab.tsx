
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Activity, Server, Database, RefreshCw, CheckCircle, XCircle, AlertTriangle, Globe, Clock, Cpu } from 'lucide-react';
import GP51HealthDashboard from '@/components/AdminSettings/GP51HealthDashboard';

const HealthTab: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [systemHealth, setSystemHealth] = useState({
    database: { status: 'healthy', latency: 45, color: 'green' },
    api: { status: 'healthy', latency: 125, color: 'green' },
    gp51Connection: { status: 'warning', latency: 350, color: 'yellow' },
    websocket: { status: 'healthy', latency: 78, color: 'green' },
    cache: { status: 'healthy', latency: 24, color: 'green' },
  });

  const [resources, setResources] = useState({
    cpu: 35,
    memory: 62,
    storage: 48,
    network: 22
  });

  const refreshHealth = () => {
    setLoading(true);
    // Simulated refresh - in real app, this would fetch actual health data
    setTimeout(() => {
      setLoading(false);
      setLastRefreshed(new Date());
    }, 1500);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      healthy: 'success',
      warning: 'warning',
      error: 'destructive'
    };
    const variant = variants[status as keyof typeof variants] || 'default';
    return <Badge variant={variant}>{status}</Badge>;
  };

  const getResourceColor = (value: number) => {
    if (value < 50) return 'bg-green-500';
    if (value < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">System Health Monitoring</h3>
          <p className="text-sm text-gray-600">
            Real-time monitoring and diagnostics of system components
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Last updated: {lastRefreshed.toLocaleTimeString()}
          </span>
          <Button 
            onClick={refreshHealth} 
            variant="outline" 
            size="sm"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {Object.entries(systemHealth).map(([key, details]) => (
          <Card key={key} className="border-l-4" style={{ borderLeftColor: details.color === 'green' ? '#10b981' : details.color === 'yellow' ? '#f59e0b' : '#ef4444' }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                  <div className="mt-1">
                    {getStatusBadge(details.status)}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-semibold">{details.latency}<span className="text-sm">ms</span></p>
                  <p className="text-xs text-muted-foreground">response time</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Resource Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5" />
            System Resource Usage
          </CardTitle>
          <CardDescription>
            Current usage of system resources
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">CPU Usage</span>
                <span className="text-sm font-medium">{resources.cpu}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className={`h-full ${getResourceColor(resources.cpu)}`} style={{ width: `${resources.cpu}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Memory Usage</span>
                <span className="text-sm font-medium">{resources.memory}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className={`h-full ${getResourceColor(resources.memory)}`} style={{ width: `${resources.memory}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Storage Usage</span>
                <span className="text-sm font-medium">{resources.storage}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className={`h-full ${getResourceColor(resources.storage)}`} style={{ width: `${resources.storage}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Network Usage</span>
                <span className="text-sm font-medium">{resources.network}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className={`h-full ${getResourceColor(resources.network)}`} style={{ width: `${resources.network}%` }}></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* GP51 Health Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            GP51 Platform Health
          </CardTitle>
          <CardDescription>
            Connectivity and health status of GP51 integration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GP51HealthDashboard />
        </CardContent>
      </Card>

      {/* Recent System Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent System Events
          </CardTitle>
          <CardDescription>
            Latest system events and health incidents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-3 border border-yellow-200 rounded bg-yellow-50">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="font-medium text-yellow-900">GP51 API Response Degradation</span>
              </div>
              <p className="text-sm text-yellow-700">
                GP51 API responses have slowed down to 350ms (normal: &lt;200ms). No service disruption reported.
              </p>
              <p className="text-xs text-yellow-600 mt-1">2024-01-15 14:45:32</p>
            </div>
            
            <div className="p-3 border border-green-200 rounded bg-green-50">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-900">Database Optimization Completed</span>
              </div>
              <p className="text-sm text-green-700">
                Scheduled database optimization completed successfully. Performance improved by 15%.
              </p>
              <p className="text-xs text-green-600 mt-1">2024-01-15 13:30:00</p>
            </div>
            
            <div className="p-3 border border-red-200 rounded bg-red-50">
              <div className="flex items-center gap-2 mb-1">
                <XCircle className="h-4 w-4 text-red-600" />
                <span className="font-medium text-red-900">Cache Service Restarted</span>
              </div>
              <p className="text-sm text-red-700">
                Cache service was automatically restarted after detecting memory allocation issues.
              </p>
              <p className="text-xs text-red-600 mt-1">2024-01-15 12:15:45</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HealthTab;
