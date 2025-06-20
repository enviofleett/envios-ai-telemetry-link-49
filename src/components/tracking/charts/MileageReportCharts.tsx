
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';

interface MileageReportChartsProps {
  data: {
    totalMileage: number;
    averageMileage: number;
    mileageByVehicle: { vehicle: string; mileage: number; efficiency: number }[];
    mileageTrends: { date: string; mileage: number; fuelUsed: number }[];
    monthlyMileage: { month: string; mileage: number }[];
  };
}

const MileageReportCharts: React.FC<MileageReportChartsProps> = ({ data }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Mileage by Vehicle */}
      <Card>
        <CardHeader>
          <CardTitle>Mileage by Vehicle</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.mileageByVehicle.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="vehicle" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value} km`, 'Mileage']} />
              <Bar dataKey="mileage" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Fuel Efficiency by Vehicle */}
      <Card>
        <CardHeader>
          <CardTitle>Fuel Efficiency by Vehicle</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.mileageByVehicle.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="vehicle" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value} MPG`, 'Efficiency']} />
              <Bar dataKey="efficiency" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Daily Mileage Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Mileage Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.mileageTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="mileage" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Monthly Mileage Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Mileage Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.monthlyMileage}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value} km`, 'Monthly Mileage']} />
              <Line type="monotone" dataKey="mileage" stroke="#10b981" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default MileageReportCharts;
