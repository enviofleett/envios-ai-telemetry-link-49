
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { TripReportData } from '@/hooks/useAdvancedReports';

interface TripReportChartsProps {
  data: TripReportData[];
  isLoading: boolean;
}

const TripReportCharts: React.FC<TripReportChartsProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-64 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  const chartData = data.map(trip => ({
    vehicleName: trip.vehicleName,
    distance: typeof trip.distance === 'string' ? parseFloat(trip.distance) || 0 : trip.distance,
    duration: trip.duration,
    fuel: typeof trip.fuelConsumption === 'string' 
      ? parseFloat(trip.fuelConsumption.replace(' L', '')) || 0 
      : 0
  }));

  return (
    <div className="space-y-4 mb-6">
      <Card>
        <CardHeader>
          <CardTitle>Trip Distance Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="vehicleName" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="distance" fill="#3b82f6" name="Distance (km)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default TripReportCharts;
