
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
  private apiKey: string | null = null;
  private addressCache = new Map<string, { address: string; timestamp: number }>();
  private readonly CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds
  private readonly STORAGE_KEY = 'maptiler_api_key';
  private isInitialized = false;

  async initialize(): Promise<void> {
    try {
      // First try to restore from localStorage
      const storedKey = localStorage.getItem(this.STORAGE_KEY);
      if (storedKey) {
        this.apiKey = storedKey;
        console.log('MapTiler API key restored from localStorage');
        
        // Validate the stored key with a quick test
        try {
          await this.testConnection();
          this.isInitialized = true;
          console.log('MapTiler service initialized with stored key');
          return;
        } catch (error) {
          console.warn('Stored MapTiler key is invalid, clearing:', error);
          localStorage.removeItem(this.STORAGE_KEY);
          this.apiKey = null;
        }
      }

      // Try to get from Supabase if authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log('Attempting to load MapTiler config from Supabase...');
      }

      this.isInitialized = true;
      console.log('MapTiler service initialized');
    } catch (error) {
      console.error('Failed to initialize MapTiler service:', error);
      this.isInitialized = true; // Don't block the app
    }
  }

  setApiKey(key: string): void {
    this.apiKey = key;
    // Persist to localStorage for page refresh survival
    localStorage.setItem(this.STORAGE_KEY, key);
    console.log('MapTiler API key set and persisted');
  }

  getApiKey(): string | null {
    return this.apiKey;
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async testConnection(): Promise<boolean> {
    if (!this.apiKey) {
      throw new Error('No API key configured');
    }

    try {
      // Test with a simple geocoding request to New York
      const testAddress = await this.reverseGeocode(40.7128, -74.0060);
      console.log('MapTiler connection test successful:', testAddress);
      return true;
    } catch (error) {
      console.error('MapTiler connection test failed:', error);
      throw error;
    }
  }

  getMapStyle(): string {
    if (!this.apiKey) {
      return 'https://api.maptiler.com/maps/streets-v2/style.json?key=demo';
    }
    return `https://api.maptiler.com/maps/streets-v2/style.json?key=${this.apiKey}`;
  }

  async reverseGeocode(lat: number, lon: number): Promise<string> {
    if (!this.apiKey) {
      return this.formatCoordinates(lat, lon);
    }

    const cacheKey = `${lat.toFixed(4)},${lon.toFixed(4)}`;
    
    // Check cache with timestamp
    const cached = this.addressCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
      return cached.address;
    }

    try {
      const response = await fetch(
        `https://api.maptiler.com/geocoding/${lon},${lat}.json?key=${this.apiKey}&limit=1&language=en`
      );
      
      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Rate limit exceeded');
        } else if (response.status === 401) {
          throw new Error('Invalid API key');
        }
        throw new Error(`Geocoding failed: ${response.status}`);
      }

      const data: ReverseGeocodingResult = await response.json();
      
      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        const address = this.formatAddress(feature);
        
        // Cache with timestamp
        this.addressCache.set(cacheKey, {
          address,
          timestamp: Date.now()
        });
        
        return address;
      }
      
      return this.formatCoordinates(lat, lon);
    } catch (error) {
      console.error('MapTiler reverse geocoding error:', error);
      
      // Return cached address if available, even if expired
      if (cached) {
        return cached.address;
      }
      
      return this.formatCoordinates(lat, lon);
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
    localStorage.removeItem(this.STORAGE_KEY);
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
