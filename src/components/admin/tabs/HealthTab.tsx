
import React from 'react';
import { useSystemHealth } from '@/hooks/useSystemHealth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, AlertTriangle, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const HealthTab: React.FC = () => {
  const { healthMetrics, isLoading, error } = useSystemHealth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Health Check Error</CardTitle>
          <CardDescription>Could not load system health information.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variant = status === 'healthy' ? 'default' : 
                   status === 'warning' ? 'secondary' : 'destructive';
    return <Badge variant={variant}>{status.toUpperCase()}</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon(healthMetrics?.overallHealth || 'unknown')}
            System Health Overview
          </CardTitle>
          <CardDescription>
            Current status of all system components
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">Overall Health</span>
                {getStatusBadge(healthMetrics?.overallHealth || 'unknown')}
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Total Vehicles</span>
                <span>{healthMetrics?.totalVehicles || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Active Users</span>
                <span>{healthMetrics?.activeUsers || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Recent Activity</span>
                <span>{healthMetrics?.recentActivity || 0}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">System Uptime</span>
                <span>{healthMetrics?.systemUptime || 0}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">GP51 Status</span>
                {getStatusBadge(healthMetrics?.gp51Status.connected ? 'healthy' : 'critical')}
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Database</span>
                {getStatusBadge(healthMetrics?.databaseStatus.connected ? 'healthy' : 'critical')}
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">API Endpoints</span>
                <span>{healthMetrics?.apiEndpoints.available || 0}/{healthMetrics?.apiEndpoints.total || 0}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {healthMetrics?.gp51Status.username && (
        <Card>
          <CardHeader>
            <CardTitle>GP51 Connection Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">Active Session</span>
                <span>{healthMetrics.gp51Status.username}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Connection Status</span>
                {getStatusBadge(healthMetrics.gp51Status.connected ? 'healthy' : 'critical')}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {healthMetrics?.databaseStatus && (
        <Card>
          <CardHeader>
            <CardTitle>Database Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">Response Time</span>
                <span>{healthMetrics.databaseStatus.responseTime}ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Connection Status</span>
                {getStatusBadge(healthMetrics.databaseStatus.connected ? 'healthy' : 'critical')}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default HealthTab;
