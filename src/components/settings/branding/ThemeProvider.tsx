
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  button: string;
  border: string;
  accent: string;
  muted: string;
}

export interface ThemeTypography {
  fontFamily: string;
  baseFontSize: number;
  headingMultiplier: number;
  lineHeight: number;
}

export interface ThemeLayout {
  sidebarPosition: 'left' | 'right';
  sidebarStyle: 'collapsed' | 'expanded' | 'floating';
  cardRadius: number;
  spacingScale: 'small' | 'medium' | 'large';
  containerMaxWidth: string;
}

export interface ThemeConfig {
  id: string;
  name: string;
  colors: ThemeColors;
  typography: ThemeTypography;
  layout: ThemeLayout;
  darkMode: boolean;
  customCSS?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ThemeContextType {
  currentTheme: ThemeConfig;
  setTheme: (theme: ThemeConfig) => Promise<void>;
  applyTheme: (theme: ThemeConfig) => void;
  resetTheme: () => void;
  isLoading: boolean;
  saveTheme: (theme: ThemeConfig) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

const defaultThemeConfig: ThemeConfig = {
  id: 'default',
  name: 'Default Theme',
  colors: {
    primary: '#3b82f6',
    secondary: '#6366f1',
    background: '#ffffff',
    text: '#1f2937',
    button: '#3b82f6',
    border: '#e5e7eb',
    accent: '#2563eb',
    muted: '#6b7280'
  },
  typography: {
    fontFamily: 'Inter',
    baseFontSize: 16,
    headingMultiplier: 1.25,
    lineHeight: 1.5
  },
  layout: {
    sidebarPosition: 'left',
    sidebarStyle: 'expanded',
    cardRadius: 8,
    spacingScale: 'medium',
    containerMaxWidth: '1200px'
  },
  darkMode: false
};

// Convert hex to HSL for CSS variables
const hexToHsl = (hex: string): string => {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<ThemeConfig>(defaultThemeConfig);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const applyTheme = (theme: ThemeConfig) => {
    const root = document.documentElement;
    
    // Apply color variables to CSS custom properties
    root.style.setProperty('--primary', hexToHsl(theme.colors.primary));
    root.style.setProperty('--secondary', hexToHsl(theme.colors.secondary));
    root.style.setProperty('--background', hexToHsl(theme.colors.background));
    root.style.setProperty('--foreground', hexToHsl(theme.colors.text));
    root.style.setProperty('--border', hexToHsl(theme.colors.border));
    root.style.setProperty('--accent', hexToHsl(theme.colors.accent));
    root.style.setProperty('--muted', hexToHsl(theme.colors.muted));

    // Apply theme-specific variables
    root.style.setProperty('--theme-primary', theme.colors.primary);
    root.style.setProperty('--theme-secondary', theme.colors.secondary);
    root.style.setProperty('--theme-background', theme.colors.background);
    root.style.setProperty('--theme-text', theme.colors.text);
    root.style.setProperty('--theme-border', theme.colors.border);
    root.style.setProperty('--theme-accent', theme.colors.accent);
    root.style.setProperty('--theme-muted', theme.colors.muted);

    // Apply typography variables
    root.style.setProperty('--theme-font-family', theme.typography.fontFamily);
    root.style.setProperty('--theme-font-size', `${theme.typography.baseFontSize}px`);
    root.style.setProperty('--theme-heading-multiplier', theme.typography.headingMultiplier.toString());
    root.style.setProperty('--theme-line-height', theme.typography.lineHeight.toString());

    // Apply layout variables
    root.style.setProperty('--theme-card-radius', `${theme.layout.cardRadius}px`);
    root.style.setProperty('--theme-container-max-width', theme.layout.containerMaxWidth);

    // Apply spacing scale
    const spacingValues = {
      small: '0.75',
      medium: '1',
      large: '1.25'
    };
    root.style.setProperty('--theme-spacing-scale', spacingValues[theme.layout.spacingScale]);

    // Apply font family to body
    document.body.style.fontFamily = `${theme.typography.fontFamily}, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;

    // Handle dark mode
    if (theme.darkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }

    // Apply custom CSS if provided
    if (theme.customCSS) {
      let customStyleEl = document.getElementById('custom-theme-styles');
      if (!customStyleEl) {
        customStyleEl = document.createElement('style');
        customStyleEl.id = 'custom-theme-styles';
        document.head.appendChild(customStyleEl);
      }
      customStyleEl.textContent = theme.customCSS;
    }

    setCurrentTheme(theme);
  };

  const saveTheme = async (theme: ThemeConfig) => {
    setIsLoading(true);
    try {
      // Save to local storage as backup
      localStorage.setItem('envio-theme', JSON.stringify(theme));
      
      // Save to Supabase for persistence across devices
      const { error } = await supabase
        .from('theme_settings')
        .upsert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          theme_data: theme,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.warn('Failed to save theme to backend:', error);
        // Continue with local storage only
      }

      applyTheme(theme);
      
      toast({
        title: "Theme Saved",
        description: "Your theme settings have been saved successfully."
      });
    } catch (error) {
      console.error('Failed to save theme:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save theme settings. Using local storage only.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const setTheme = async (theme: ThemeConfig) => {
    await saveTheme(theme);
  };

  const resetTheme = () => {
    localStorage.removeItem('envio-theme');
    applyTheme(defaultThemeConfig);
    toast({
      title: "Theme Reset",
      description: "Theme has been reset to default settings."
    });
  };

  // Load saved theme on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        // Try to load from Supabase first
        const { data: user } = await supabase.auth.getUser();
        if (user.user) {
          const { data, error } = await supabase
            .from('theme_settings')
            .select('theme_data')
            .eq('user_id', user.user.id)
            .single();

          if (data && !error) {
            applyTheme(data.theme_data);
            return;
          }
        }

        // Fallback to local storage
        const savedTheme = localStorage.getItem('envio-theme');
        if (savedTheme) {
          const theme = JSON.parse(savedTheme);
          applyTheme(theme);
        } else {
          applyTheme(defaultThemeConfig);
        }
      } catch (error) {
        console.error('Failed to load saved theme:', error);
        applyTheme(defaultThemeConfig);
      }
    };

    loadTheme();
  }, []);

  return (
    <ThemeContext.Provider value={{
      currentTheme,
      setTheme,
      applyTheme,
      resetTheme,
      isLoading,
      saveTheme
    }}>
      {children}
    </ThemeContext.Provider>
  );
};
