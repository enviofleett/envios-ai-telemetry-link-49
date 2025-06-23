
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { MonthlyGrowthData } from '@/services/analyticsService';

interface GrowthTrendsChartProps {
  data: MonthlyGrowthData[];
  isLoading?: boolean;
}

const GrowthTrendsChart: React.FC<GrowthTrendsChartProps> = ({ data, isLoading = false }) => {
  // Transform data for better display
  const chartData = data.map(item => ({
    month: new Date(item.month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    Vehicles: item.vehicles,
    Users: item.users,
    Workshops: item.workshops,
    'Marketplace Merchants': item.marketplaceMerchants,
    'Referral Agents': item.referralAgents
  }));

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-white to-gray-50">
        <CardHeader>
          <CardTitle>Monthly Growth Trends</CardTitle>
          <CardDescription>Track growth across all key metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data.length) {
    return (
      <Card className="bg-gradient-to-br from-white to-gray-50">
        <CardHeader>
          <CardTitle>Monthly Growth Trends</CardTitle>
          <CardDescription>Track growth across all key metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center text-gray-500">
            No data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-white to-gray-50">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-gray-900">Monthly Growth Trends</CardTitle>
        <CardDescription className="text-gray-600">
          Track growth across all key metrics over the past 6 months
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="month" 
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend />
              <Bar dataKey="Vehicles" fill="#3b82f6" radius={[2, 2, 0, 0]} />
              <Bar dataKey="Users" fill="#10b981" radius={[2, 2, 0, 0]} />
              <Bar dataKey="Workshops" fill="#f59e0b" radius={[2, 2, 0, 0]} />
              <Bar dataKey="Marketplace Merchants" fill="#8b5cf6" radius={[2, 2, 0, 0]} />
              <Bar dataKey="Referral Agents" fill="#ef4444" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default GrowthTrendsChart;
