
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  TrendingUp, 
  Car, 
  Gauge, 
  AlertTriangle,
  RefreshCw,
  BarChart3,
  MapPin,
  Clock,
  Fuel
} from 'lucide-react';
import { useAdvancedAnalytics } from '@/hooks/useAdvancedAnalytics';
import { realTimeDataProcessor } from '@/services/gp51/RealTimeDataProcessor';

const RealTimeAnalyticsDashboard: React.FC = () => {
  const {
    fleetAnalytics,
    vehiclePerformance,
    trendData,
    isLoading,
    error,
    refreshAnalytics,
    generateReport
  } = useAdvancedAnalytics();

  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMetrics] = useState(realTimeDataProcessor.getMetrics());

  const handleStartProcessing = async () => {
    setIsProcessing(true);
    await realTimeDataProcessor.startProcessing(3000); // Process every 3 seconds
  };

  const handleStopProcessing = () => {
    realTimeDataProcessor.stopProcessing();
    setIsProcessing(false);
  };

  const handleGenerateReport = async () => {
    try {
      const report = await generateReport('last_7_days');
      console.log('Generated report:', report);
      // You could download or display the report here
    } catch (err) {
      console.error('Failed to generate report:', err);
    }
  };

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 mx-auto mb-4 text-red-500" />
            <h3 className="text-lg font-semibold text-red-600 mb-2">Analytics Error</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={refreshAnalytics} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Real-Time Analytics</h2>
          <p className="text-gray-600">Advanced fleet performance insights</p>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={isProcessing ? handleStopProcessing : handleStartProcessing}
            variant={isProcessing ? "destructive" : "default"}
            disabled={isLoading}
          >
            <Activity className="h-4 w-4 mr-2" />
            {isProcessing ? 'Stop Processing' : 'Start Processing'}
          </Button>
          
          <Button onClick={refreshAnalytics} variant="outline" disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button onClick={handleGenerateReport} variant="secondary">
            <BarChart3 className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Processing Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="h-5 w-5" />
            Processing Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <Badge variant={isProcessing ? "default" : "secondary"}>
                {isProcessing ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-600">Processed Records</p>
              <p className="text-2xl font-bold">{processingMetrics.processedCount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Throughput/min</p>
              <p className="text-2xl font-bold">{Math.round(processingMetrics.throughputPerMinute)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Error Rate</p>
              <p className="text-2xl font-bold text-red-500">{processingMetrics.errorCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fleet Overview */}
      {fleetAnalytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Car className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600">Total Vehicles</p>
                  <p className="text-2xl font-bold">{fleetAnalytics.totalVehicles}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Activity className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600">Active Vehicles</p>
                  <p className="text-2xl font-bold text-green-600">{fleetAnalytics.activeVehicles}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <MapPin className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600">Moving</p>
                  <p className="text-2xl font-bold text-blue-600">{fleetAnalytics.movingVehicles}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <TrendingUp className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="text-sm text-gray-600">Performance</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {Math.round(fleetAnalytics.performanceScore)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Performance Metrics */}
      {fleetAnalytics && (
        <Card>
          <CardHeader>
            <CardTitle>Fleet Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Fleet Efficiency</span>
                  <span className="text-sm text-gray-600">
                    {Math.round(fleetAnalytics.performanceScore)}%
                  </span>
                </div>
                <Progress value={fleetAnalytics.performanceScore} className="h-2" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Fuel Efficiency</span>
                  <span className="text-sm text-gray-600">
                    {Math.round(fleetAnalytics.fuelEfficiency)}%
                  </span>
                </div>
                <Progress value={fleetAnalytics.fuelEfficiency} className="h-2" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Utilization Rate</span>
                  <span className="text-sm text-gray-600">
                    {Math.round((fleetAnalytics.activeVehicles / Math.max(fleetAnalytics.totalVehicles, 1)) * 100)}%
                  </span>
                </div>
                <Progress 
                  value={(fleetAnalytics.activeVehicles / Math.max(fleetAnalytics.totalVehicles, 1)) * 100} 
                  className="h-2" 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="flex items-center gap-3">
                <Gauge className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600">Avg Speed</p>
                  <p className="font-semibold">{Math.round(fleetAnalytics.averageSpeed)} km/h</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600">Total Distance</p>
                  <p className="font-semibold">{Math.round(fleetAnalytics.totalDistance)} km</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-sm text-gray-600">Active Alerts</p>
                  <p className="font-semibold">{fleetAnalytics.alertsCount}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vehicle Performance Table */}
      {vehiclePerformance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Individual Vehicle Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Vehicle</th>
                    <th className="text-left p-2">Efficiency</th>
                    <th className="text-left p-2">Utilization</th>
                    <th className="text-left p-2">Distance</th>
                    <th className="text-left p-2">Avg Speed</th>
                    <th className="text-left p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {vehiclePerformance.slice(0, 10).map((vehicle) => (
                    <tr key={vehicle.deviceId} className="border-b">
                      <td className="p-2">
                        <div>
                          <p className="font-medium">{vehicle.deviceName}</p>
                          <p className="text-xs text-gray-500">{vehicle.deviceId}</p>
                        </div>
                      </td>
                      <td className="p-2">
                        <Badge 
                          variant={vehicle.efficiency > 80 ? "default" : vehicle.efficiency > 60 ? "secondary" : "destructive"}
                        >
                          {Math.round(vehicle.efficiency)}%
                        </Badge>
                      </td>
                      <td className="p-2">{Math.round(vehicle.utilizationRate)}%</td>
                      <td className="p-2">{Math.round(vehicle.totalDistance)} km</td>
                      <td className="p-2">{Math.round(vehicle.averageSpeed)} km/h</td>
                      <td className="p-2">
                        <Badge variant={vehicle.alertsCount === 0 ? "default" : "destructive"}>
                          {vehicle.alertsCount === 0 ? 'Good' : `${vehicle.alertsCount} alerts`}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RealTimeAnalyticsDashboard;
