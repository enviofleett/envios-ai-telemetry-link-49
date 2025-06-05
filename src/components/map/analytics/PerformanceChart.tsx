
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { AnalyticsData } from './types';

interface PerformanceChartProps {
  data: AnalyticsData['performanceMetrics'];
}

const PerformanceChart: React.FC<PerformanceChartProps> = ({ data }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="loadTime" stroke="#10B981" name="Load Time (ms)" />
            <Line type="monotone" dataKey="renderTime" stroke="#F59E0B" name="Render Time (ms)" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default PerformanceChart;
