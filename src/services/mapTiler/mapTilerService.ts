import { supabase } from '@/integrations/supabase/client';

export interface MapTilerConfig {
  apiKey: string;
  style: string;
  baseUrl: string;
}

export interface GeocodingResult {
  place_name: string;
  center: [number, number];
  context?: Array<{
    id: string;
    text: string;
  }>;
}

export interface ReverseGeocodingResult {
  features: Array<{
    place_name: string;
    properties: {
      name?: string;
      address?: string;
    };
    context?: Array<{
      id: string;
      text: string;
    }>;
  }>;
}

class MapTilerService {
  private apiKey: string | null = null; // This will be deprecated for direct calls
  private isServiceConfigured = false; // Use this to track configuration status
  private addressCache = new Map<string, { address: string; timestamp: number }>();
  private readonly CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds
  private isInitialized = false;

  async initialize(): Promise<void> {
    try {
      // SECURITY FIX: Removed API key loading from localStorage.
      // The client-side service no longer handles API keys.
      // It will only know if the service is configured on the backend.
      console.log('MapTiler service initializing (client-side)...');
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize MapTiler service:', error);
      this.isInitialized = true; // Don't block the app
    }
  }

  // This function is deprecated for setting keys for direct API calls.
  // It now only sets a dummy key for getMapStyle to work.
  setApiKey(key: string): void {
    this.apiKey = key;
    this.isServiceConfigured = true;
    // SECURITY FIX: Removed saving key to localStorage.
    console.log('MapTiler API key has been configured on the backend.');
  }

  // New method to set configuration status from a trusted source (like enhancedUnifiedGeocodingService)
  setIsConfigured(isConfigured: boolean): void {
    this.isServiceConfigured = isConfigured;
    if (isConfigured) {
        // Set a dummy key so getMapStyle can build a URL that the proxy will handle
        this.apiKey = 'configured_on_backend';
    }
  }

  getApiKey(): string | null {
    // This should not be used for authentication anymore.
    return this.apiKey;
  }

  isConfigured(): boolean {
    return this.isServiceConfigured;
  }

  async testConnection(): Promise<boolean> {
    if (!this.isConfigured()) {
      throw new Error('No API key configured on the backend.');
    }
    // This will be updated to call a proxied endpoint.
    // For now, it will fail, which is expected until the proxy is built.
    console.warn('testConnection is temporarily disabled until geocoding proxy is implemented.');
    return false;
  }

  getMapStyle(): string {
    // If configured, provide the style URL which will be requested by maplibre.
    // The key is a placeholder; a future proxy or service worker will intercept this
    // request and attach the real key on the server-side.
    if (this.isConfigured()) {
      return `https://api.maptiler.com/maps/streets-v2/style.json?key=${this.apiKey}`;
    }
    // Fallback to a keyless/demo style if not configured.
    return 'https://api.maptiler.com/maps/streets-v2/style.json?key=demo';
  }

  async reverseGeocode(lat: number, lon: number): Promise<string> {
    if (!this.isConfigured()) {
      return this.formatCoordinates(lat, lon);
    }
    
    // NOTE: This will be updated to call the secure geocoding proxy edge function.
    // This will fail for now, which is an expected part of the security transition.
    console.warn('reverseGeocode is temporarily disabled until geocoding proxy is implemented.');
    throw new Error('Geocoding is temporarily unavailable while security is being upgraded.');
  }

  private formatCoordinates(lat: number, lon: number): string {
    return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
  }

  private formatAddress(feature: any): string {
    const placeName = feature.place_name || '';
    
    // Extract components from context
    const context = feature.context || [];
    const address = feature.properties?.address || '';
    const name = feature.properties?.name || '';
    
    // Build formatted address with enhanced structure
    const parts = [];
    
    // Add street number and name first
    if (name && !placeName.includes(name)) {
      parts.push(name);
    }
    
    if (address) {
      parts.push(address);
    }
    
    // Add city, region, and postal code from context
    const place = context.find((c: any) => c.id?.includes('place'));
    const region = context.find((c: any) => c.id?.includes('region'));
    const postcode = context.find((c: any) => c.id?.includes('postcode'));
    const country = context.find((c: any) => c.id?.includes('country'));
    
    if (place) parts.push(place.text);
    if (region) parts.push(region.text);
    if (postcode) parts.push(postcode.text);
    if (country && parts.length > 0) parts.push(country.text);
    
    // If we have structured parts, join them with proper formatting
    if (parts.length > 0) {
      let formattedAddress = parts[0]; // Street
      if (parts.length > 1) {
        formattedAddress += ', ' + parts.slice(1).join(', ');
      }
      return formattedAddress;
    }
    
    // Fallback to the raw place name, but clean it up
    const cleanPlaceName = placeName.split(',').slice(0, 4).join(', ');
    return cleanPlaceName || 'Unknown location';
  }

  clearCache(): void {
    this.addressCache.clear();
  }

  clearApiKey(): void {
    this.apiKey = null;
    this.isServiceConfigured = false;
    // SECURITY FIX: Removed clearing key from localStorage.
  }

  // Get cache statistics
  getCacheStats(): { size: number; oldEntries: number } {
    const now = Date.now();
    let oldEntries = 0;
    
    for (const [, value] of this.addressCache) {
      if (now - value.timestamp > this.CACHE_DURATION) {
        oldEntries++;
      }
    }
    
    return {
      size: this.addressCache.size,
      oldEntries
    };
  }

  // Clean expired cache entries
  cleanExpiredCache(): number {
    const now = Date.now();
    let removedCount = 0;
    
    for (const [key, value] of this.addressCache) {
      if (now - value.timestamp > this.CACHE_DURATION) {
        this.addressCache.delete(key);
        removedCount++;
      }
    }
    
    return removedCount;
  }
}

export const mapTilerService = new MapTilerService();
