
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CreditCard, Save, Download } from 'lucide-react';

// Safe array helper - prevents "map is not a function" errors
function safeArray(value: any): any[] {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined) return [];
  console.warn('Expected array but got:', typeof value, value);
  return [];
}

interface BillingSettings {
  billing_email: string;
  billing_address: string;
  payment_method: string;
  currency: string;
  auto_renew: boolean;
  invoice_frequency: string;
}

interface BillingHistory {
  id: string;
  date: string;
  amount: number;
  status: string;
  invoice_url: string;
}

const BillingSettingsForm: React.FC = () => {
  const [settings, setSettings] = useState<BillingSettings>({
    billing_email: '',
    billing_address: '',
    payment_method: '',
    currency: 'USD',
    auto_renew: true,
    invoice_frequency: 'monthly'
  });
  const [billingHistory, setBillingHistory] = useState<BillingHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
    loadBillingHistory();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('billing_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading billing settings:', error);
        return;
      }

      if (data) {
        setSettings({
          billing_email: data.billing_email || '',
          billing_address: data.billing_address || '',
          payment_method: data.payment_method || '',
          currency: data.currency || 'USD',
          auto_renew: data.auto_renew ?? true,
          invoice_frequency: data.invoice_frequency || 'monthly'
        });
      }
    } catch (error) {
      console.error('Error in loadSettings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadBillingHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('billing_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error loading billing history:', error);
        return;
      }

      // Use safeArray to ensure we have an array
      setBillingHistory(safeArray(data).map((item: any) => ({
        id: item.id,
        date: new Date(item.created_at).toLocaleDateString(),
        amount: item.amount || 0,
        status: item.status || 'pending',
        invoice_url: item.invoice_url || ''
      })));
    } catch (error) {
      console.error('Error in loadBillingHistory:', error);
      setBillingHistory([]); // Fallback to empty array
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('billing_settings')
        .upsert({
          user_id: user.id,
          ...settings,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error saving billing settings:', error);
        toast({
          title: "Error",
          description: "Failed to save billing settings",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: "Billing settings saved successfully"
        });
      }
    } catch (error) {
      console.error('Error in handleSave:', error);
      toast({
        title: "Error",
        description: "Failed to save billing settings",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof BillingSettings, value: string | boolean) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="default">Paid</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
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
            Billing Settings
          </CardTitle>
          <CardDescription>
            Manage your billing information and payment preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="billing_email">Billing Email</Label>
              <Input
                id="billing_email"
                type="email"
                value={settings.billing_email}
                onChange={(e) => handleInputChange('billing_email', e.target.value)}
                placeholder="Enter billing email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={settings.currency}
                onValueChange={(value) => handleInputChange('currency', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                  <SelectItem value="NGN">NGN (₦)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_method">Payment Method</Label>
              <Select
                value={settings.payment_method}
                onValueChange={(value) => handleInputChange('payment_method', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="debit_card">Debit Card</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="invoice_frequency">Invoice Frequency</Label>
              <Select
                value={settings.invoice_frequency}
                onValueChange={(value) => handleInputChange('invoice_frequency', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="annually">Annually</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="billing_address">Billing Address</Label>
            <Input
              id="billing_address"
              value={settings.billing_address}
              onChange={(e) => handleInputChange('billing_address', e.target.value)}
              placeholder="Enter billing address"
            />
          </div>

          <div className="flex justify-end">
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>
            View your recent billing transactions and download invoices
          </CardDescription>
        </CardHeader>
        <CardContent>
          {safeArray(billingHistory).length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No billing history available</p>
            </div>
          ) : (
            <div className="space-y-4">
              {safeArray(billingHistory).map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-medium">{item.date}</p>
                      <p className="text-sm text-gray-600">${item.amount.toFixed(2)}</p>
                    </div>
                    {getStatusBadge(item.status)}
                  </div>
                  <div className="flex items-center gap-2">
                    {item.invoice_url && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={item.invoice_url} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4 mr-2" />
                          Invoice
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BillingSettingsForm;
