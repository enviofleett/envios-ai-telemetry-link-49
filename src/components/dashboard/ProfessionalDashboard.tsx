
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Car, Users, AlertTriangle, TrendingUp } from 'lucide-react';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { useUnifiedData } from '@/hooks/useUnifiedData';
import DataLoadingWrapper from '@/components/common/DataLoadingWrapper';

const ProfessionalDashboard: React.FC = () => {
  const { user } = useUnifiedAuth();
  const { vehicles, loading, error, refreshData, healthStatus } = useUnifiedData();

  // Calculate dashboard metrics
  const totalVehicles = vehicles.length;
  const onlineVehicles = vehicles.filter(v => v.status === 'online').length;
  const offlineVehicles = vehicles.filter(v => v.status === 'offline').length;
  const inactiveVehicles = vehicles.filter(v => v.status === 'inactive').length;

  const dashboardStats = [
    {
      title: "Total Vehicles",
      value: totalVehicles,
      icon: Car,
      description: "All registered vehicles"
    },
    {
      title: "Online",
      value: onlineVehicles,
      icon: TrendingUp,
      description: "Currently active",
      status: "success"
    },
    {
      title: "Offline", 
      value: offlineVehicles,
      icon: AlertTriangle,
      description: "Recently inactive",
      status: "warning"
    },
    {
      title: "Inactive",
      value: inactiveVehicles,
      icon: AlertTriangle,
      description: "Long-term inactive",
      status: "error"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.email || 'User'}
          </p>
        </div>
        <Button onClick={refreshData} variant="outline">
          Refresh Data
        </Button>
      </div>

      <DataLoadingWrapper
        loading={loading}
        error={error}
        healthStatus={healthStatus}
        onRefresh={refreshData}
      >
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {dashboardStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <Icon className={`h-4 w-4 ${
                    stat.status === 'success' ? 'text-green-600' :
                    stat.status === 'warning' ? 'text-yellow-600' :
                    stat.status === 'error' ? 'text-red-600' :
                    'text-muted-foreground'
                  }`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Recent Vehicles */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Vehicles</CardTitle>
            <CardDescription>
              Your most recently updated vehicles
            </CardDescription>
          </CardHeader>
          <CardContent>
            {vehicles.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Car className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No vehicles found</p>
                <p className="text-sm">Add vehicles to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {vehicles.slice(0, 5).map((vehicle) => (
                  <div key={vehicle.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        vehicle.status === 'online' ? 'bg-green-500' :
                        vehicle.status === 'offline' ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`} />
                      <div>
                        <p className="font-medium">{vehicle.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Last update: {vehicle.lastUpdate.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium capitalize">{vehicle.status}</p>
                      {vehicle.location && (
                        <p className="text-xs text-muted-foreground">
                          {vehicle.location.address || 'Location available'}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                {vehicles.length > 5 && (
                  <p className="text-center text-sm text-muted-foreground">
                    And {vehicles.length - 5} more vehicles...
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </DataLoadingWrapper>
    </div>
  );
};

export default ProfessionalDashboard;
