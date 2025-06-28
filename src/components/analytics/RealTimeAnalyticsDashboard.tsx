
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAdvancedAnalytics } from '@/hooks/useAdvancedAnalytics';
import { realTimeDataProcessor } from '@/services/gp51/RealTimeDataProcessor';
import { Activity, TrendingUp, Users, Zap, Play, Square, RefreshCw } from 'lucide-react';

const RealTimeAnalyticsDashboard: React.FC = () => {
  const { 
    data: { fleetAnalytics, vehiclePerformance, trendData },
    isLoading,
    error,
    refreshAnalytics,
    generateReport
  } = useAdvancedAnalytics();

  const [processingActive, setProcessingActive] = useState(false);
  const [processingMetrics, setProcessingMetrics] = useState(realTimeDataProcessor.getMetrics());

  const handleStartProcessing = () => {
    realTimeDataProcessor.startProcessing();
    setProcessingActive(true);
  };

  const handleStopProcessing = () => {
    realTimeDataProcessor.stopProcessing();
    setProcessingActive(false);
  };

  // Update metrics every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setProcessingMetrics(realTimeDataProcessor.getMetrics());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
          <span className="ml-2 text-lg">Loading analytics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p>Error loading analytics: {error}</p>
              <Button onClick={refreshAnalytics} className="mt-4">
                Try Again
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
        <h1 className="text-3xl font-bold">Real-Time Analytics Dashboard</h1>
        <div className="flex gap-2">
          <Button 
            onClick={refreshAnalytics}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button 
            onClick={generateReport}
            variant="outline"
            size="sm"
          >
            Generate Report
          </Button>
        </div>
      </div>

      {/* Processing Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Real-Time Processing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge variant={processingActive ? "default" : "secondary"}>
                {processingActive ? "Active" : "Inactive"}
              </Badge>
              <div className="flex gap-2">
                <Button 
                  onClick={handleStartProcessing}
                  disabled={processingActive}
                  size="sm"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start
                </Button>
                <Button 
                  onClick={handleStopProcessing}
                  disabled={!processingActive}
                  variant="outline"
                  size="sm"
                >
                  <Square className="h-4 w-4 mr-2" />
                  Stop
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Processed: </span>
                <span className="font-semibold">{processingMetrics.processedCount}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Throughput: </span>
                <span className="font-semibold">{processingMetrics.throughputPerMinute}/min</span>
              </div>
              <div>
                <span className="text-muted-foreground">Errors: </span>
                <span className="font-semibold text-red-600">{processingMetrics.errorCount}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fleet Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fleetAnalytics.totalVehicles}</div>
            <p className="text-xs text-muted-foreground">
              {fleetAnalytics.activeVehicles} active, {fleetAnalytics.inactiveVehicles} inactive
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Speed</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fleetAnalytics.averageSpeed} km/h</div>
            <p className="text-xs text-muted-foreground">Fleet average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance Score</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(vehiclePerformance.averagePerformance)}%
            </div>
            <p className="text-xs text-muted-foreground">Fleet average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Now</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {fleetAnalytics.activeVehicles}
            </div>
            <p className="text-xs text-muted-foreground">Currently online</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Vehicles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {vehiclePerformance.topPerformers.slice(0, 5).map((vehicle, index) => (
              <div key={vehicle.deviceId} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full text-sm font-semibold">
                    #{index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{vehicle.deviceName}</p>
                    <p className="text-sm text-muted-foreground">{vehicle.deviceId}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{Math.round(vehicle.score)}%</p>
                  <p className="text-sm text-muted-foreground">
                    {vehicle.metrics.alerts} alerts
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Trend Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Daily Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {trendData.daily.slice(0, 5).map((day, index) => (
                <div key={index} className="flex justify-between items-center p-2 hover:bg-muted/50 rounded">
                  <span className="text-sm">{day.date}</span>
                  <div className="text-right">
                    <div className="text-sm font-medium">{day.activeVehicles} vehicles</div>
                    <div className="text-xs text-muted-foreground">{day.alerts} alerts</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Weekly Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {trendData.weekly.map((week, index) => (
                <div key={index} className="flex justify-between items-center p-2 hover:bg-muted/50 rounded">
                  <span className="text-sm">{week.week}</span>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {Math.round(week.metrics.utilization)}% utilization
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {week.metrics.incidents} incidents
                    </div>
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

export default RealTimeAnalyticsDashboard;
