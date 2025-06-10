
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Calendar,
  BarChart3,
  PieChart,
  Download,
  Filter
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface WorkshopAnalyticsDashboardProps {
  workshopId: string;
}

const WorkshopAnalyticsDashboard: React.FC<WorkshopAnalyticsDashboardProps> = ({ workshopId }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [activeMetric, setActiveMetric] = useState('overview');

  // Fetch workshop analytics data
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['workshop-analytics', workshopId, selectedPeriod],
    queryFn: async () => {
      // Mock analytics data - in real implementation, this would come from your database
      return {
        overview: {
          totalRevenue: 45250,
          totalBookings: 234,
          averageRating: 4.6,
          completionRate: 94.5,
          revenueGrowth: 12.5,
          bookingGrowth: 8.3
        },
        performance: {
          serviceTypes: [
            { name: 'Oil Change', bookings: 85, revenue: 8500, avgDuration: 45 },
            { name: 'Brake Service', bookings: 42, revenue: 12600, avgDuration: 120 },
            { name: 'Tire Replacement', bookings: 38, revenue: 15200, avgDuration: 90 },
            { name: 'Engine Diagnostics', bookings: 29, revenue: 8700, avgDuration: 180 },
            { name: 'Transmission Service', bookings: 15, revenue: 7500, avgDuration: 240 }
          ],
          monthlyTrends: [
            { month: 'Jan', revenue: 38000, bookings: 185 },
            { month: 'Feb', revenue: 42000, bookings: 205 },
            { month: 'Mar', revenue: 45250, bookings: 234 },
            { month: 'Apr', revenue: 48500, bookings: 251 },
            { month: 'May', revenue: 52000, bookings: 268 }
          ]
        },
        financial: {
          totalRevenue: 45250,
          totalExpenses: 18900,
          netProfit: 26350,
          profitMargin: 58.2,
          averageOrderValue: 193.37,
          revenueByPaymentMethod: [
            { method: 'Credit Card', amount: 32400, percentage: 71.6 },
            { method: 'Cash', amount: 9050, percentage: 20.0 },
            { method: 'Bank Transfer', amount: 3800, percentage: 8.4 }
          ]
        },
        usage: {
          peakHours: [
            { hour: '9:00 AM', bookings: 18 },
            { hour: '10:00 AM', bookings: 25 },
            { hour: '11:00 AM', bookings: 22 },
            { hour: '2:00 PM', bookings: 28 },
            { hour: '3:00 PM', bookings: 31 },
            { hour: '4:00 PM', bookings: 24 }
          ],
          customerRetention: 68.5,
          averageWaitTime: 12.5,
          serviceEfficiency: 87.3
        }
      };
    }
  });

  const handleExportReport = (type: string) => {
    console.log(`Exporting ${type} report for workshop ${workshopId}`);
    // Implement export functionality
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Workshop Analytics</h1>
          <p className="text-muted-foreground">Performance insights and reporting</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 3 months</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">${analyticsData?.overview.totalRevenue.toLocaleString()}</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                  <span className="text-sm text-green-600">+{analyticsData?.overview.revenueGrowth}%</span>
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Bookings</p>
                <p className="text-2xl font-bold">{analyticsData?.overview.totalBookings}</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 text-blue-600 mr-1" />
                  <span className="text-sm text-blue-600">+{analyticsData?.overview.bookingGrowth}%</span>
                </div>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Average Rating</p>
                <p className="text-2xl font-bold">{analyticsData?.overview.averageRating}</p>
                <div className="flex items-center mt-2">
                  <span className="text-sm text-yellow-600">★★★★★</span>
                </div>
              </div>
              <Users className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completion Rate</p>
                <p className="text-2xl font-bold">{analyticsData?.overview.completionRate}%</p>
                <div className="flex items-center mt-2">
                  <Badge variant="outline" className="bg-green-100 text-green-800">
                    Excellent
                  </Badge>
                </div>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs value={activeMetric} onValueChange={setActiveMetric}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>Monthly revenue over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData?.performance.monthlyTrends.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{item.month}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">{item.bookings} bookings</span>
                        <span className="text-sm font-medium">${item.revenue.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Service Performance</CardTitle>
                <CardDescription>Top performing services</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData?.performance.serviceTypes.slice(0, 5).map((service, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{service.name}</p>
                        <p className="text-xs text-muted-foreground">{service.bookings} bookings</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">${service.revenue.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{service.avgDuration}min avg</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Service Types Performance
                  <Button variant="outline" size="sm" onClick={() => handleExportReport('performance')}>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData?.performance.serviceTypes.map((service, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{service.name}</h4>
                        <Badge variant="outline">{service.bookings} bookings</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                        <div>
                          <span>Revenue: </span>
                          <span className="font-medium text-foreground">${service.revenue.toLocaleString()}</span>
                        </div>
                        <div>
                          <span>Avg Duration: </span>
                          <span className="font-medium text-foreground">{service.avgDuration} min</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData?.performance.monthlyTrends.map((month, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">{month.month}</span>
                      <div className="text-right">
                        <div className="text-sm font-medium">${month.revenue.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">{month.bookings} bookings</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Financial Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Total Revenue</span>
                  <span className="font-medium">${analyticsData?.financial.totalRevenue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Expenses</span>
                  <span className="font-medium">${analyticsData?.financial.totalExpenses.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="font-medium">Net Profit</span>
                  <span className="font-bold text-green-600">${analyticsData?.financial.netProfit.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Profit Margin</span>
                  <span className="font-medium">{analyticsData?.financial.profitMargin}%</span>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Revenue by Payment Method</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData?.financial.revenueByPaymentMethod.map((method, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{method.method}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-32 h-2 bg-gray-200 rounded-full">
                          <div 
                            className="h-2 bg-blue-600 rounded-full" 
                            style={{ width: `${method.percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">${method.amount.toLocaleString()}</span>
                        <span className="text-xs text-muted-foreground">({method.percentage}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="usage" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Peak Hours Analysis</CardTitle>
                <CardDescription>Busiest booking times</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData?.usage.peakHours.map((hour, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{hour.hour}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-2 bg-gray-200 rounded-full">
                          <div 
                            className="h-2 bg-purple-600 rounded-full" 
                            style={{ width: `${(hour.bookings / 31) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{hour.bookings}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Key Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Customer Retention</span>
                  <span className="font-medium">{analyticsData?.usage.customerRetention}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Average Wait Time</span>
                  <span className="font-medium">{analyticsData?.usage.averageWaitTime} min</span>
                </div>
                <div className="flex justify-between">
                  <span>Service Efficiency</span>
                  <span className="font-medium">{analyticsData?.usage.serviceEfficiency}%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WorkshopAnalyticsDashboard;
