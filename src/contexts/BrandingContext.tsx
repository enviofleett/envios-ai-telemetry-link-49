
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

export interface BrandingContextType {
  companyName: string;
  tagline: string;
  subtitle: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  isBrandingActive: boolean;
  authPageBranding: boolean;
  isLoading: boolean;
  refreshBranding: () => Promise<void>;
}

const defaultBranding: BrandingContextType = {
  companyName: 'FleetIQ',
  tagline: 'GPS51 Management Platform',
  subtitle: 'Professional vehicle tracking and management',
  logoUrl: '',
  primaryColor: '#3B82F6',
  secondaryColor: '#64748B',
  accentColor: '#10B981',
  backgroundColor: '#FFFFFF',
  textColor: '#1F2937',
  fontFamily: 'Inter',
  isBrandingActive: true,
  authPageBranding: true,
  isLoading: false,
  refreshBranding: async () => {},
};

const BrandingContext = createContext<BrandingContextType>(defaultBranding);

export const useBranding = () => {
  const context = useContext(BrandingContext);
  if (!context) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
};

interface BrandingProviderProps {
  children: ReactNode;
}

export const BrandingProvider: React.FC<BrandingProviderProps> = ({ children }) => {
  const [branding, setBranding] = useState<BrandingContextType>(defaultBranding);
  const { user } = useAuth();

  const fetchBranding = async () => {
    if (!user?.id) {
      setBranding(prev => ({ ...prev, isLoading: false }));
      return;
    }

    setBranding(prev => ({ ...prev, isLoading: true }));

    try {
      // Remove the is_branding_active filter to always load branding data
      const { data, error } = await supabase
        .from('branding_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching branding:', error);
        setBranding(prev => ({ ...prev, isLoading: false }));
        return;
      }

      if (data) {
        setBranding({
          companyName: data.company_name || defaultBranding.companyName,
          tagline: data.tagline || defaultBranding.tagline,
          subtitle: data.subtitle || defaultBranding.subtitle,
          logoUrl: data.logo_url || '',
          primaryColor: data.primary_color || defaultBranding.primaryColor,
          secondaryColor: data.secondary_color || defaultBranding.secondaryColor,
          accentColor: data.accent_color || defaultBranding.accentColor,
          backgroundColor: data.background_color || defaultBranding.backgroundColor,
          textColor: data.text_color || defaultBranding.textColor,
          fontFamily: data.font_family_body || data.font_family_heading || defaultBranding.fontFamily,
          isBrandingActive: data.is_branding_active ?? true,
          authPageBranding: data.auth_page_branding ?? true,
          isLoading: false,
          refreshBranding: fetchBranding,
        });
      } else {
        setBranding(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('Error in fetchBranding:', error);
      setBranding(prev => ({ ...prev, isLoading: false }));
    }
  };

  useEffect(() => {
    fetchBranding();
  }, [user?.id]);

  // Apply CSS custom properties when branding changes and is active
  useEffect(() => {
    if (branding.isBrandingActive) {
      const root = document.documentElement;
      root.style.setProperty('--color-primary', branding.primaryColor);
      root.style.setProperty('--color-secondary', branding.secondaryColor);
      root.style.setProperty('--color-accent', branding.accentColor);
      root.style.setProperty('--color-background', branding.backgroundColor);
      root.style.setProperty('--color-text', branding.textColor);
      root.style.setProperty('--font-family', branding.fontFamily);
    } else {
      // Reset to default values when branding is disabled
      const root = document.documentElement;
      root.style.setProperty('--color-primary', defaultBranding.primaryColor);
      root.style.setProperty('--color-secondary', defaultBranding.secondaryColor);
      root.style.setProperty('--color-accent', defaultBranding.accentColor);
      root.style.setProperty('--color-background', defaultBranding.backgroundColor);
      root.style.setProperty('--color-text', defaultBranding.textColor);
      root.style.setProperty('--font-family', defaultBranding.fontFamily);
    }
  }, [branding]);

  return (
    <BrandingContext.Provider value={branding}>
      {children}
    </BrandingContext.Provider>
  );
};
