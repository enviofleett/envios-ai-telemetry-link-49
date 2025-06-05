
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, 
  CreditCard, 
  AlertTriangle, 
  TrendingUp,
  Calendar,
  FileText
} from 'lucide-react';
import { useBillingManagement } from '@/hooks/useBillingManagement';
import { format } from 'date-fns';

const BillingDashboard = () => {
  const {
    dashboardStats,
    subscriptions,
    invoices,
    dashboardStatsLoading,
    getActiveSubscriptions,
    getExpiringSubscriptions,
    getOverdueInvoices
  } = useBillingManagement();

  const activeSubscriptions = getActiveSubscriptions();
  const expiringSubscriptions = getExpiringSubscriptions();
  const overdueInvoices = getOverdueInvoices();

  const statsCards = [
    {
      title: 'Total Revenue',
      value: `$${dashboardStats?.total_revenue?.toFixed(2) || '0.00'}`,
      icon: DollarSign,
      trend: dashboardStats?.revenue_growth || 0,
      color: 'text-green-600'
    },
    {
      title: 'Monthly Recurring Revenue',
      value: `$${dashboardStats?.monthly_recurring_revenue?.toFixed(2) || '0.00'}`,
      icon: TrendingUp,
      trend: 5.2,
      color: 'text-blue-600'
    },
    {
      title: 'Active Subscriptions',
      value: dashboardStats?.active_subscriptions?.toString() || '0',
      icon: CreditCard,
      trend: 2.1,
      color: 'text-purple-600'
    },
    {
      title: 'Pending Invoices',
      value: dashboardStats?.pending_invoices?.toString() || '0',
      icon: FileText,
      trend: -1.5,
      color: 'text-orange-600'
    }
  ];

  if (dashboardStatsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-4 w-4 bg-gray-200 rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-20"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center text-xs text-gray-500">
                <TrendingUp className={`h-3 w-3 mr-1 ${stat.trend >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                <span className={stat.trend >= 0 ? 'text-green-500' : 'text-red-500'}>
                  {stat.trend >= 0 ? '+' : ''}{stat.trend}%
                </span>
                <span className="ml-1">from last month</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alerts and Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Expiring Subscriptions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-orange-500" />
              Expiring Soon
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {expiringSubscriptions.length === 0 ? (
              <p className="text-sm text-gray-500">No subscriptions expiring soon</p>
            ) : (
              <>
                {expiringSubscriptions.slice(0, 3).map((subscription) => (
                  <div key={subscription.id} className="flex items-center justify-between p-2 bg-orange-50 rounded">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{subscription.device_id}</p>
                      <p className="text-xs text-gray-500">
                        Expires {format(new Date(subscription.end_date), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-orange-600">
                      {Math.ceil((new Date(subscription.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                    </Badge>
                  </div>
                ))}
                {expiringSubscriptions.length > 3 && (
                  <p className="text-xs text-gray-500 text-center">
                    +{expiringSubscriptions.length - 3} more expiring
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Overdue Invoices */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Overdue Invoices
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {overdueInvoices.length === 0 ? (
              <p className="text-sm text-gray-500">No overdue invoices</p>
            ) : (
              <>
                {overdueInvoices.slice(0, 3).map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-2 bg-red-50 rounded">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{invoice.invoice_number}</p>
                      <p className="text-xs text-gray-500">
                        Due {format(new Date(invoice.due_date), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <Badge variant="destructive">
                      ${invoice.total_amount.toFixed(2)}
                    </Badge>
                  </div>
                ))}
                {overdueInvoices.length > 3 && (
                  <p className="text-xs text-gray-500 text-center">
                    +{overdueInvoices.length - 3} more overdue
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeSubscriptions.slice(0, 3).map((subscription) => (
              <div key={subscription.id} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                <div className="flex-1">
                  <p className="text-sm font-medium">{subscription.device_id}</p>
                  <p className="text-xs text-gray-500">
                    {subscription.service_plan?.plan_name || 'Unknown Plan'}
                  </p>
                </div>
                <Badge 
                  variant={subscription.subscription_status === 'active' ? 'default' : 'secondary'}
                  className={subscription.subscription_status === 'active' ? 'bg-green-100 text-green-800' : ''}
                >
                  {subscription.subscription_status}
                </Badge>
              </div>
            ))}
            {activeSubscriptions.length === 0 && (
              <p className="text-sm text-gray-500">No active subscriptions</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              Generate Invoice
            </Button>
            <Button variant="outline" size="sm">
              <CreditCard className="h-4 w-4 mr-2" />
              Add Payment Method
            </Button>
            <Button variant="outline" size="sm">
              <TrendingUp className="h-4 w-4 mr-2" />
              View Reports
            </Button>
            <Button variant="outline" size="sm">
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Renewal
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BillingDashboard;
