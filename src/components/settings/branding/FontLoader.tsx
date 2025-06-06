
import { useEffect } from 'react';

const GOOGLE_FONTS = [
  'Inter:wght@300;400;500;600;700;800',
  'Roboto:wght@300;400;500;700',
  'Poppins:wght@300;400;500;600;700',
  'Open+Sans:wght@300;400;500;600;700',
  'Montserrat:wght@300;400;500;600;700',
  'Source+Sans+Pro:wght@300;400;600;700'
];

export const FontLoader: React.FC = () => {
  useEffect(() => {
    // Check if fonts are already loaded
    const existingFontLink = document.querySelector('link[href*="fonts.googleapis.com"]');
    if (existingFontLink) return;

    // Create and inject Google Fonts link
    const fontUrl = `https://fonts.googleapis.com/css2?${GOOGLE_FONTS.map(font => `family=${font}`).join('&')}&display=swap`;
    
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = fontUrl;
    link.crossOrigin = 'anonymous';
    
    document.head.appendChild(link);

    // Preload critical fonts for better performance
    const preloadFonts = ['Inter', 'Roboto'];
    preloadFonts.forEach(font => {
      const preloadLink = document.createElement('link');
      preloadLink.rel = 'preload';
      preloadLink.as = 'font';
      preloadLink.type = 'font/woff2';
      preloadLink.crossOrigin = 'anonymous';
      preloadLink.href = `https://fonts.gstatic.com/s/${font.toLowerCase()}/v12/${font.toLowerCase()}-regular.woff2`;
      document.head.appendChild(preloadLink);
    });

    return () => {
      // Cleanup on unmount
      const links = document.querySelectorAll('link[href*="fonts.googleapis.com"], link[href*="fonts.gstatic.com"]');
      links.forEach(link => link.remove());
    };
  }, []);

  return null;
};
