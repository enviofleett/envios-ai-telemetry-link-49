
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { packageAnalyticsService } from '@/services/analytics/packageAnalyticsService';
import { ChartContainer, ChartLegend, ChartTooltip } from '@/components/ui/chart';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const COLORS = ['#38bdf8', '#6366f1', '#f59e42', '#f472b6', '#6ee7b7', '#facc15', '#60a5fa'];

const PackageSubscriptionChart: React.FC = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['packageSubscriptions'],
    queryFn: packageAnalyticsService.getPackageSubscriptionDistribution,
  });

  if (isLoading) return <div className="text-center py-8 text-muted-foreground">Loading distribution...</div>;
  if (error) return <div className="text-red-600">Failed to load subscription data.</div>;
  if (!data?.length) return <div className="text-muted-foreground">No subscription data.</div>;

  return (
    <div>
      <div className="font-medium mb-2">Active Subscriptions by Package</div>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie data={data} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
            {data.map((entry, idx) => (
              <Cell key={entry.id} fill={COLORS[idx % COLORS.length]} />
            ))}
          </Pie>
          <ChartTooltip />
          <ChartLegend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
export default PackageSubscriptionChart;
