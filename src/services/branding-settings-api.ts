
import { supabase } from '@/integrations/supabase/client';
import type { EnhancedBrandingSettings } from '@/types/branding-settings';
import { defaultBrandingSettings } from '@/types/branding-settings';

export const fetchBrandingSettingsFromDB = async (
  targetUserId: string
): Promise<EnhancedBrandingSettings> => {
  // We still check for an authenticated session to ensure the admin is logged in.
  const { data: { user: adminUser } } = await supabase.auth.getUser();
  if (!adminUser) {
    throw new Error('Admin not authenticated');
  }

  // Fetch settings using the provided targetUserId.
  const { data, error } = await supabase
    .from('branding_settings')
    .select('*')
    .eq('user_id', targetUserId)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  if (data) {
    return {
      company_name: data.company_name || defaultBrandingSettings.company_name,
      tagline: data.tagline || defaultBrandingSettings.tagline,
      subtitle: data.subtitle || defaultBrandingSettings.subtitle,
      primary_color: data.primary_color || defaultBrandingSettings.primary_color,
      secondary_color: data.secondary_color || defaultBrandingSettings.secondary_color,
      accent_color: data.accent_color || defaultBrandingSettings.accent_color,
      background_color: data.background_color || defaultBrandingSettings.background_color,
      text_color: data.text_color || defaultBrandingSettings.text_color,
      font_family: data.font_family_body || data.font_family_heading || defaultBrandingSettings.font_family,
      logo_url: data.logo_url || '',
      favicon_url: data.favicon_url || '',
      custom_css: data.custom_css || '',
      is_branding_active: data.is_branding_active ?? true,
      auth_page_branding: data.auth_page_branding ?? true,
    };
  } else {
    // If no data is found for the user, return default settings.
    return defaultBrandingSettings;
  }
};

export const updateBrandingSettingInDB = async (
  userId: string,
  settings: EnhancedBrandingSettings
): Promise<void> => {
  const { data: { user: adminUser } } = await supabase.auth.getUser();
  if (!adminUser) {
    throw new Error('You must be logged in to update settings.');
  }

  const dbPayload = {
    user_id: userId,
    company_name: settings.company_name,
    tagline: settings.tagline,
    subtitle: settings.subtitle,
    primary_color: settings.primary_color,
    secondary_color: settings.secondary_color,
    accent_color: settings.accent_color,
    background_color: settings.background_color,
    text_color: settings.text_color,
    font_family_body: settings.font_family,
    font_family_heading: settings.font_family,
    logo_url: settings.logo_url,
    favicon_url: settings.favicon_url,
    custom_css: settings.custom_css,
    is_branding_active: settings.is_branding_active,
    auth_page_branding: settings.auth_page_branding,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('branding_settings')
    .upsert(dbPayload, { onConflict: 'user_id' });

  if (error) {
    throw error;
  }
};
