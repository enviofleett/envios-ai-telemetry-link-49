
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Palette, Save, Upload } from 'lucide-react';

// Safe array helper - prevents "map is not a function" errors
function safeArray(value: any): any[] {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined) return [];
  console.warn('Expected array but got:', typeof value, value);
  return [];
}

interface BrandingSettings {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  logo_url: string;
  favicon_url: string;
  brand_name: string;
}

const BrandingSettingsForm: React.FC = () => {
  const [settings, setSettings] = useState<BrandingSettings>({
    primary_color: '#3B82F6',
    secondary_color: '#64748B',
    accent_color: '#10B981',
    logo_url: '',
    favicon_url: '',
    brand_name: ''
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
        .from('branding_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading branding settings:', error);
        return;
      }

      if (data) {
        setSettings({
          primary_color: data.primary_color || '#3B82F6',
          secondary_color: data.secondary_color || '#64748B',
          accent_color: data.accent_color || '#10B981',
          logo_url: data.logo_url || '',
          favicon_url: data.favicon_url || '',
          brand_name: data.brand_name || ''
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
        .from('branding_settings')
        .upsert({
          user_id: user.id,
          ...settings,
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

  const handleInputChange = (field: keyof BrandingSettings, value: string) => {
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
          <Palette className="h-5 w-5" />
          Branding Settings
        </CardTitle>
        <CardDescription>
          Customize your application's visual identity and branding
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="brand_name">Brand Name</Label>
          <Input
            id="brand_name"
            value={settings.brand_name}
            onChange={(e) => handleInputChange('brand_name', e.target.value)}
            placeholder="Enter brand name"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="primary_color">Primary Color</Label>
            <div className="flex gap-2">
              <Input
                id="primary_color"
                type="color"
                value={settings.primary_color}
                onChange={(e) => handleInputChange('primary_color', e.target.value)}
                className="w-16 h-10 p-1 border rounded"
              />
              <Input
                value={settings.primary_color}
                onChange={(e) => handleInputChange('primary_color', e.target.value)}
                placeholder="#3B82F6"
                className="flex-1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="secondary_color">Secondary Color</Label>
            <div className="flex gap-2">
              <Input
                id="secondary_color"
                type="color"
                value={settings.secondary_color}
                onChange={(e) => handleInputChange('secondary_color', e.target.value)}
                className="w-16 h-10 p-1 border rounded"
              />
              <Input
                value={settings.secondary_color}
                onChange={(e) => handleInputChange('secondary_color', e.target.value)}
                placeholder="#64748B"
                className="flex-1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="accent_color">Accent Color</Label>
            <div className="flex gap-2">
              <Input
                id="accent_color"
                type="color"
                value={settings.accent_color}
                onChange={(e) => handleInputChange('accent_color', e.target.value)}
                className="w-16 h-10 p-1 border rounded"
              />
              <Input
                value={settings.accent_color}
                onChange={(e) => handleInputChange('accent_color', e.target.value)}
                placeholder="#10B981"
                className="flex-1"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="logo_url">Logo URL</Label>
            <div className="flex gap-2">
              <Input
                id="logo_url"
                value={settings.logo_url}
                onChange={(e) => handleInputChange('logo_url', e.target.value)}
                placeholder="Enter logo URL"
                className="flex-1"
              />
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="favicon_url">Favicon URL</Label>
            <div className="flex gap-2">
              <Input
                id="favicon_url"
                value={settings.favicon_url}
                onChange={(e) => handleInputChange('favicon_url', e.target.value)}
                placeholder="Enter favicon URL"
                className="flex-1"
              />
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-4 bg-gray-50">
          <h4 className="font-medium mb-2">Preview</h4>
          <div className="flex items-center gap-3">
            <div 
              className="w-8 h-8 rounded"
              style={{ backgroundColor: settings.primary_color }}
            ></div>
            <div 
              className="w-8 h-8 rounded"
              style={{ backgroundColor: settings.secondary_color }}
            ></div>
            <div 
              className="w-8 h-8 rounded"
              style={{ backgroundColor: settings.accent_color }}
            ></div>
            <span className="text-sm text-gray-600">
              {settings.brand_name || 'Your Brand Name'}
            </span>
          </div>
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
