
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditCard, DollarSign, Receipt, TrendingUp, Download } from 'lucide-react';

const BillingTab: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState('monthly');

  const billingStats = {
    monthlyRevenue: '$12,450',
    totalCustomers: 89,
    activeSubscriptions: 156,
    churnRate: '2.3%'
  };

  const recentInvoices = [
    {
      id: 'INV-001',
      customer: 'Fleet Corp',
      amount: '$299.99',
      status: 'paid',
      date: '2024-01-15'
    },
    {
      id: 'INV-002',
      customer: 'Transport Ltd',
      amount: '$199.99',
      status: 'pending',
      date: '2024-01-14'
    },
    {
      id: 'INV-003',
      customer: 'Logistics Inc',
      amount: '$99.99',
      status: 'overdue',
      date: '2024-01-10'
    }
  ];

  const subscriptionPlans = [
    {
      name: 'Basic',
      price: '$29.99',
      interval: 'monthly',
      subscribers: 45,
      revenue: '$1,349.55'
    },
    {
      name: 'Professional',
      price: '$79.99',
      interval: 'monthly',
      subscribers: 32,
      revenue: '$2,559.68'
    },
    {
      name: 'Enterprise',
      price: '$199.99',
      interval: 'monthly',
      subscribers: 12,
      revenue: '$2,399.88'
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="default">{status}</Badge>;
      case 'pending':
        return <Badge variant="secondary">{status}</Badge>;
      case 'overdue':
        return <Badge variant="destructive">{status}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Billing Management
          </CardTitle>
          <CardDescription>
            Manage billing, subscriptions, and revenue tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="invoices">Invoices</TabsTrigger>
              <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                        <p className="text-2xl font-bold">{billingStats.monthlyRevenue}</p>
                      </div>
                      <DollarSign className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Customers</p>
                        <p className="text-2xl font-bold">{billingStats.totalCustomers}</p>
                      </div>
                      <CreditCard className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Active Subscriptions</p>
                        <p className="text-2xl font-bold">{billingStats.activeSubscriptions}</p>
                      </div>
                      <Receipt className="h-8 w-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Churn Rate</p>
                        <p className="text-2xl font-bold">{billingStats.churnRate}</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-red-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Subscription Plans</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {subscriptionPlans.map((plan, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded">
                          <div>
                            <p className="font-medium">{plan.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {plan.price}/{plan.interval} • {plan.subscribers} subscribers
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{plan.revenue}</p>
                            <p className="text-sm text-muted-foreground">revenue</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Recent Invoices</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {recentInvoices.map((invoice) => (
                        <div key={invoice.id} className="flex items-center justify-between p-3 border rounded">
                          <div>
                            <p className="font-medium">{invoice.id}</p>
                            <p className="text-sm text-muted-foreground">{invoice.customer}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{invoice.amount}</p>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(invoice.status)}
                              <span className="text-xs text-muted-foreground">{invoice.date}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="invoices" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Invoice Management</h3>
                <Button>
                  <Download className="h-4 w-4 mr-2" />
                  Export Invoices
                </Button>
              </div>
              <Card>
                <CardContent className="p-6">
                  <div className="text-center py-8 text-muted-foreground">
                    Invoice management interface would be displayed here
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="subscriptions" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Subscription Management</h3>
                <Button>Create New Plan</Button>
              </div>
              <Card>
                <CardContent className="p-6">
                  <div className="text-center py-8 text-muted-foreground">
                    Subscription management interface would be displayed here
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Billing Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="company-name">Company Name</Label>
                      <Input
                        id="company-name"
                        defaultValue="FleetIQ Inc."
                        placeholder="Company name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tax-id">Tax ID</Label>
                      <Input
                        id="tax-id"
                        defaultValue="123-456-789"
                        placeholder="Tax identification number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="billing-email">Billing Email</Label>
                      <Input
                        id="billing-email"
                        type="email"
                        defaultValue="billing@fleetiq.com"
                        placeholder="billing@company.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="payment-terms">Payment Terms (days)</Label>
                      <Input
                        id="payment-terms"
                        type="number"
                        defaultValue="30"
                        placeholder="30"
                      />
                    </div>
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
