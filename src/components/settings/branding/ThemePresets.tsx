
import { ThemeConfig } from './ThemeProvider';

export const themePresets: ThemeConfig[] = [
  {
    id: 'default',
    name: 'Envio Default',
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
  },
  {
    id: 'dark',
    name: 'Dark Professional',
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
    darkMode: true
  },
  {
    id: 'corporate',
    name: 'Corporate Blue',
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
      fontFamily: 'Roboto',
      baseFontSize: 16,
      headingMultiplier: 1.3,
      lineHeight: 1.6
    },
    layout: {
      sidebarPosition: 'left',
      sidebarStyle: 'expanded',
      cardRadius: 12,
      spacingScale: 'large',
      containerMaxWidth: '1400px'
    },
    darkMode: false
  },
  {
    id: 'modern',
    name: 'Modern Minimal',
    colors: {
      primary: '#059669',
      secondary: '#0891b2',
      background: '#fefefe',
      text: '#111827',
      button: '#059669',
      border: '#d1d5db',
      accent: '#047857',
      muted: '#6b7280'
    },
    typography: {
      fontFamily: 'Poppins',
      baseFontSize: 15,
      headingMultiplier: 1.4,
      lineHeight: 1.7
    },
    layout: {
      sidebarPosition: 'left',
      sidebarStyle: 'floating',
      cardRadius: 16,
      spacingScale: 'large',
      containerMaxWidth: '1200px'
    },
    darkMode: false
  }
];
