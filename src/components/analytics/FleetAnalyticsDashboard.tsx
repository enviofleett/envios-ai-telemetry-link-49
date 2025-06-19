
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Car, 
  TrendingUp, 
  AlertTriangle,
  DollarSign,
  Activity
} from 'lucide-react';
import { useFleetAnalytics } from '@/hooks/useUserAnalytics';

const FleetAnalyticsDashboard: React.FC = () => {
  const { data: analytics, isLoading, error } = useFleetAnalytics();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 h-32 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Unable to Load Fleet Analytics</h3>
        <p className="text-gray-600">Please try again later</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Fleet Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold">{analytics.totalUsers}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Fleet Size</p>
                <p className="text-2xl font-bold">{analytics.totalVehicles}</p>
              </div>
              <Car className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Fleet Efficiency</p>
                <p className="text-2xl font-bold">{analytics.fleetEfficiency}%</p>
              </div>
              <Activity className="h-8 w-8 text-purple-600" />
            </div>
            <div className="mt-2">
              <Progress value={analytics.fleetEfficiency} className="h-1" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Mileage</p>
                <p className="text-2xl font-bold">{analytics.totalMileage.toLocaleString()}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
            <div className="mt-2">
              <p className="text-xs text-gray-500">km driven</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.topPerformers.map((user, index) => (
              <div key={user.userId} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                  </div>
                  <div>
                    <h4 className="font-medium">{user.userName}</h4>
                    <p className="text-sm text-gray-500">{user.totalVehicles} vehicles</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Score: {user.performanceScore}</Badge>
                    <Badge variant="secondary">{user.totalMileage.toLocaleString()} km</Badge>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {Math.round(user.utilizationRate * 100)}% utilization
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Trends and Costs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alert Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Alert Trends (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.alertTrends.map((trend) => (
                <div key={trend.date} className="flex items-center justify-between">
                  <span className="text-sm">{new Date(trend.date).toLocaleDateString()}</span>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={trend.severity === 'high' ? 'destructive' : 
                              trend.severity === 'medium' ? 'secondary' : 'outline'}
                    >
                      {trend.count} alerts
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Maintenance Costs */}
        <Card>
          <CardHeader>
            <CardTitle>Maintenance Costs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.maintenanceCosts.map((cost) => (
                <div key={cost.month} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{cost.month}</span>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="text-sm">${cost.cost.toLocaleString()}</span>
                    <Badge variant="outline" className="text-xs">
                      {cost.vehicleCount} vehicles
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FleetAnalyticsDashboard;
