
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface BrandingSettings {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
  font_family: string;
  logo_url?: string;
  favicon_url?: string;
  custom_css?: string;
  is_active: boolean;
}

const defaultBrandingSettings: BrandingSettings = {
  primary_color: '#3B82F6',
  secondary_color: '#64748B',
  accent_color: '#10B981',
  background_color: '#FFFFFF',
  text_color: '#1F2937',
  font_family: 'Inter',
  logo_url: '',
  favicon_url: '',
  custom_css: '',
  is_active: true,
};

export const useBrandingSettings = () => {
  const [settings, setSettings] = useState<BrandingSettings>(defaultBrandingSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchBrandingSettings();
  }, []);

  const fetchBrandingSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('branding_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching branding settings:', error);
        return;
      }

      if (data) {
        setSettings({
          primary_color: data.primary_color || defaultBrandingSettings.primary_color,
          secondary_color: data.secondary_color || defaultBrandingSettings.secondary_color,
          accent_color: data.accent_color || defaultBrandingSettings.accent_color,
          background_color: data.background_color || defaultBrandingSettings.background_color,
          text_color: data.text_color || defaultBrandingSettings.text_color,
          font_family: data.font_family || defaultBrandingSettings.font_family,
          logo_url: data.logo_url || '',
          favicon_url: data.favicon_url || '',
          custom_css: data.custom_css || '',
          is_active: data.is_active !== undefined ? data.is_active : true,
        });
      }
    } catch (error) {
      console.error('Error in fetchBrandingSettings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = async (key: keyof BrandingSettings, value: string | boolean) => {
    try {
      setIsSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const updatedSettings = { ...settings, [key]: value };
      setSettings(updatedSettings);

      const { error } = await supabase
        .from('branding_settings')
        .upsert({
          user_id: user.id,
          ...updatedSettings,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error updating branding settings:', error);
        // Revert the change
        setSettings(settings);
        toast({
          title: "Error",
          description: "Failed to update branding settings",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: "Branding settings updated",
        });
        
        // Apply CSS custom properties to document root
        applyBrandingToDocument(updatedSettings);
      }
    } catch (error) {
      console.error('Error in updateSetting:', error);
      setSettings(settings);
      toast({
        title: "Error",
        description: "Failed to update branding settings",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const applyBrandingToDocument = (brandingSettings: BrandingSettings) => {
    if (!brandingSettings.is_active) return;

    const root = document.documentElement;
    root.style.setProperty('--color-primary', brandingSettings.primary_color);
    root.style.setProperty('--color-secondary', brandingSettings.secondary_color);
    root.style.setProperty('--color-accent', brandingSettings.accent_color);
    root.style.setProperty('--color-background', brandingSettings.background_color);
    root.style.setProperty('--color-text', brandingSettings.text_color);
    root.style.setProperty('--font-family', brandingSettings.font_family);

    // Apply custom CSS if provided
    if (brandingSettings.custom_css) {
      let customStyleElement = document.getElementById('custom-branding-css');
      if (!customStyleElement) {
        customStyleElement = document.createElement('style');
        customStyleElement.id = 'custom-branding-css';
        document.head.appendChild(customStyleElement);
      }
      customStyleElement.textContent = brandingSettings.custom_css;
    }
  };

  const resetToDefaults = async () => {
    try {
      setIsSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setSettings(defaultBrandingSettings);

      const { error } = await supabase
        .from('branding_settings')
        .upsert({
          user_id: user.id,
          ...defaultBrandingSettings,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error resetting branding settings:', error);
        toast({
          title: "Error",
          description: "Failed to reset branding settings",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: "Branding settings reset to defaults",
        });
        
        applyBrandingToDocument(defaultBrandingSettings);
      }
    } catch (error) {
      console.error('Error in resetToDefaults:', error);
      toast({
        title: "Error",
        description: "Failed to reset branding settings",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Apply settings on mount if active
  useEffect(() => {
    if (!isLoading && settings.is_active) {
      applyBrandingToDocument(settings);
    }
  }, [isLoading, settings]);

  return {
    settings,
    isLoading,
    isSaving,
    updateSetting,
    resetToDefaults
  };
};
