
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, Database, Wifi, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { useSystemHealth } from '@/hooks/useSystemHealth';

const HealthTab: React.FC = () => {
  const { data: healthMetrics, isLoading, error, refetch } = useSystemHealth();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <Activity className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge variant="default" className="bg-green-100 text-green-800">Healthy</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Warning</Badge>;
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="grid grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-20 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Error loading system health: {error.message}
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
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon(healthMetrics?.overallHealth || 'unknown')}
                System Health
              </CardTitle>
              <CardDescription>
                Monitor system performance and connectivity
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(healthMetrics?.overallHealth || 'unknown')}
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* GP51 Status */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">GP51 Connection</p>
                    <p className="text-lg font-semibold">
                      {healthMetrics?.gp51Status.connected ? 'Connected' : 'Disconnected'}
                    </p>
                    {healthMetrics?.gp51Status.username && (
                      <p className="text-xs text-muted-foreground">
                        User: {healthMetrics.gp51Status.username}
                      </p>
                    )}
                    {healthMetrics?.gp51Status.warningMessage && (
                      <p className="text-xs text-yellow-600 mt-1">
                        {healthMetrics.gp51Status.warningMessage}
                      </p>
                    )}
                  </div>
                  <Wifi className={`h-8 w-8 ${healthMetrics?.gp51Status.connected ? 'text-green-600' : 'text-red-600'}`} />
                </div>
              </CardContent>
            </Card>

            {/* Database Status */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Database</p>
                    <p className="text-lg font-semibold">
                      {healthMetrics?.databaseStatus.connected ? 'Connected' : 'Disconnected'}
                    </p>
                    {healthMetrics?.databaseStatus.responseTime && (
                      <p className="text-xs text-muted-foreground">
                        Response: {healthMetrics.databaseStatus.responseTime}ms
                      </p>
                    )}
                  </div>
                  <Database className={`h-8 w-8 ${healthMetrics?.databaseStatus.connected ? 'text-green-600' : 'text-red-600'}`} />
                </div>
              </CardContent>
            </Card>

            {/* API Endpoints */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">API Endpoints</p>
                    <p className="text-lg font-semibold">
                      {healthMetrics?.apiEndpoints.available}/{healthMetrics?.apiEndpoints.total} Available
                    </p>
                    {healthMetrics?.apiEndpoints.issues.length > 0 && (
                      <p className="text-xs text-red-600 mt-1">
                        {healthMetrics.apiEndpoints.issues.length} issues detected
                      </p>
                    )}
                  </div>
                  <Activity className={`h-8 w-8 ${healthMetrics?.apiEndpoints.available === healthMetrics?.apiEndpoints.total ? 'text-green-600' : 'text-yellow-600'}`} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Vehicle Data */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base">Vehicle Data</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{healthMetrics?.vehicleData.total || 0}</p>
                  <p className="text-sm text-muted-foreground">Total Vehicles</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{healthMetrics?.vehicleData.online || 0}</p>
                  <p className="text-sm text-muted-foreground">Online</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{healthMetrics?.vehicleData.offline || 0}</p>
                  <p className="text-sm text-muted-foreground">Offline</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Last Update</p>
                  <p className="text-sm">
                    {healthMetrics?.vehicleData.lastUpdate 
                      ? new Date(healthMetrics.vehicleData.lastUpdate).toLocaleString()
                      : 'Never'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Metrics */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base">User Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{healthMetrics?.userMetrics.total || 0}</p>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{healthMetrics?.userMetrics.active || 0}</p>
                  <p className="text-sm text-muted-foreground">Active Users</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold">{healthMetrics?.userMetrics.roles?.admin || 0}</p>
                  <p className="text-sm text-muted-foreground">Admins</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold">{healthMetrics?.userMetrics.roles?.user || 0}</p>
                  <p className="text-sm text-muted-foreground">Regular Users</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Issues */}
          {healthMetrics?.apiEndpoints.issues.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-base text-red-600">System Issues</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {healthMetrics.apiEndpoints.issues.map((issue, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <span>{issue}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HealthTab;
