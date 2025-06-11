
import type { EnhancedBrandingSettings } from '@/types/branding-settings';

// Color validation helper
export const isValidHexColor = (color: string): boolean => {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
};

// URL validation helper
export const isValidUrl = (url: string): boolean => {
  if (!url) return true; // Empty URLs are valid
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const validateBrandingSetting = (
  key: keyof EnhancedBrandingSettings, 
  value: string | boolean
): string | null => {
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
