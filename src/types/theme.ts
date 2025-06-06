
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

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  config: Omit<ThemeConfig, 'id' | 'name'>;
  isDefault?: boolean;
}

export const defaultThemeConfig: ThemeConfig = {
  id: 'default',
  name: 'Default Theme',
  colors: {
    primary: '#0066cc',
    secondary: '#6366f1',
    background: '#ffffff',
    text: '#1f2937',
    button: '#0066cc',
    border: '#e5e7eb',
    accent: '#0052a3',
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

export const themePresets: ThemePreset[] = [
  {
    id: 'default',
    name: 'Default',
    description: 'Clean and professional default theme',
    config: defaultThemeConfig,
    isDefault: true
  },
  {
    id: 'dark',
    name: 'Dark',
    description: 'Modern dark theme for low-light environments',
    config: {
      ...defaultThemeConfig,
      colors: {
        primary: '#3b82f6',
        secondary: '#8b5cf6',
        background: '#0f172a',
        text: '#f8fafc',
        button: '#3b82f6',
        border: '#374151',
        accent: '#2563eb',
        muted: '#9ca3af'
      },
      darkMode: true
    }
  },
  {
    id: 'light',
    name: 'Light',
    description: 'Bright and airy light theme',
    config: {
      ...defaultThemeConfig,
      colors: {
        primary: '#059669',
        secondary: '#0891b2',
        background: '#fefefe',
        text: '#111827',
        button: '#059669',
        border: '#d1d5db',
        accent: '#047857',
        muted: '#6b7280'
      }
    }
  },
  {
    id: 'corporate',
    name: 'Corporate',
    description: 'Professional corporate theme',
    config: {
      ...defaultThemeConfig,
      colors: {
        primary: '#1e40af',
        secondary: '#7c3aed',
        background: '#f8fafc',
        text: '#0f172a',
        button: '#1e40af',
        border: '#cbd5e1',
        accent: '#1d4ed8',
        muted: '#64748b'
      },
      typography: {
        ...defaultThemeConfig.typography,
        fontFamily: 'Roboto'
      }
    }
  }
];
