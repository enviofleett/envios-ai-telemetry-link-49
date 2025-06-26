
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAnalyticsDashboard } from '@/hooks/useAnalyticsDashboard';
import DashboardRefreshButton from '@/components/dashboard/DashboardRefreshButton';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, Car, Activity, Sync, AlertTriangle, Database, CheckCircle } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const FleetAnalyticsDashboard: React.FC = () => {
  const { data, isLoading, error, lastUpdated, refreshData } = useAnalyticsDashboard();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load analytics data: {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (!data) {
    return (
      <Alert>
        <Database className="h-4 w-4" />
        <AlertDescription>
          No analytics data available. Please check your database connection.
        </AlertDescription>
      </Alert>
    );
  }

  // Prepare pie chart data for vehicle status
  const vehicleStatusData = [
    { name: 'Active', value: data.vehicleStatus.active, color: '#00C49F' },
    { name: 'Inactive', value: data.vehicleStatus.inactive, color: '#FF8042' },
    { name: 'Synced', value: data.vehicleStatus.synced, color: '#0088FE' },
    { name: 'Unsynced', value: data.vehicleStatus.unsynced, color: '#FFBB28' }
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Fleet Analytics Dashboard</h2>
          <p className="text-gray-600">Real-time analytics from your database</p>
        </div>
        <DashboardRefreshButton 
          onRefresh={refreshData}
          isLoading={isLoading}
          lastUpdated={lastUpdated}
        />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{data.totalUsers}</p>
                <p className="text-xs text-green-600">{data.activeUsers} active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Car className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Vehicles</p>
                <p className="text-2xl font-bold text-gray-900">{data.totalVehicles}</p>
                <p className="text-xs text-green-600">{data.activeVehicles} active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Recent Activity</p>
                <p className="text-2xl font-bold text-gray-900">{data.recentActivity.newUsers + data.recentActivity.newVehicles}</p>
                <p className="text-xs text-gray-500">{data.recentActivity.period}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Sync className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">GP51 Synced</p>
                <p className="text-2xl font-bold text-gray-900">{data.gp51Status.importedVehicles}</p>
                <p className="text-xs text-gray-500">
                  {data.gp51Status.lastSync ? 
                    `Last: ${new Date(data.gp51Status.lastSync).toLocaleDateString()}` : 
                    'Never synced'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Status Alert */}
      {data.totalUsers === 0 && data.totalVehicles === 0 ? (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong>No Data Found:</strong> Your database appears to be empty. 
            Use the GP51 Import feature in Settings to populate your system with vehicle and user data.
          </AlertDescription>
        </Alert>
      ) : data.gp51Status.importedVehicles === 0 ? (
        <Alert className="border-blue-200 bg-blue-50">
          <AlertTriangle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>GP51 Not Synced:</strong> You have {data.totalVehicles} vehicles but none are synced with GP51. 
            Consider running a GP51 import to sync your data.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>System Active:</strong> Your system has {data.totalUsers} users and {data.totalVehicles} vehicles, 
            with {data.gp51Status.importedVehicles} vehicles synced from GP51.
          </AlertDescription>
        </Alert>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Growth Trend (30 Days)</CardTitle>
            <CardDescription>Users and vehicles over time</CardDescription>
          </CardHeader>
          <CardContent>
            {data.userGrowth.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.userGrowth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{fontSize: 12}}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis tick={{fontSize: 12}} />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <Line type="monotone" dataKey="users" stroke="#0088FE" strokeWidth={2} name="Users" />
                  <Line type="monotone" dataKey="vehicles" stroke="#00C49F" strokeWidth={2} name="Vehicles" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                No growth data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Vehicle Status Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Vehicle Status Distribution</CardTitle>
            <CardDescription>Breakdown by status and sync state</CardDescription>
          </CardHeader>
          <CardContent>
            {vehicleStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={vehicleStatusData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {vehicleStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                No vehicle data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>User Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span>Total Users:</span>
              <Badge variant="outline">{data.totalUsers}</Badge>
            </div>
            <div className="flex justify-between">
              <span>Active Users:</span>
              <Badge variant="default">{data.activeUsers}</Badge>
            </div>
            <div className="flex justify-between">
              <span>GP51 Imported:</span>
              <Badge variant="secondary">{data.gp51Status.importedUsers}</Badge>
            </div>
            <div className="flex justify-between">
              <span>New This Week:</span>
              <Badge variant="outline">{data.recentActivity.newUsers}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vehicle Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span>Total Vehicles:</span>
              <Badge variant="outline">{data.totalVehicles}</Badge>
            </div>
            <div className="flex justify-between">
              <span>Active:</span>
              <Badge variant="default">{data.vehicleStatus.active}</Badge>
            </div>
            <div className="flex justify-between">
              <span>GP51 Synced:</span>
              <Badge variant="secondary">{data.vehicleStatus.synced}</Badge>
            </div>
            <div className="flex justify-between">
              <span>New This Week:</span>
              <Badge variant="outline">{data.recentActivity.newVehicles}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FleetAnalyticsDashboard;
