
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import type { VehicleAnalytics } from '@/services/analytics/analyticsService';

interface FleetPerformanceChartProps {
  vehicleAnalytics: VehicleAnalytics[];
  isLoading: boolean;
}

const FleetPerformanceChart: React.FC<FleetPerformanceChartProps> = ({ vehicleAnalytics, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-64 bg-gray-200 rounded"></div>
          </CardContent>
        </Card>
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-64 bg-gray-200 rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Generate performance trend data
  const performanceTrendData = [
    { month: 'Jan', utilization: 78, efficiency: 85, performance: 82 },
    { month: 'Feb', utilization: 82, efficiency: 87, performance: 85 },
    { month: 'Mar', utilization: 79, efficiency: 89, performance: 84 },
    { month: 'Apr', utilization: 85, efficiency: 91, performance: 88 },
    { month: 'May', utilization: 88, efficiency: 93, performance: 90 },
    { month: 'Jun', utilization: 90, efficiency: 95, performance: 92 }
  ];

  // Top performing vehicles data
  const topVehiclesData = vehicleAnalytics
    .sort((a, b) => b.performanceRating - a.performanceRating)
    .slice(0, 10)
    .map(vehicle => ({
      name: vehicle.deviceName,
      performance: vehicle.performanceRating,
      utilization: vehicle.utilizationRate * 100,
      efficiency: vehicle.fuelEfficiency
    }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Fleet Performance Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="utilization" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  name="Utilization %"
                />
                <Line 
                  type="monotone" 
                  dataKey="efficiency" 
                  stroke="#82ca9d" 
                  strokeWidth={2}
                  name="Fuel Efficiency"
                />
                <Line 
                  type="monotone" 
                  dataKey="performance" 
                  stroke="#ffc658" 
                  strokeWidth={2}
                  name="Performance Score"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top Performing Vehicles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topVehiclesData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} />
                <Tooltip />
                <Bar 
                  dataKey="performance" 
                  fill="#8884d8" 
                  name="Performance Score"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FleetPerformanceChart;
