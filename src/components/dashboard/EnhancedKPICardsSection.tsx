
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Car, 
  CheckCircle, 
  XCircle, 
  Clock, 
  RefreshCw,
  AlertTriangle,
  Activity,
  Database,
  Loader2
} from 'lucide-react';
import { useEnhancedVehicleData } from '@/hooks/useEnhancedVehicleData';
import { useGP51ConnectionHealth } from '@/hooks/useGP51ConnectionHealth';

const EnhancedKPICardsSection: React.FC = () => {
  const { metrics, isLoading, forceSync } = useEnhancedVehicleData();
  const { status: connectionStatus, isLoading: connectionLoading, performHealthCheck } = useGP51ConnectionHealth();

  const getSyncStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'default';
      case 'error': return 'destructive';
      case 'loading': return 'secondary'; // Fixed: changed from 'pending' to 'loading'
      default: return 'secondary';
    }
  };

  const getSyncStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'loading': // Fixed: changed from 'pending' to 'loading'
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getConnectionStatusColor = (status?: string) => {
    switch (status) {
      case 'connected': return 'default';
      case 'degraded': return 'secondary';
      case 'disconnected': return 'destructive';
      case 'auth_error': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Vehicles */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
          <Car className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {isLoading ? '-' : metrics.totalVehicles.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            Registered in system
          </p>
        </CardContent>
      </Card>

      {/* Online Vehicles */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Online Vehicles</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {isLoading ? '-' : metrics.onlineVehicles.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            Active in last 15 minutes
          </p>
        </CardContent>
      </Card>

      {/* Offline Vehicles */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Offline Vehicles</CardTitle>
          <XCircle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {isLoading ? '-' : metrics.offlineVehicles.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            No data for 2+ hours
          </p>
        </CardContent>
      </Card>

      {/* Recently Active */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Recently Active</CardTitle>
          <Activity className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {isLoading ? '-' : metrics.recentlyActiveVehicles.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            Active in last 30 minutes
          </p>
        </CardContent>
      </Card>

      {/* System Status Card - Full Width */}
      <Card className="col-span-1 md:col-span-2 lg:col-span-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">System Status</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={performHealthCheck}
                disabled={connectionLoading}
              >
                <RefreshCw className={`h-4 w-4 ${connectionLoading ? 'animate-spin' : ''}`} />
                Test Connection
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={forceSync}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Sync Data
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* GP51 Connection Status */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">GP51 Connection:</span>
              <Badge variant={getConnectionStatusColor(connectionStatus?.status)} className="flex items-center gap-1">
                {connectionStatus?.status === 'connected' && <CheckCircle className="h-3 w-3" />}
                {connectionStatus?.status === 'disconnected' && <XCircle className="h-3 w-3" />}
                {connectionStatus?.status === 'auth_error' && <AlertTriangle className="h-3 w-3" />}
                {connectionStatus?.status || 'Unknown'}
              </Badge>
            </div>

            {/* Data Sync Status */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Data Sync:</span>
              <Badge variant={getSyncStatusColor(metrics.syncStatus)} className="flex items-center gap-1">
                {getSyncStatusIcon(metrics.syncStatus)}
                {metrics.syncStatus === 'loading' ? 'Syncing...' : 
                 metrics.syncStatus === 'error' ? 'Failed' : 'Success'}
              </Badge>
            </div>

            {/* Last Update */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Last Update:</span>
              <span className="text-sm font-medium">
                {metrics.lastSyncTime.toLocaleTimeString()}
              </span>
            </div>
          </div>

          {/* Error Message */}
          {metrics.syncStatus === 'error' && metrics.errorMessage && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium text-red-800">Sync Error:</span>
              </div>
              <p className="text-sm text-red-700 mt-1">{metrics.errorMessage}</p>
            </div>
          )}

          {/* Connection Error */}
          {connectionStatus?.errorMessage && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium text-yellow-800">Connection Issue:</span>
              </div>
              <p className="text-sm text-yellow-700 mt-1">{connectionStatus.errorMessage}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Quality */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Data Quality</CardTitle>
          <Database className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {metrics.syncStatus === 'loading' ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              `${Math.round((metrics.total - metrics.errors) / Math.max(metrics.total, 1) * 100)}%`
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {metrics.syncStatus === 'loading' ? 'Syncing...' : 
             metrics.syncStatus === 'error' ? 'Sync Error' : 'Data Integrity'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedKPICardsSection;
