
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useBranding } from '@/contexts/BrandingContext';

export interface EnhancedBrandingSettings {
  company_name: string;
  tagline: string;
  subtitle: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
  font_family: string;
  logo_url: string;
  favicon_url: string;
  custom_css: string;
  is_branding_active: boolean;
  auth_page_branding: boolean;
}

const defaultSettings: EnhancedBrandingSettings = {
  company_name: 'FleetIQ',
  tagline: 'GPS51 Management Platform',
  subtitle: 'Professional vehicle tracking and management',
  primary_color: '#3B82F6',
  secondary_color: '#64748B',
  accent_color: '#10B981',
  background_color: '#FFFFFF',
  text_color: '#1F2937',
  font_family: 'Inter',
  logo_url: '',
  favicon_url: '',
  custom_css: '',
  is_branding_active: true,
  auth_page_branding: true,
};

// Color validation helper
const isValidHexColor = (color: string): boolean => {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
};

// URL validation helper
const isValidUrl = (url: string): boolean => {
  if (!url) return true; // Empty URLs are valid
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const useEnhancedBrandingSettings = () => {
  const [settings, setSettings] = useState<EnhancedBrandingSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { refreshBranding } = useBranding();

  useEffect(() => {
    fetchBrandingSettings();
  }, []);

  const fetchBrandingSettings = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user');
        return;
      }

      // Remove the is_branding_active filter to load all branding data
      const { data, error } = await supabase
        .from('branding_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching branding settings:', error);
        toast({
          title: "Error",
          description: "Failed to load branding settings",
          variant: "destructive"
        });
        return;
      }

      if (data) {
        // Map database fields to frontend interface
        setSettings({
          company_name: data.company_name || defaultSettings.company_name,
          tagline: data.tagline || defaultSettings.tagline,
          subtitle: data.subtitle || defaultSettings.subtitle,
          primary_color: data.primary_color || defaultSettings.primary_color,
          secondary_color: data.secondary_color || defaultSettings.secondary_color,
          accent_color: data.accent_color || defaultSettings.accent_color,
          background_color: data.background_color || defaultSettings.background_color,
          text_color: data.text_color || defaultSettings.text_color,
          font_family: data.font_family_body || data.font_family_heading || defaultSettings.font_family,
          logo_url: data.logo_url || '',
          favicon_url: data.favicon_url || '',
          custom_css: data.custom_css || '',
          is_branding_active: data.is_branding_active ?? true,
          auth_page_branding: data.auth_page_branding ?? true,
        });
      }
    } catch (error) {
      console.error('Error in fetchBrandingSettings:', error);
      toast({
        title: "Error",
        description: "Failed to load branding settings",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const validateSettings = (key: keyof EnhancedBrandingSettings, value: string | boolean): string | null => {
    // Color validation
    if (key.includes('color') && typeof value === 'string') {
      if (!isValidHexColor(value)) {
        return 'Please enter a valid hex color code (e.g., #3B82F6)';
      }
    }

    // URL validation
    if ((key === 'logo_url' || key === 'favicon_url') && typeof value === 'string') {
      if (!isValidUrl(value)) {
        return 'Please enter a valid URL';
      }
    }

    // Text length validation
    if (typeof value === 'string') {
      if (key === 'company_name' && value.length > 100) {
        return 'Company name must be less than 100 characters';
      }
      if (key === 'tagline' && value.length > 200) {
        return 'Tagline must be less than 200 characters';
      }
      if (key === 'subtitle' && value.length > 500) {
        return 'Subtitle must be less than 500 characters';
      }
    }

    return null;
  };

  const updateSetting = async (key: keyof EnhancedBrandingSettings, value: string | boolean) => {
    // Validate the input
    const validationError = validateSettings(key, value);
    if (validationError) {
      toast({
        title: "Validation Error",
        description: validationError,
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to update settings",
          variant: "destructive"
        });
        return;
      }

      // Update local state immediately for better UX
      const updatedSettings = { ...settings, [key]: value };
      setSettings(updatedSettings);

      // Prepare database payload with correct field mapping
      const dbPayload: any = {
        user_id: user.id,
        company_name: updatedSettings.company_name,
        tagline: updatedSettings.tagline,
        subtitle: updatedSettings.subtitle,
        primary_color: updatedSettings.primary_color,
        secondary_color: updatedSettings.secondary_color,
        accent_color: updatedSettings.accent_color,
        background_color: updatedSettings.background_color,
        text_color: updatedSettings.text_color,
        font_family_body: updatedSettings.font_family,
        font_family_heading: updatedSettings.font_family,
        logo_url: updatedSettings.logo_url,
        favicon_url: updatedSettings.favicon_url,
        custom_css: updatedSettings.custom_css,
        is_branding_active: updatedSettings.is_branding_active,
        auth_page_branding: updatedSettings.auth_page_branding,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('branding_settings')
        .upsert(dbPayload, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error updating branding settings:', error);
        // Revert local state on error
        setSettings(settings);
        toast({
          title: "Error",
          description: `Failed to update branding settings: ${error.message}`,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: "Branding settings updated successfully",
      });
      
      // Refresh branding context to apply changes immediately
      await refreshBranding();
    } catch (error) {
      console.error('Error in updateSetting:', error);
      // Revert local state on error
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

  return {
    settings,
    isLoading,
    isSaving,
    updateSetting,
    refreshBranding
  };
};
