
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Users,
  Star,
  Download,
  ShoppingCart,
  Target,
} from 'lucide-react';
import { useMarketplaceProducts } from '@/hooks/useMarketplaceProducts';

interface AnalyticsData {
  revenue: {
    current: number;
    previous: number;
    growth: number;
  };
  orders: {
    current: number;
    previous: number;
    growth: number;
  };
  products: {
    total: number;
    active: number;
    topPerforming: string;
  };
  customers: {
    total: number;
    returning: number;
    newCustomers: number;
  };
  conversion: {
    rate: number;
    previous: number;
    growth: number;
  };
}

interface ProductPerformance {
  id: string;
  name: string;
  category: string;
  sales: number;
  revenue: number;
  views: number;
  conversionRate: number;
  rating: number;
  trend: 'up' | 'down' | 'stable';
}

interface MonthlyData {
  month: string;
  revenue: number;
  orders: number;
  customers: number;
}

const mockAnalytics: AnalyticsData = {
  revenue: {
    current: 45280.5,
    previous: 38420.3,
    growth: 17.8,
  },
  orders: {
    current: 127,
    previous: 98,
    growth: 29.6,
  },
  products: {
    total: 8,
    active: 6,
    topPerforming: 'Advanced Driver Analytics',
  },
  customers: {
    total: 89,
    returning: 23,
    newCustomers: 66,
  },
  conversion: {
    rate: 3.2,
    previous: 2.8,
    growth: 14.3,
  },
};

const mockProductPerformance: ProductPerformance[] = [
  {
    id: 'PROD-001',
    name: 'Advanced Driver Analytics',
    category: 'Telemetry',
    sales: 45,
    revenue: 1349.55,
    views: 1247,
    conversionRate: 3.6,
    rating: 4.8,
    trend: 'up',
  },
  {
    id: 'PROD-002',
    name: 'Premium Brake Kit',
    category: 'Parts',
    sales: 18,
    revenue: 4499.82,
    views: 456,
    conversionRate: 3.9,
    rating: 4.9,
    trend: 'up',
  },
  {
    id: 'PROD-003',
    name: 'Fuel Optimization Suite',
    category: 'Telemetry',
    sales: 32,
    revenue: 639.68,
    views: 892,
    conversionRate: 3.6,
    rating: 4.6,
    trend: 'stable',
  },
];

const mockMonthlyData: MonthlyData[] = [
  { month: 'Oct', revenue: 28500, orders: 78, customers: 45 },
  { month: 'Nov', revenue: 32100, orders: 89, customers: 52 },
  { month: 'Dec', revenue: 38420, orders: 98, customers: 61 },
  { month: 'Jan', revenue: 42150, orders: 112, customers: 68 },
  { month: 'Feb', revenue: 39800, orders: 105, customers: 64 },
  { month: 'Mar', revenue: 45280, orders: 127, customers: 89 },
];

