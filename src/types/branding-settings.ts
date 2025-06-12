
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

export const defaultBrandingSettings: EnhancedBrandingSettings = {
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
