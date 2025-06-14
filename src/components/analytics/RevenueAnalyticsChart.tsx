
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { packageAnalyticsService } from '@/services/analytics/packageAnalyticsService';
import { ChartContainer, ChartLegend, ChartTooltip } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';

const RevenueAnalyticsChart: React.FC = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['packageRevenue'],
    queryFn: packageAnalyticsService.getRevenueByPackage,
  });

  if (isLoading) return <div className="text-center py-8 text-muted-foreground">Loading revenue data...</div>;
  if (error) return <div className="text-red-600">Failed to load revenue data.</div>;
  if (!data?.length) return <div className="text-muted-foreground">No revenue data.</div>;

  return (
    <div>
      <div className="font-medium mb-2">Estimated Monthly Revenue by Package</div>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Bar dataKey="revenue" fill="#6366f1" />
          <ChartTooltip />
          <ChartLegend />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
export default RevenueAnalyticsChart;
