
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Database, 
  Server, 
  Users, 
  Car, 
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useSystemHealth } from '@/hooks/useSystemHealth';
import { useAdvancedExport } from '@/hooks/useAdvancedExport';
import { useQueryClient } from '@tanstack/react-query';

const SystemHealthPanel: React.FC = () => {
  const { data: health, isLoading, error } = useSystemHealth();
  const { exportSystemHealth, isExporting, progress } = useAdvancedExport();
  const queryClient = useQueryClient();

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['system-health'] });
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'critical': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <RefreshCw className="h-4 w-4 text-gray-500" />;
    }
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            System Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !health) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            System Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Failed to load system health data. Please check your connection.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            System Health
            <Badge className={getHealthColor(health.overallHealth)}>
              {getHealthIcon(health.overallHealth)}
              {health.overallHealth.toUpperCase()}
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportSystemHealth('csv')}
              disabled={isExporting}
            >
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Export Progress */}
        {isExporting && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Exporting system health data...</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* GP51 Status */}
        <div className="space-y-2">
          <h4 className="font-medium flex items-center gap-2">
            <Database className="h-4 w-4" />
            GP51 Integration
          </h4>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm">Connection Status</span>
              <Badge className={health.gp51Status.connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                {health.gp51Status.connected ? 'Connected' : 'Disconnected'}
              </Badge>
            </div>
            {health.gp51Status.connected && health.gp51Status.username && (
              <div className="text-xs text-gray-600 mt-1">
                User: {health.gp51Status.username}
                {health.gp51Status.timeUntilExpiry && (
                  <span className="ml-2">
                    (Expires in {health.gp51Status.timeUntilExpiry} minutes)
                  </span>
                )}
              </div>
            )}
            {health.gp51Status.warningMessage && (
              <Alert className="mt-2 py-2">
                <AlertTriangle className="h-3 w-3" />
                <AlertDescription className="text-xs">
                  {health.gp51Status.warningMessage}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        {/* Database Status */}
        <div className="space-y-2">
          <h4 className="font-medium flex items-center gap-2">
            <Database className="h-4 w-4" />
            Database
          </h4>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm">Connection</span>
              <Badge className={health.databaseStatus.connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                {health.databaseStatus.connected ? 'Active' : 'Failed'}
              </Badge>
            </div>
            {health.databaseStatus.responseTime && (
              <div className="text-xs text-gray-600 mt-1">
                Response time: {health.databaseStatus.responseTime}ms
              </div>
            )}
          </div>
        </div>

        {/* API Endpoints */}
        <div className="space-y-2">
          <h4 className="font-medium flex items-center gap-2">
            <Server className="h-4 w-4" />
            API Endpoints
          </h4>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm">Available Services</span>
              <Badge className={health.apiEndpoints.available === health.apiEndpoints.total ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                {health.apiEndpoints.available}/{health.apiEndpoints.total}
              </Badge>
            </div>
            {health.apiEndpoints.issues.length > 0 && (
              <div className="mt-2 space-y-1">
                {health.apiEndpoints.issues.map((issue, index) => (
                  <div key={index} className="text-xs text-red-600">
                    {issue}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* System Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <Car className="h-4 w-4" />
              Vehicles
            </h4>
            <div className="bg-gray-50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold">{health.vehicleData.total}</div>
              <div className="text-xs text-gray-600">
                {health.vehicleData.online} online • {health.vehicleData.offline} offline
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users
            </h4>
            <div className="bg-gray-50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold">{health.userMetrics.total}</div>
              <div className="text-xs text-gray-600">
                {Object.entries(health.userMetrics.roles).map(([role, count]) => 
                  `${count} ${role}`
                ).join(' • ') || 'No role data'}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SystemHealthPanel;
