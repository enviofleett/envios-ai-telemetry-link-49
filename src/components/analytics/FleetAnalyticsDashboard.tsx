
import React from 'react';
import { useAnalyticsDashboard } from '@/hooks/useAnalyticsDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Car, Users, Building2, Activity, AlertTriangle } from 'lucide-react';

const FleetAnalyticsDashboard: React.FC = () => {
  const { data, isLoading, error, lastUpdated, refreshData } = useAnalyticsDashboard();

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <AlertTriangle className="h-8 w-8 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Error Loading Analytics</h3>
              <p>{error}</p>
              <Button onClick={refreshData} className="mt-4">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Fleet Analytics</h1>
          <p className="text-muted-foreground">Real-time fleet performance insights</p>
        </div>
        <Button onClick={refreshData} disabled={isLoading} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Main Analytics Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.totalVehicles || 0}</div>
            <p className="text-xs text-muted-foreground">Fleet size</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Vehicles</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{data?.activeVehicles || 0}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{data?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">Registered users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{data?.activeUsers || 0}</div>
            <p className="text-xs text-muted-foreground">Active users</p>
          </CardContent>
        </Card>
      </div>

      {/* Vehicle Status Breakdown */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Vehicle Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Active</span>
                <span className="text-sm font-medium text-green-600">
                  {data?.vehicleStatus?.active || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Inactive</span>
                <span className="text-sm font-medium text-red-600">
                  {data?.vehicleStatus?.inactive || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">GP51 Synced</span>
                <span className="text-sm font-medium text-blue-600">
                  {data?.vehicleStatus?.synced || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Not Synced</span>
                <span className="text-sm font-medium text-gray-600">
                  {data?.vehicleStatus?.unsynced || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">New Users</span>
                <span className="text-sm font-medium">
                  {data?.recentActivity?.newUsers || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">New Vehicles</span>
                <span className="text-sm font-medium">
                  {data?.recentActivity?.newVehicles || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Period</span>
                <span className="text-sm text-muted-foreground">
                  {data?.recentActivity?.period || 'Last 7 days'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* GP51 Status */}
      <Card>
        <CardHeader>
          <CardTitle>GP51 Integration Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {data?.gp51Status?.importedUsers || 0}
              </div>
              <p className="text-sm text-muted-foreground">Imported Users</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {data?.gp51Status?.importedVehicles || 0}
              </div>
              <p className="text-sm text-muted-foreground">Imported Vehicles</p>
            </div>
            <div className="text-center">
              <div className="text-sm">
                <span className="font-medium">Last Sync:</span>
                <br />
                <span className="text-muted-foreground">
                  {data?.gp51Status?.lastSync 
                    ? new Date(data.gp51Status.lastSync).toLocaleString()
                    : 'Never'
                  }
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground">
        Last updated: {lastUpdated.toLocaleString()}
      </div>
    </div>
  );
};

export default FleetAnalyticsDashboard;
