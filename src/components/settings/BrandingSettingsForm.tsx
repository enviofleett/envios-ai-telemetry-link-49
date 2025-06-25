
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Palette, Save } from 'lucide-react';

// Safe array helper - prevents "map is not a function" errors
function safeArray(value: any): any[] {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined) return [];
  console.warn('Expected array but got:', typeof value, value);
  return [];
}

interface BrandingSettings {
  id: string;
  user_id: string;
  company_name: string;
  tagline: string;
  subtitle: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
  font_family_body: string;
  font_family_heading: string;
  logo_url: string;
  favicon_url: string;
  custom_css: string;
  is_branding_active: boolean;
  auth_page_branding: boolean;
  created_at: string;
  updated_at: string;
}

const BrandingSettingsForm: React.FC = () => {
  const [settings, setSettings] = useState<BrandingSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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
        .from('branding_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading branding settings:', error);
        return;
      }

      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Error in loadSettings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    try {
      setIsSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('branding_settings')
        .upsert({
          user_id: user.id,
          company_name: settings.company_name,
          tagline: settings.tagline,
          subtitle: settings.subtitle,
          primary_color: settings.primary_color,
          secondary_color: settings.secondary_color,
          accent_color: settings.accent_color,
          background_color: settings.background_color,
          text_color: settings.text_color,
          font_family_body: settings.font_family_body,
          font_family_heading: settings.font_family_heading,
          logo_url: settings.logo_url,
          favicon_url: settings.favicon_url,
          custom_css: settings.custom_css,
          is_branding_active: settings.is_branding_active,
          auth_page_branding: settings.auth_page_branding,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error saving branding settings:', error);
        toast({
          title: "Error",
          description: "Failed to save branding settings",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: "Branding settings saved successfully"
        });
      }
    } catch (error) {
      console.error('Error in handleSave:', error);
      toast({
        title: "Error",
        description: "Failed to save branding settings",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof BrandingSettings, value: any) => {
    if (!settings) return;
    setSettings(prev => prev ? {
      ...prev,
      [field]: value
    } : null);
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
          <Palette className="h-5 w-5" />
          Branding Settings
        </CardTitle>
        <CardDescription>
          Customize your application's visual identity and branding
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="company_name">Company Name</Label>
            <Input
              id="company_name"
              value={settings?.company_name || 'FleetIQ'}
              onChange={(e) => handleInputChange('company_name', e.target.value)}
              placeholder="Enter company name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tagline">Tagline</Label>
            <Input
              id="tagline"
              value={settings?.tagline || 'GPS51 Management Platform'}
              onChange={(e) => handleInputChange('tagline', e.target.value)}
              placeholder="Enter tagline"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="primary_color">Primary Color</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={settings?.primary_color || '#3b82f6'}
                onChange={(e) => handleInputChange('primary_color', e.target.value)}
                className="w-20"
              />
              <Input
                value={settings?.primary_color || '#3b82f6'}
                onChange={(e) => handleInputChange('primary_color', e.target.value)}
                placeholder="#3b82f6"
                className="flex-1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="secondary_color">Secondary Color</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={settings?.secondary_color || '#6366f1'}
                onChange={(e) => handleInputChange('secondary_color', e.target.value)}
                className="w-20"
              />
              <Input
                value={settings?.secondary_color || '#6366f1'}
                onChange={(e) => handleInputChange('secondary_color', e.target.value)}
                placeholder="#6366f1"
                className="flex-1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="logo_url">Logo URL</Label>
            <Input
              id="logo_url"
              value={settings?.logo_url || ''}
              onChange={(e) => handleInputChange('logo_url', e.target.value)}
              placeholder="Enter logo URL"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="favicon_url">Favicon URL</Label>
            <Input
              id="favicon_url"
              value={settings?.favicon_url || ''}
              onChange={(e) => handleInputChange('favicon_url', e.target.value)}
              placeholder="Enter favicon URL"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="subtitle">Subtitle</Label>
          <Input
            id="subtitle"
            value={settings?.subtitle || 'Professional vehicle tracking and management'}
            onChange={(e) => handleInputChange('subtitle', e.target.value)}
            placeholder="Enter subtitle"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="custom_css">Custom CSS</Label>
          <Textarea
            id="custom_css"
            value={settings?.custom_css || ''}
            onChange={(e) => handleInputChange('custom_css', e.target.value)}
            placeholder="Enter custom CSS"
            rows={4}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="is_branding_active">Enable Branding</Label>
            <p className="text-sm text-muted-foreground">
              Apply custom branding to the application
            </p>
          </div>
          <Switch
            id="is_branding_active"
            checked={settings?.is_branding_active || true}
            onCheckedChange={(checked) => handleInputChange('is_branding_active', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="auth_page_branding">Auth Page Branding</Label>
            <p className="text-sm text-muted-foreground">
              Apply branding to login and registration pages
            </p>
          </div>
          <Switch
            id="auth_page_branding"
            checked={settings?.auth_page_branding || true}
            onCheckedChange={(checked) => handleInputChange('auth_page_branding', checked)}
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

export default BrandingSettingsForm;
