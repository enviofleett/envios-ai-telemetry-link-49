
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { referralApi } from '@/services/referral';
import { Loader2, AlertTriangle, DollarSign, Users, TrendingUp } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import ConversionFunnelChart from '@/components/packages/referral/agent/ConversionFunnelChart';
import TopAgentsTable from '@/components/admin/analytics/TopAgentsTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

const ReferralAnalyticsTab: React.FC = () => {
  const { data: analytics, isLoading, isError, error } = useQuery({
    queryKey: ['system-referral-analytics'],
    queryFn: referralApi.getSystemReferralAnalytics,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8 h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error Loading Analytics</AlertTitle>
        <AlertDescription>{(error as Error)?.message || 'An unknown error occurred.'}</AlertDescription>
      </Alert>
    );
  }
  
  if (!analytics) {
    return (
      <div className="text-center py-10">
        <TrendingUp className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No analytics data yet</h3>
        <p className="mt-1 text-sm text-gray-500">
          Referral program data will appear here once available.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{analytics.total_referrals.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">Latest snapshot of referred users</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Sign-ups</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{analytics.total_signups.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">Latest snapshot of signed up users</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Conversions</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{analytics.total_conversions.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">Latest snapshot of converted users</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Commission</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(analytics.total_commission)}</div>
                    <p className="text-xs text-muted-foreground">All-time commission generated</p>
                </CardContent>
            </Card>
        </div>
        <ConversionFunnelChart
            referrals={analytics.total_referrals}
            signups={analytics.total_signups}
            conversions={analytics.total_conversions}
        />
        <TopAgentsTable agents={analytics.top_agents} />
    </div>
  );
};

export default ReferralAnalyticsTab;
