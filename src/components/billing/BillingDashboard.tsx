
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchBillingDashboardStats, BillingDashboardStats } from '@/services/billing/billingStatsService';
import DashboardMetricCard from '@/components/DashboardMetricCard';
import { DollarSign, TrendingUp, CreditCard, AlertCircle } from 'lucide-react';

const BillingDashboard: React.FC = () => {
  const { data: stats, isLoading, error } = useQuery<BillingDashboardStats>({
    queryKey: ['billing-dashboard-stats'],
    queryFn: fetchBillingDashboardStats,
    refetchInterval: 30000
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Billing Dashboard</CardTitle>
          <CardDescription>Unable to load billing data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            Error loading billing dashboard data
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Billing Dashboard</h1>
        <p className="text-muted-foreground">Monitor your revenue and subscription metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardMetricCard
          title="Total Revenue"
          value={`$${stats.total_revenue.toLocaleString()}`}
          change={`+${stats.revenue_growth}% from last month`}
          changeType="positive"
          icon={DollarSign}
          iconColor="text-green-600"
        />
        
        <DashboardMetricCard
          title="Monthly Recurring Revenue"
          value={`$${stats.monthly_recurring_revenue.toLocaleString()}`}
          icon={TrendingUp}
          iconColor="text-blue-600"
        />
        
        <DashboardMetricCard
          title="Active Subscriptions"
          value={stats.active_subscriptions.toString()}
          icon={CreditCard}
          iconColor="text-purple-600"
        />
        
        <DashboardMetricCard
          title="Pending Invoices"
          value={stats.pending_invoices.toString()}
          icon={AlertCircle}
          iconColor="text-orange-600"
        />
      </div>
    </div>
  );
};

export default BillingDashboard;
