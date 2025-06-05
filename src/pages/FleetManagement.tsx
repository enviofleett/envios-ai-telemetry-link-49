
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFleetAnalytics } from '@/hooks/useFleetAnalytics';
import FleetMetricsCards from '@/components/analytics/FleetMetricsCards';
import FleetPerformanceChart from '@/components/analytics/FleetPerformanceChart';
import VehiclePositionMonitor from '@/components/fleet/VehiclePositionMonitor';
import { 
  Car, 
  BarChart3, 
  MapPin, 
  Calendar,
  Filter,
  Activity
} from 'lucide-react';

const FleetManagement: React.FC = () => {
  const { fleetMetrics, vehicleAnalytics, isLoading, dateRange, setDateRange } = useFleetAnalytics();
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Fleet Management</h1>
        <p className="text-gray-600 mt-2">
          Comprehensive fleet overview, analytics, and real-time position monitoring
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Fleet Overview</TabsTrigger>
          <TabsTrigger value="positions">Live Positions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics & Insights</TabsTrigger>
          <TabsTrigger value="performance">Performance Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <FleetMetricsCards metrics={fleetMetrics} isLoading={isLoading} />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  Fleet Status Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Online Vehicles</span>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="font-medium">{fleetMetrics.onlineVehicles}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Offline Vehicles</span>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                      <span className="font-medium">{fleetMetrics.totalVehicles - fleetMetrics.onlineVehicles}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Maintenance Alerts</span>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="font-medium">{fleetMetrics.maintenanceAlerts}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Fleet Utilization</span>
                    <span className="font-medium">{fleetMetrics.utilizationRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Average Speed</span>
                    <span className="font-medium">{fleetMetrics.averageSpeed.toFixed(1)} km/h</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Fuel Efficiency</span>
                    <span className="font-medium">{fleetMetrics.fuelEfficiency.toFixed(1)} km/l</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Cost per Mile</span>
                    <span className="font-medium">${fleetMetrics.costPerMile.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="positions" className="space-y-6">
          <VehiclePositionMonitor />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <FleetPerformanceChart vehicleAnalytics={vehicleAnalytics} isLoading={isLoading} />
          
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Analytics Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600 mb-4">
                Showing data for {vehicleAnalytics.length} vehicles
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {vehicleAnalytics.length > 0 
                      ? (vehicleAnalytics.reduce((sum, v) => sum + v.utilizationRate, 0) / vehicleAnalytics.length).toFixed(1)
                      : 0}%
                  </div>
                  <div className="text-xs text-gray-600">Avg Utilization</div>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {vehicleAnalytics.length > 0 
                      ? (vehicleAnalytics.reduce((sum, v) => sum + v.fuelEfficiency, 0) / vehicleAnalytics.length).toFixed(1)
                      : 0} km/l
                  </div>
                  <div className="text-xs text-gray-600">Avg Fuel Efficiency</div>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {vehicleAnalytics.length > 0 
                      ? (vehicleAnalytics.reduce((sum, v) => sum + v.driverScore, 0) / vehicleAnalytics.length).toFixed(1)
                      : 0}%
                  </div>
                  <div className="text-xs text-gray-600">Avg Driver Score</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Individual Vehicle Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {vehicleAnalytics.slice(0, 10).map((vehicle, index) => (
                  <div key={vehicle.deviceId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{vehicle.deviceName}</div>
                      <div className="text-sm text-gray-600">ID: {vehicle.deviceId}</div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-medium">{vehicle.utilizationRate.toFixed(1)}%</div>
                        <div className="text-xs text-gray-600">Utilization</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">{vehicle.fuelEfficiency.toFixed(1)} km/l</div>
                        <div className="text-xs text-gray-600">Fuel Efficiency</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">{vehicle.driverScore.toFixed(1)}%</div>
                        <div className="text-xs text-gray-600">Driver Score</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FleetManagement;
