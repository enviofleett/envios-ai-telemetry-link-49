
import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeConfig, defaultThemeConfig } from '@/types/theme';

interface ThemeContextType {
  currentTheme: ThemeConfig;
  setTheme: (theme: ThemeConfig) => void;
  applyTheme: (theme: ThemeConfig) => void;
  resetTheme: () => void;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<ThemeConfig>(defaultThemeConfig);
  const [isLoading, setIsLoading] = useState(false);

  const applyTheme = (theme: ThemeConfig) => {
    const root = document.documentElement;
    
    // Apply color variables
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--theme-${key}`, value);
    });

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

    // Handle dark mode
    if (theme.darkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }

    setCurrentTheme(theme);
  };

  const setTheme = async (theme: ThemeConfig) => {
    setIsLoading(true);
    try {
      // In a real app, this would save to backend
      localStorage.setItem('envio-theme', JSON.stringify(theme));
      applyTheme(theme);
    } catch (error) {
      console.error('Failed to save theme:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetTheme = () => {
    localStorage.removeItem('envio-theme');
    applyTheme(defaultThemeConfig);
  };

  // Load saved theme on mount
  useEffect(() => {
    try {
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
  }, []);

  return (
    <ThemeContext.Provider value={{
      currentTheme,
      setTheme,
      applyTheme,
      resetTheme,
      isLoading
    }}>
      {children}
    </ThemeContext.Provider>
  );
};
