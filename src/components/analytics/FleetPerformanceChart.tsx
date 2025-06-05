
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { VehicleAnalytics } from '@/hooks/useFleetAnalytics';

interface FleetPerformanceChartProps {
  vehicleAnalytics: VehicleAnalytics[];
  isLoading?: boolean;
}

const FleetPerformanceChart: React.FC<FleetPerformanceChartProps> = ({ vehicleAnalytics, isLoading }) => {
  // Generate sample time-series data for demonstration
  const timeSeriesData = useMemo(() => {
    const days = 7;
    const data = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        utilization: Math.random() * 20 + 75, // 75-95%
        fuelEfficiency: Math.random() * 2 + 8, // 8-10 km/l
        averageSpeed: Math.random() * 10 + 45, // 45-55 km/h
        alerts: Math.floor(Math.random() * 5) + 1 // 1-5 alerts
      });
    }
    
    return data;
  }, []);

  // Top performing vehicles data
  const topVehicles = useMemo(() => {
    return vehicleAnalytics
      .sort((a, b) => b.utilizationRate - a.utilizationRate)
      .slice(0, 5)
      .map(vehicle => ({
        name: vehicle.deviceName.length > 15 
          ? `${vehicle.deviceName.substring(0, 15)}...` 
          : vehicle.deviceName,
        utilization: vehicle.utilizationRate,
        efficiency: vehicle.fuelEfficiency,
        score: vehicle.driverScore
      }));
  }, [vehicleAnalytics]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-4 bg-gray-200 rounded mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </CardContent>
        </Card>
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-4 bg-gray-200 rounded mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Fleet Performance Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Fleet Performance Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip 
                formatter={(value: any, name: string) => {
                  switch (name) {
                    case 'utilization':
                      return [`${value.toFixed(1)}%`, 'Utilization'];
                    case 'fuelEfficiency':
                      return [`${value.toFixed(1)} km/l`, 'Fuel Efficiency'];
                    case 'averageSpeed':
                      return [`${value.toFixed(1)} km/h`, 'Average Speed'];
                    case 'alerts':
                      return [Math.round(value), 'Alerts'];
                    default:
                      return [value, name];
                  }
                }}
              />
              <Line 
                type="monotone" 
                dataKey="utilization" 
                stroke="#3B82F6" 
                strokeWidth={2}
                name="utilization"
              />
              <Line 
                type="monotone" 
                dataKey="fuelEfficiency" 
                stroke="#10B981" 
                strokeWidth={2}
                name="fuelEfficiency"
              />
              <Line 
                type="monotone" 
                dataKey="averageSpeed" 
                stroke="#F59E0B" 
                strokeWidth={2}
                name="averageSpeed"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Performing Vehicles */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Top Performing Vehicles</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topVehicles} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} />
              <YAxis dataKey="name" type="category" width={80} />
              <Tooltip 
                formatter={(value: any, name: string) => {
                  switch (name) {
                    case 'utilization':
                      return [`${value.toFixed(1)}%`, 'Utilization'];
                    case 'efficiency':
                      return [`${value.toFixed(1)} km/l`, 'Fuel Efficiency'];
                    case 'score':
                      return [`${value.toFixed(1)}%`, 'Driver Score'];
                    default:
                      return [value, name];
                  }
                }}
              />
              <Bar 
                dataKey="utilization" 
                fill="#3B82F6" 
                name="utilization"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default FleetPerformanceChart;
