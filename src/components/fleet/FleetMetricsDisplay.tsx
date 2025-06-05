
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Car, Activity, AlertTriangle, Clock } from 'lucide-react';
import type { VehicleMetrics } from '@/services/unifiedVehicleData';
import type { SyncMetrics } from '@/services/vehiclePosition/types';

interface FleetMetricsDisplayProps {
  metrics: VehicleMetrics;
  syncMetrics: SyncMetrics;
  isLoading: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
}

const FleetMetricsDisplay: React.FC<FleetMetricsDisplayProps> = ({
  metrics,
  syncMetrics,
  isLoading,
  isRefreshing,
  onRefresh
}) => {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Fleet Metrics</h2>
        <Button
          variant="outline"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total}</div>
            <p className="text-xs text-muted-foreground">
              Active fleet size
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online Vehicles</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.online}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.total > 0 ? ((metrics.online / metrics.total) * 100).toFixed(1) : 0}% of fleet
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Offline Vehicles</CardTitle>
            <Activity className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{metrics.offline}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.total > 0 ? ((metrics.offline / metrics.total) * 100).toFixed(1) : 0}% of fleet
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics.alerts}</div>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Sync Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="font-medium text-gray-600">Last Update</div>
              <div>{metrics.lastUpdateTime.toLocaleString()}</div>
            </div>
            <div>
              <div className="font-medium text-gray-600">Positions Updated</div>
              <div>{syncMetrics.positionsUpdated} / {syncMetrics.totalVehicles}</div>
            </div>
            <div>
              <div className="font-medium text-gray-600">Sync Errors</div>
              <div className={syncMetrics.errors > 0 ? 'text-red-600' : 'text-green-600'}>
                {syncMetrics.errors} errors
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FleetMetricsDisplay;
