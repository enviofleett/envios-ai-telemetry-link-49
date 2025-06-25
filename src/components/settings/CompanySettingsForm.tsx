
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Building2, Save } from 'lucide-react';

// Safe array helper - prevents "map is not a function" errors
function safeArray(value: any): any[] {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined) return [];
  console.warn('Expected array but got:', typeof value, value);
  return [];
}

interface CompanySettings {
  company_name: string;
  company_address: string;
  phone_number: string;
  contact_email: string;
  operational_hours: string;
  fleet_size: number;
  currency_code: string;
  currency_symbol: string;
  timezone: string;
  logo_url: string;
}

const CompanySettingsForm: React.FC = () => {
  const [settings, setSettings] = useState<CompanySettings>({
    company_name: '',
    company_address: '',
    phone_number: '',
    contact_email: '',
    operational_hours: '',
    fleet_size: 0,
    currency_code: 'USD',
    currency_symbol: '$',
    timezone: 'UTC',
    logo_url: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading settings:', error);
        return;
      }

      if (data) {
        setSettings({
          company_name: data.company_name || '',
          company_address: data.company_address || '',
          phone_number: data.phone_number || '',
          contact_email: data.contact_email || '',
          operational_hours: data.operational_hours || '',
          fleet_size: data.fleet_size || 0,
          currency_code: data.currency_code || 'USD',
          currency_symbol: data.currency_symbol || '$',
          timezone: data.timezone || 'UTC',
          logo_url: data.logo_url || ''
        });
      }
    } catch (error) {
      console.error('Error in loadSettings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('company_settings')
        .upsert({
          user_id: user.id,
          ...settings,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error saving settings:', error);
        toast({
          title: "Error",
          description: "Failed to save company settings",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: "Company settings saved successfully"
        });
      }
    } catch (error) {
      console.error('Error in handleSave:', error);
      toast({
        title: "Error",
        description: "Failed to save company settings",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof CompanySettings, value: string) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Company Information
        </CardTitle>
        <CardDescription>
          Update your company details and contact information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              placeholder="Enter fleet size"
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

          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Input
              id="timezone"
              value={settings.timezone}
              onChange={(e) => handleInputChange('timezone', e.target.value)}
              placeholder="UTC"
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

        <div className="space-y-2">
          <Label htmlFor="operational_hours">Operational Hours</Label>
          <Textarea
            id="operational_hours"
            value={settings.operational_hours}
            onChange={(e) => handleInputChange('operational_hours', e.target.value)}
            placeholder="Enter operational hours"
            rows={2}
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
  );
};

export default CompanySettingsForm;
