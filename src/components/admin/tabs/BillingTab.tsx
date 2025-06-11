
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditCard, DollarSign, FileText, Settings, TrendingUp } from 'lucide-react';
import { useBillingSettings } from '@/hooks/useBillingSettings';
import { toast } from 'sonner';

const BillingTab: React.FC = () => {
  const { data: billingData, isLoading, error } = useBillingSettings();
  const [activeSubscriptions] = useState(245); // This would come from a subscription hook
  const [monthlyRevenue] = useState(12450); // This would come from analytics

  const handleUpdatePayment = () => {
    toast.info('Payment method update functionality coming soon');
  };

  const handleViewInvoice = (invoiceId: string) => {
    toast.info(`View invoice ${invoiceId} functionality coming soon`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="grid grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-20 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Error loading billing data: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Billing & Subscriptions
          </CardTitle>
          <CardDescription>
            Manage billing settings and subscription plans
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
              <TabsTrigger value="invoices">Invoices</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                        <p className="text-2xl font-bold">${monthlyRevenue.toLocaleString()}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <TrendingUp className="h-3 w-3 text-green-600" />
                          <span className="text-xs text-green-600">+12%</span>
                        </div>
                      </div>
                      <DollarSign className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Active Subscriptions</p>
                        <p className="text-2xl font-bold">{activeSubscriptions}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <TrendingUp className="h-3 w-3 text-green-600" />
                          <span className="text-xs text-green-600">+8%</span>
                        </div>
                      </div>
                      <CreditCard className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Current Plan</p>
                        <p className="text-2xl font-bold">{billingData?.subscription_plan || 'Free'}</p>
                        <p className="text-xs text-muted-foreground">
                          {billingData?.billing_cycle || 'monthly'}
                        </p>
                      </div>
                      <Settings className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Current Billing Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Billing Amount</p>
                      <p className="text-lg">${billingData?.billing_amount || '0.00'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Next Billing Date</p>
                      <p className="text-lg">
                        {billingData?.next_billing_date 
                          ? new Date(billingData.next_billing_date).toLocaleDateString()
                          : 'Not set'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Auto Renewal</p>
                      <Badge variant={billingData?.auto_renewal ? 'default' : 'secondary'}>
                        {billingData?.auto_renewal ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Currency</p>
                      <p className="text-lg">{billingData?.currency || 'USD'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="subscriptions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Device Subscriptions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    Device subscription management will be implemented here.
                    This will show all active device subscriptions with their billing status.
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="invoices" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Recent Invoices</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center gap-3">
                          <FileText className="h-4 w-4" />
                          <div>
                            <p className="font-medium">Invoice #2024-{String(i).padStart(3, '0')}</p>
                            <p className="text-sm text-muted-foreground">
                              January {i * 10}, 2024
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="default">Paid</Badge>
                          <p className="font-medium">${(Math.random() * 1000 + 100).toFixed(2)}</p>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewInvoice(`2024-${String(i).padStart(3, '0')}`)}
                          >
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Payment Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Default Payment Method</p>
                      <p className="text-sm text-muted-foreground">
                        {billingData?.payment_methods?.length > 0 
                          ? 'Card ending in ****1234'
                          : 'No payment method on file'}
                      </p>
                    </div>
                    <Button variant="outline" onClick={handleUpdatePayment}>
                      Update
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Billing Notifications</p>
                      <p className="text-sm text-muted-foreground">
                        Receive email notifications for billing events
                      </p>
                    </div>
                    <Badge variant="default">Enabled</Badge>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default BillingTab;
