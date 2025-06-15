import { supabase, SUPABASE_URL } from '@/integrations/supabase/client';

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
      throw new Error('MapTiler is not configured.');
    }
    try {
      const { data, error } = await supabase.functions.invoke('geocoding-proxy', {
        body: { provider: 'maptiler', lat: 48.8566, lon: 2.3522, isTest: true }, // Paris coordinates
      });

      if (error) throw error;
      return data.success === true;
    } catch (error) {
      console.error('MapTiler connection test failed via proxy:', error);
      return false;
    }
  }

  getMapStyle(): string {
    // If configured, provide the style URL which will be handled by the map-proxy edge function.
    if (this.isConfigured()) {
      const functionUrl = `${SUPABASE_URL}/functions/v1/map-proxy`;
      // The path requested here will be forwarded by the proxy to MapTiler
      return `${functionUrl}/maps/streets-v2/style.json`;
    }
    // Fallback to a keyless/demo style if not configured.
    // This will NOT be proxied and will be watermarked.
    return `https://api.maptiler.com/maps/streets-v2/style.json?key=get-your-own-dataviz-key`;
  }

  async reverseGeocode(lat: number, lon: number): Promise<string> {
    if (!this.isConfigured()) {
      return this.formatCoordinates(lat, lon);
    }
    
    try {
      const { data, error } = await supabase.functions.invoke<ReverseGeocodingResult>('geocoding-proxy', {
        body: { provider: 'maptiler', lat, lon },
      });

      if (error) {
        throw new Error(`Proxy error: ${error.message}`);
      }

      if (!data.features || data.features.length === 0) {
        console.warn('MapTiler geocoding returned no results');
        throw new Error('MapTiler API returned no features.');
      }
      
      return this.formatAddress(data.features[0]);

    } catch (error) {
        console.error('Error reverse geocoding with MapTiler via proxy:', error);
        throw error; // Re-throw to be caught by unified service
    }
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