export const MerchantAnalytics: React.FC = () => {
  const [dateRange, setDateRange] = useState('last-6-months');
  const [selectedMetric, setSelectedMetric] = useState('revenue');
  const { products, isLoading } = useMarketplaceProducts();

  const getTrendIcon = (growth: number) => {
    if (growth > 0) {
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    } else if (growth < 0) {
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    }
    return <TrendingUp className="h-4 w-4 text-gray-400" />;
  };

  const getTrendColor = (growth: number) => {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getProductTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <TrendingUp className="h-4 w-4 text-gray-400" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted animate-pulse rounded" />
        <div className="grid gap-4 md:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-4 bg-muted animate-pulse rounded mb-2" />
                <div className="h-8 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics & Insights</h2>
          <p className="text-muted-foreground">Track your business performance and growth</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last-7-days">Last 7 days</SelectItem>
              <SelectItem value="last-30-days">Last 30 days</SelectItem>
              <SelectItem value="last-3-months">Last 3 months</SelectItem>
              <SelectItem value="last-6-months">Last 6 months</SelectItem>
              <SelectItem value="last-year">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${mockAnalytics.revenue.current.toLocaleString()}</div>
            <div className={`flex items-center text-xs ${getTrendColor(mockAnalytics.revenue.growth)}`}>
              {getTrendIcon(mockAnalytics.revenue.growth)}
              <span className="ml-1">+{mockAnalytics.revenue.growth}% from last period</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockAnalytics.orders.current}</div>
            <div className={`flex items-center text-xs ${getTrendColor(mockAnalytics.orders.growth)}`}>
              {getTrendIcon(mockAnalytics.orders.growth)}
              <span className="ml-1">+{mockAnalytics.orders.growth}% from last period</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockAnalytics.customers.total}</div>
            <div className="text-xs text-muted-foreground">
              {mockAnalytics.customers.newCustomers} new, {mockAnalytics.customers.returning} returning
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockAnalytics.conversion.rate}%</div>
            <div className={`flex items-center text-xs ${getTrendColor(mockAnalytics.conversion.growth)}`}>
              {getTrendIcon(mockAnalytics.conversion.growth)}
              <span className="ml-1">+{mockAnalytics.conversion.growth}% from last period</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Products</CardTitle>
            <Package className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockAnalytics.products.active}</div>
            <div className="text-xs text-muted-foreground">of {mockAnalytics.products.total} total products</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">Product Performance</TabsTrigger>
          <TabsTrigger value="customers">Customer Insights</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Charts */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>Monthly revenue over the selected period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  <BarChart3 className="h-8 w-8 mr-2" />
                  Revenue Chart Placeholder
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Order Volume</CardTitle>
                <CardDescription>Number of orders over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  <ShoppingCart className="h-8 w-8 mr-2" />
                  Orders Chart Placeholder
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Performing Products */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Products</CardTitle>
              <CardDescription>Your best-selling products this period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockProductPerformance.slice(0, 3).map((product, index) => (
                  <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">{product.category}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">${product.revenue.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">{product.sales} sales</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Product Performance Analysis</CardTitle>
              <CardDescription>Detailed performance metrics for all your products</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockProductPerformance.map((product) => (
                  <Card key={product.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Package className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{product.name}</h3>
                          <p className="text-sm text-muted-foreground">{product.category}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                            <span className="text-sm">{product.rating}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">{getProductTrendIcon(product.trend)}</div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-4 mt-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Sales</div>
                        <div className="text-lg font-bold">{product.sales}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Revenue</div>
                        <div className="text-lg font-bold">${product.revenue.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Views</div>
                        <div className="text-lg font-bold">{product.views.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Conversion</div>
                        <div className="text-lg font-bold">{product.conversionRate}%</div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Customer Acquisition</CardTitle>
                <CardDescription>New vs returning customers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  <Users className="h-8 w-8 mr-2" />
                  Customer Chart Placeholder
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Customer Lifetime Value</CardTitle>
                <CardDescription>Average value per customer</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Average Order Value</div>
                    <div className="text-2xl font-bold">
                      ${(mockAnalytics.revenue.current / mockAnalytics.orders.current).toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Customer Lifetime Value</div>
                    <div className="text-2xl font-bold">
                      ${(mockAnalytics.revenue.current / mockAnalytics.customers.total).toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Repeat Customer Rate</div>
                    <div className="text-2xl font-bold">
                      {((mockAnalytics.customers.returning / mockAnalytics.customers.total) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Business Trends</CardTitle>
              <CardDescription>Historical performance and growth patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                <TrendingUp className="h-8 w-8 mr-2" />
                Trends Chart Placeholder
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Growth Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">+{mockAnalytics.revenue.growth}%</div>
                <p className="text-sm text-muted-foreground">Revenue growth this period</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Best Month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">March</div>
                <p className="text-sm text-muted-foreground">
                  ${mockAnalytics.revenue.current.toLocaleString()} revenue
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Forecast</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  ${(mockAnalytics.revenue.current * 1.15).toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground">Projected next month</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
