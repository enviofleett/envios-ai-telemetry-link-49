
import { ThemeConfig } from './ThemeProvider';

export const validateThemeConfig = (theme: any): ThemeConfig | null => {
  try {
    // Basic structure validation
    if (!theme || typeof theme !== 'object') return null;
    
    // Required fields validation
    const requiredFields = ['id', 'name', 'colors', 'typography', 'layout'];
    for (const field of requiredFields) {
      if (!theme[field]) return null;
    }

    // Colors validation
    const requiredColors = ['primary', 'secondary', 'background', 'text', 'button', 'border', 'accent', 'muted'];
    for (const color of requiredColors) {
      if (!theme.colors[color] || !isValidHexColor(theme.colors[color])) return null;
    }

    // Typography validation
    if (!theme.typography.fontFamily || 
        typeof theme.typography.baseFontSize !== 'number' ||
        typeof theme.typography.headingMultiplier !== 'number' ||
        typeof theme.typography.lineHeight !== 'number') {
      return null;
    }

    // Layout validation
    const validSidebarPositions = ['left', 'right'];
    const validSidebarStyles = ['collapsed', 'expanded', 'floating'];
    const validSpacingScales = ['small', 'medium', 'large'];

    if (!validSidebarPositions.includes(theme.layout.sidebarPosition) ||
        !validSidebarStyles.includes(theme.layout.sidebarStyle) ||
        !validSpacingScales.includes(theme.layout.spacingScale) ||
        typeof theme.layout.cardRadius !== 'number') {
      return null;
    }

    return theme as ThemeConfig;
  } catch (error) {
    console.error('Theme validation error:', error);
    return null;
  }
};

const isValidHexColor = (color: string): boolean => {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
};

export const sanitizeThemeConfig = (theme: Partial<ThemeConfig>): Partial<ThemeConfig> => {
  const sanitized: Partial<ThemeConfig> = {};

  if (theme.id) sanitized.id = theme.id;
  if (theme.name) sanitized.name = theme.name;
  if (typeof theme.darkMode === 'boolean') sanitized.darkMode = theme.darkMode;
  if (theme.customCSS && typeof theme.customCSS === 'string') {
    // Basic CSS sanitization - remove dangerous patterns
    sanitized.customCSS = theme.customCSS
      .replace(/@import/g, '')
      .replace(/javascript:/g, '')
      .replace(/expression\s*\(/g, '');
  }

  // Sanitize colors
  if (theme.colors) {
    sanitized.colors = {
      primary: '',
      secondary: '',
      background: '',
      text: '',
      button: '',
      border: '',
      accent: '',
      muted: ''
    };
    for (const [key, value] of Object.entries(theme.colors)) {
      if (typeof value === 'string' && isValidHexColor(value)) {
        (sanitized.colors as any)[key] = value;
      }
    }
  }

  // Sanitize typography
  if (theme.typography) {
    sanitized.typography = {
      fontFamily: '',
      baseFontSize: 16,
      headingMultiplier: 1.25,
      lineHeight: 1.5
    };
    if (theme.typography.fontFamily) sanitized.typography.fontFamily = theme.typography.fontFamily;
    if (typeof theme.typography.baseFontSize === 'number' && theme.typography.baseFontSize > 10 && theme.typography.baseFontSize < 30) {
      sanitized.typography.baseFontSize = theme.typography.baseFontSize;
    }
    if (typeof theme.typography.headingMultiplier === 'number' && theme.typography.headingMultiplier > 1 && theme.typography.headingMultiplier < 3) {
      sanitized.typography.headingMultiplier = theme.typography.headingMultiplier;
    }
    if (typeof theme.typography.lineHeight === 'number' && theme.typography.lineHeight > 1 && theme.typography.lineHeight < 3) {
      sanitized.typography.lineHeight = theme.typography.lineHeight;
    }
  }

  // Sanitize layout
  if (theme.layout) {
    sanitized.layout = {
      sidebarPosition: 'left',
      sidebarStyle: 'expanded',
      cardRadius: 8,
      spacingScale: 'medium',
      containerMaxWidth: '1200px'
    };
    const validSidebarPositions = ['left', 'right'];
    const validSidebarStyles = ['collapsed', 'expanded', 'floating'];
    const validSpacingScales = ['small', 'medium', 'large'];

    if (validSidebarPositions.includes(theme.layout.sidebarPosition as any)) {
      sanitized.layout.sidebarPosition = theme.layout.sidebarPosition;
    }
    if (validSidebarStyles.includes(theme.layout.sidebarStyle as any)) {
      sanitized.layout.sidebarStyle = theme.layout.sidebarStyle;
    }
    if (validSpacingScales.includes(theme.layout.spacingScale as any)) {
      sanitized.layout.spacingScale = theme.layout.spacingScale;
    }
    if (typeof theme.layout.cardRadius === 'number' && theme.layout.cardRadius >= 0 && theme.layout.cardRadius <= 50) {
      sanitized.layout.cardRadius = theme.layout.cardRadius;
    }
    if (theme.layout.containerMaxWidth) sanitized.layout.containerMaxWidth = theme.layout.containerMaxWidth;
  }

  return sanitized;
};
