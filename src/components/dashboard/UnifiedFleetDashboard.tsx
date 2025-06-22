
import React from 'react';
import { useUnifiedVehicleData } from '@/hooks/useUnifiedVehicleData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, AlertTriangle, Car, Navigation, Clock, MapPin } from 'lucide-react';

export function UnifiedFleetDashboard() {
  const { 
    vehicles, 
    metrics, 
    isLoading, 
    isRefreshing, 
    error, 
    forceRefresh 
  } = useUnifiedVehicleData();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        <span>Loading fleet dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">Error: {error.message}</p>
          <Button onClick={forceRefresh} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Fleet Dashboard</h1>
          <p className="text-muted-foreground">Real-time fleet monitoring and management</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-green-50 text-green-700">
            <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
            Live
          </Badge>
          <Button onClick={forceRefresh} disabled={isRefreshing} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Fleet Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.total || 0}</div>
            <p className="text-xs text-muted-foreground">Fleet size</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online</CardTitle>
            <Navigation className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics?.online || 0}</div>
            <p className="text-xs text-muted-foreground">Active vehicles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Idle</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{metrics?.idle || 0}</div>
            <p className="text-xs text-muted-foreground">Stationary vehicles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics?.alerts || 0}</div>
            <p className="text-xs text-muted-foreground">Active alerts</p>
          </CardContent>
        </Card>
      </div>

      {/* Fleet Map */}
      <Card>
        <CardHeader>
          <CardTitle>Live Fleet Map</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <MapPin className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600">Fleet map will be displayed here</p>
              <p className="text-sm text-gray-500">
                Real-time tracking of {vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fleet Status Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Fleet Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Total Vehicles:</span>
              <span className="text-sm">{vehicles.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Last Update:</span>
              <span className="text-sm">{metrics?.lastSyncTime ? new Date(metrics.lastSyncTime).toLocaleTimeString() : 'Never'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Sync Status:</span>
              <Badge variant={metrics?.syncStatus === 'success' ? 'default' : 'destructive'}>
                {metrics?.syncStatus || 'idle'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
