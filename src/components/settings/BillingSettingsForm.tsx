
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CreditCard, Save } from 'lucide-react';

interface BillingSettings {
  subscription_plan: string;
  billing_cycle: string;
  currency: string;
  billing_amount: number;
  auto_renewal: boolean;
}

const BillingSettingsForm: React.FC = () => {
  const [settings, setSettings] = useState<BillingSettings>({
    subscription_plan: 'free',
    billing_cycle: 'monthly',
    currency: 'USD',
    billing_amount: 0,
    auto_renewal: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('billing_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Error loading billing settings:', error);
      toast({
        title: "Error",
        description: "Failed to load billing settings",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('billing_settings')
        .upsert(settings, { onConflict: 'user_id' });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Billing settings saved successfully"
      });
    } catch (error) {
      console.error('Error saving billing settings:', error);
      toast({
        title: "Error",
        description: "Failed to save billing settings",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof BillingSettings, value: string | number | boolean) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading billing settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="subscription_plan">Subscription Plan</Label>
          <Select
            value={settings.subscription_plan}
            onValueChange={(value) => handleInputChange('subscription_plan', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select plan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="basic">Basic</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
              <SelectItem value="enterprise">Enterprise</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="billing_cycle">Billing Cycle</Label>
          <Select
            value={settings.billing_cycle}
            onValueChange={(value) => handleInputChange('billing_cycle', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select cycle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
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
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
              <SelectItem value="GBP">GBP</SelectItem>
              <SelectItem value="NGN">NGN</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="billing_amount">Billing Amount</Label>
          <Input
            id="billing_amount"
            type="number"
            value={settings.billing_amount}
            onChange={(e) => handleInputChange('billing_amount', parseFloat(e.target.value) || 0)}
            placeholder="0.00"
            step="0.01"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={saveSettings} disabled={isSaving}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
};

export default BillingSettingsForm;
