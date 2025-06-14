
import React from 'react';
import { useMarketAnalytics } from '@/hooks/useMarketAnalytics';
import { AnalyticsMetricCard } from '@/components/admin/analytics/AnalyticsMetricCard';
import { SalesByCategoryChart } from '@/components/admin/analytics/SalesByCategoryChart';
import { SalesByMerchantChart } from '@/components/admin/analytics/SalesByMerchantChart';
import { DollarSign, ShoppingCart, BarChart } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

const MarketplaceAnalyticsTab: React.FC = () => {
  const { data, isLoading, isError, error } = useMarketAnalytics();

  const formatCurrency = (value: number | undefined) => {
    if (typeof value !== 'number') return '$0.00';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };
  
  if (isError) {
    return (
        <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
                Failed to load analytics data: {error.message}. Please ensure there are products and merchants in the database to analyze.
            </AlertDescription>
        </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Platform Intelligence Dashboard</CardTitle>
          <CardDescription>
            High-level overview of marketplace performance and trends.
          </CardDescription>
        </CardHeader>
      </Card>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <AnalyticsMetricCard
          title="Total Sales"
          value={formatCurrency(data?.total_sales)}
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
          isLoading={isLoading}
        />
        <AnalyticsMetricCard
          title="Total Orders"
          value={data?.total_orders?.toLocaleString() ?? '0'}
          icon={<ShoppingCart className="h-4 w-4 text-muted-foreground" />}
          isLoading={isLoading}
        />
        <AnalyticsMetricCard
          title="Average Order Value"
          value={formatCurrency(data?.average_order_value)}
          icon={<BarChart className="h-4 w-4 text-muted-foreground" />}
          isLoading={isLoading}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
        <SalesByCategoryChart data={data?.sales_by_category} isLoading={isLoading} />
        <SalesByMerchantChart data={data?.sales_by_merchant} isLoading={isLoading} />
      </div>
    </div>
  );
};

export default MarketplaceAnalyticsTab;
