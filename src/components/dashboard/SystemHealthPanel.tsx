
import React from 'react';
import { useSystemHealth } from '@/hooks/useSystemHealth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, AlertTriangle, CheckCircle, Database, Server } from 'lucide-react';

const SystemHealthPanel: React.FC = () => {
  const { healthMetrics, isLoading, error } = useSystemHealth();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>System Health</CardTitle>
          <CardDescription>Loading system status...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">System Health</CardTitle>
          <CardDescription>Error loading system status</CardDescription>
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
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variant = status === 'healthy' ? 'default' : 
                   status === 'warning' ? 'secondary' : 'destructive';
    return <Badge variant={variant} className="text-xs">{status}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon(healthMetrics?.overallHealth || 'unknown')}
          System Health
        </CardTitle>
        <CardDescription>Current system status overview</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">GP51</span>
            </div>
            {getStatusBadge(healthMetrics?.gp51Status.connected ? 'healthy' : 'critical')}
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Database</span>
            </div>
            {getStatusBadge(healthMetrics?.databaseStatus.connected ? 'healthy' : 'critical')}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-medium">Vehicles</div>
            <div className="text-muted-foreground">{healthMetrics?.totalVehicles || 0}</div>
          </div>
          <div>
            <div className="font-medium">Users</div>
            <div className="text-muted-foreground">{healthMetrics?.activeUsers || 0}</div>
          </div>
          <div>
            <div className="font-medium">Uptime</div>
            <div className="text-muted-foreground">{healthMetrics?.systemUptime || 0}%</div>
          </div>
          <div>
            <div className="font-medium">Recent Activity</div>
            <div className="text-muted-foreground">{healthMetrics?.recentActivity || 0}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SystemHealthPanel;
