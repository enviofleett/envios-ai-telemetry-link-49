
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useBillingSettings } from '@/hooks/useBillingSettings';

const BillingSettingsTab: React.FC = () => {
  const { settings, isLoading, updateSettings, isUpdating } = useBillingSettings();
  const [formData, setFormData] = useState({
    subscription_plan: 'free',
    billing_cycle: 'monthly',
    auto_renewal: true,
    currency: 'USD'
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        subscription_plan: settings.subscription_plan || 'free',
        billing_cycle: settings.billing_cycle || 'monthly',
        auto_renewal: settings.auto_renewal ?? true,
        currency: settings.currency || 'USD'
      });
    }
  }, [settings]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    updateSettings(formData);
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const getUsagePercentage = (current: number, limit: number) => {
    if (limit === 0) return 0;
    return Math.round((current / limit) * 100);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <LoadingSpinner />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing & Subscription Management</CardTitle>
        <CardDescription>Configure fleet billing settings and payment methods</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="subscription-plan">Current Plan</Label>
            <div className="flex items-center gap-2 mt-1">
              <Input
                id="subscription-plan"
                value={`${formData.subscription_plan.charAt(0).toUpperCase() + formData.subscription_plan.slice(1)} Plan`}
                readOnly
                className="bg-muted"
              />
              <Badge variant={formData.subscription_plan === 'free' ? 'secondary' : 'default'}>
                {formData.subscription_plan === 'free' ? 'Free' : 'Paid'}
              </Badge>
            </div>
          </div>
          <div>
            <Label htmlFor="billing-cycle">Billing Cycle</Label>
            <Select
              value={formData.billing_cycle}
              onValueChange={(value) => handleInputChange('billing_cycle', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="annually">Annually</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="next-billing">Next Billing Date</Label>
            <Input
              id="next-billing"
              value={settings?.next_billing_date ? new Date(settings.next_billing_date).toLocaleDateString() : 'Not set'}
              readOnly
              className="bg-muted"
            />
          </div>
          <div>
            <Label htmlFor="billing-amount">Amount</Label>
            <Input
              id="billing-amount"
              value={formatCurrency(settings?.billing_amount || 0, formData.currency)}
              readOnly
              className="bg-muted"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="currency">Currency</Label>
          <Select
            value={formData.currency}
            onValueChange={(value) => handleInputChange('currency', value)}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD ($)</SelectItem>
              <SelectItem value="EUR">EUR (€)</SelectItem>
              <SelectItem value="GBP">GBP (£)</SelectItem>
              <SelectItem value="NGN">NGN (₦)</SelectItem>
              <SelectItem value="CAD">CAD (C$)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        <div className="space-y-4">
          <h4 className="font-medium">Payment Settings</h4>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="auto-renewal">Auto Renewal</Label>
              <p className="text-sm text-muted-foreground">
                Automatically renew subscription when it expires
              </p>
            </div>
            <Switch
              id="auto-renewal"
              checked={formData.auto_renewal}
              onCheckedChange={(checked) => handleInputChange('auto_renewal', checked)}
            />
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h4 className="font-medium">Usage Monitoring</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>API Calls</Label>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Usage this month</span>
                  <span>{(settings?.current_usage as any)?.api_calls || 0} / {(settings?.usage_limits as any)?.api_calls || 'Unlimited'}</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min(
                        getUsagePercentage(
                          (settings?.current_usage as any)?.api_calls || 0,
                          (settings?.usage_limits as any)?.api_calls || 100
                        ),
                        100
                      )}%`
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Data Transfer</Label>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Usage this month</span>
                  <span>{(settings?.current_usage as any)?.data_transfer || '0 GB'} / {(settings?.usage_limits as any)?.data_transfer || 'Unlimited'}</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min(
                        getUsagePercentage(
                          parseFloat((settings?.current_usage as any)?.data_transfer || '0'),
                          parseFloat((settings?.usage_limits as any)?.data_transfer || '10')
                        ),
                        100
                      )}%`
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-4">
          <Button onClick={handleSave} disabled={isUpdating}>
            {isUpdating ? 'Saving...' : 'Update Billing Settings'}
          </Button>
          {isUpdating && <LoadingSpinner />}
        </div>
      </CardContent>
    </Card>
  );
};

export default BillingSettingsTab;
