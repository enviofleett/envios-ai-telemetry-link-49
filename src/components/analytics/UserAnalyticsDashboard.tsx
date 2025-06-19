
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Car, 
  Gauge, 
  Fuel, 
  Clock,
  AlertTriangle,
  Activity
} from 'lucide-react';
import { useUserAnalytics } from '@/hooks/useUserAnalytics';
import { useAuth } from '@/contexts/AuthContext';

const UserAnalyticsDashboard: React.FC = () => {
  const { user } = useAuth();
  const { data: analytics, isLoading, error } = useUserAnalytics(user?.id || '');

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
        <h3 className="text-lg font-semibold mb-2">Unable to Load Analytics</h3>
        <p className="text-gray-600">Please try again later</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Vehicles</p>
                <p className="text-2xl font-bold">{analytics.totalVehicles}</p>
              </div>
              <Car className="h-8 w-8 text-blue-600" />
            </div>
            <div className="mt-2">
              <Badge variant="outline">
                {analytics.activeVehicles} active
              </Badge>
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
              <Gauge className="h-8 w-8 text-green-600" />
            </div>
            <div className="mt-2">
              <p className="text-xs text-gray-500">km driven</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Fuel Efficiency</p>
                <p className="text-2xl font-bold">{analytics.fuelEfficiency}%</p>
              </div>
              <Fuel className="h-8 w-8 text-orange-600" />
            </div>
            <div className="mt-2">
              <Progress value={analytics.fuelEfficiency} className="h-1" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Performance Score</p>
                <p className="text-2xl font-bold">{analytics.performanceScore}</p>
              </div>
              <Activity className="h-8 w-8 text-purple-600" />
            </div>
            <div className="mt-2">
              {analytics.performanceScore >= 85 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.monthlyTrends.map((trend, index) => (
                <div key={trend.month} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{trend.month}</span>
                  <div className="flex items-center gap-4 text-sm">
                    <span>{trend.mileage.toLocaleString()} km</span>
                    <span>{trend.fuelUsed}L fuel</span>
                    <span>{trend.tripCount} trips</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Vehicle Usage */}
        <Card>
          <CardHeader>
            <CardTitle>Vehicle Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.vehicleUsage.map((vehicle) => (
                <div key={vehicle.vehicleId} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{vehicle.vehicleName}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {vehicle.mileage.toLocaleString()} km
                      </Badge>
                      {vehicle.alerts > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {vehicle.alerts} alerts
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Progress value={vehicle.usage * 100} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{analytics.drivingHours}</p>
              <p className="text-sm text-gray-600">Driving Hours</p>
            </div>
            <div className="text-center">
              <Gauge className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{analytics.averageSpeed}</p>
              <p className="text-sm text-gray-600">Avg Speed (km/h)</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-purple-600">
                    {Math.round(analytics.utilizationRate * 100)}%
                  </span>
                </div>
              </div>
              <p className="text-2xl font-bold">{Math.round(analytics.utilizationRate * 100)}%</p>
              <p className="text-sm text-gray-600">Utilization Rate</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserAnalyticsDashboard;
