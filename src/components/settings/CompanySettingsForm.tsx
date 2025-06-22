
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Building2, Save } from 'lucide-react';

interface CompanySettings {
  company_name: string;
  company_address: string;
  contact_email: string;
  phone_number: string;
  timezone: string;
  currency_code: string;
  fleet_size: number;
  user_id: string;
}

const CompanySettingsForm: React.FC = () => {
  const [settings, setSettings] = useState<CompanySettings>({
    company_name: '',
    company_address: '',
    contact_email: '',
    phone_number: '',
    timezone: 'UTC',
    currency_code: 'USD',
    fleet_size: 0,
    user_id: ''
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setSettings({ ...data, user_id: user.id });
      } else {
        setSettings(prev => ({ ...prev, user_id: user.id }));
      }
    } catch (error) {
      console.error('Error loading company settings:', error);
      toast({
        title: "Error",
        description: "Failed to load company settings",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const settingsWithUserId = { ...settings, user_id: user.id };

      const { error } = await supabase
        .from('company_settings')
        .upsert(settingsWithUserId, { onConflict: 'user_id' });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Company settings saved successfully"
      });
    } catch (error) {
      console.error('Error saving company settings:', error);
      toast({
        title: "Error",
        description: "Failed to save company settings",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof CompanySettings, value: string | number) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading company settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="company_name">Company Name</Label>
          <Input
            id="company_name"
            value={settings.company_name}
            onChange={(e) => handleInputChange('company_name', e.target.value)}
            placeholder="Enter company name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact_email">Contact Email</Label>
          <Input
            id="contact_email"
            type="email"
            value={settings.contact_email}
            onChange={(e) => handleInputChange('contact_email', e.target.value)}
            placeholder="Enter contact email"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone_number">Phone Number</Label>
          <Input
            id="phone_number"
            value={settings.phone_number}
            onChange={(e) => handleInputChange('phone_number', e.target.value)}
            placeholder="Enter phone number"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="fleet_size">Fleet Size</Label>
          <Input
            id="fleet_size"
            type="number"
            value={settings.fleet_size}
            onChange={(e) => handleInputChange('fleet_size', parseInt(e.target.value) || 0)}
            placeholder="Number of vehicles"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="timezone">Timezone</Label>
          <Input
            id="timezone"
            value={settings.timezone}
            onChange={(e) => handleInputChange('timezone', e.target.value)}
            placeholder="UTC"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="currency_code">Currency Code</Label>
          <Input
            id="currency_code"
            value={settings.currency_code}
            onChange={(e) => handleInputChange('currency_code', e.target.value)}
            placeholder="USD"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="company_address">Company Address</Label>
        <Textarea
          id="company_address"
          value={settings.company_address}
          onChange={(e) => handleInputChange('company_address', e.target.value)}
          placeholder="Enter company address"
          rows={3}
        />
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

export default CompanySettingsForm;
