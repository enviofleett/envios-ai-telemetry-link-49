
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { AnalyticsData } from './types';

interface PopularActionsChartProps {
  data: AnalyticsData['popularActions'];
}

const PopularActionsChart: React.FC<PopularActionsChartProps> = ({ data }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Popular Map Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="action" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#3B82F6" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default PopularActionsChart;
