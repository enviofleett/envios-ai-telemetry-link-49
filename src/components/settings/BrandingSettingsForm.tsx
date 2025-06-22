
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Palette, Save } from 'lucide-react';

interface BrandingSettings {
  company_name: string;
  logo_url: string;
  primary_color: string;
  secondary_color: string;
  background_color: string;
  text_color: string;
  font_family_heading: string;
  font_family_body: string;
  user_id: string;
}

const BrandingSettingsForm: React.FC = () => {
  const [settings, setSettings] = useState<BrandingSettings>({
    company_name: 'FleetIQ',
    logo_url: '',
    primary_color: '#3b82f6',
    secondary_color: '#6366f1',
    background_color: '#ffffff',
    text_color: '#1f2937',
    font_family_heading: 'Inter',
    font_family_body: 'Inter',
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
        .from('branding_settings')
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
      console.error('Error loading branding settings:', error);
      toast({
        title: "Error",
        description: "Failed to load branding settings",
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
        .from('branding_settings')
        .upsert(settingsWithUserId, { onConflict: 'user_id' });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Branding settings saved successfully"
      });
    } catch (error) {
      console.error('Error saving branding settings:', error);
      toast({
        title: "Error",
        description: "Failed to save branding settings",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof BrandingSettings, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading branding settings...</div>;
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
          <Label htmlFor="logo_url">Logo URL</Label>
          <Input
            id="logo_url"
            value={settings.logo_url}
            onChange={(e) => handleInputChange('logo_url', e.target.value)}
            placeholder="Enter logo URL"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="primary_color">Primary Color</Label>
          <div className="flex gap-2">
            <Input
              type="color"
              value={settings.primary_color}
              onChange={(e) => handleInputChange('primary_color', e.target.value)}
              className="w-20"
            />
            <Input
              value={settings.primary_color}
              onChange={(e) => handleInputChange('primary_color', e.target.value)}
              placeholder="#3b82f6"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="secondary_color">Secondary Color</Label>
          <div className="flex gap-2">
            <Input
              type="color"
              value={settings.secondary_color}
              onChange={(e) => handleInputChange('secondary_color', e.target.value)}
              className="w-20"
            />
            <Input
              value={settings.secondary_color}
              onChange={(e) => handleInputChange('secondary_color', e.target.value)}
              placeholder="#6366f1"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="background_color">Background Color</Label>
          <div className="flex gap-2">
            <Input
              type="color"
              value={settings.background_color}
              onChange={(e) => handleInputChange('background_color', e.target.value)}
              className="w-20"
            />
            <Input
              value={settings.background_color}
              onChange={(e) => handleInputChange('background_color', e.target.value)}
              placeholder="#ffffff"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="text_color">Text Color</Label>
          <div className="flex gap-2">
            <Input
              type="color"
              value={settings.text_color}
              onChange={(e) => handleInputChange('text_color', e.target.value)}
              className="w-20"
            />
            <Input
              value={settings.text_color}
              onChange={(e) => handleInputChange('text_color', e.target.value)}
              placeholder="#1f2937"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="font_family_heading">Heading Font</Label>
          <Input
            id="font_family_heading"
            value={settings.font_family_heading}
            onChange={(e) => handleInputChange('font_family_heading', e.target.value)}
            placeholder="Inter"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="font_family_body">Body Font</Label>
          <Input
            id="font_family_body"
            value={settings.font_family_body}
            onChange={(e) => handleInputChange('font_family_body', e.target.value)}
            placeholder="Inter"
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

export default BrandingSettingsForm;
