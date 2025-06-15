import { supabase } from '@/integrations/supabase/client';
import { GoogleMapsGeocodingResult } from './googleMapsGeocodingService';

export interface GoogleMapsGeocodingResult {
  results: Array<{
    formatted_address: string;
    address_components: Array<{
      long_name: string;
      short_name: string;
      types: string[];
    }>;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
  }>;
  status: string;
}

class GoogleMapsGeocodingService {
  private isServiceConfigured = false;
  private addressCache = new Map<string, { address: string; timestamp: number }>();
  private readonly CACHE_DURATION = 60 * 60 * 1000; // 1 hour

  async initialize(): Promise<void> {
    try {
      // SECURITY FIX: Removed API key loading from localStorage.
      // The client-side service no longer handles API keys.
      console.log('Google Maps service initializing (client-side)...');
    } catch (error) {
      console.error('Failed to initialize Google Maps service:', error);
    }
  }

  // New method to set configuration status from a trusted source
  setIsConfigured(isConfigured: boolean): void {
    this.isServiceConfigured = isConfigured;
    if (isConfigured) {
      console.log('Google Maps has been configured on the backend.');
    }
  }

  isConfigured(): boolean {
    return this.isServiceConfigured;
  }

  async testConnection(): Promise<boolean> {
    if (!this.isConfigured()) {
      throw new Error('Google Maps is not configured.');
    }
    try {
      const { data, error } = await supabase.functions.invoke('geocoding-proxy', {
        body: { provider: 'google-maps', lat: 40.7128, lon: -74.0060, isTest: true },
      });

      if (error) throw error;
      return data.success === true;
    } catch (error) {
      console.error('Google Maps connection test failed via proxy:', error);
      return false;
    }
  }

  async reverseGeocode(lat: number, lon: number): Promise<string> {
    if (!this.isServiceConfigured) {
      return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
    }

    try {
      const { data, error } = await supabase.functions.invoke<GoogleMapsGeocodingResult>('geocoding-proxy', {
        body: { provider: 'google-maps', lat, lon },
      });

      if (error) {
        throw new Error(`Proxy error: ${error.message}`);
      }

      if (data.status !== 'OK' || !data.results || data.results.length === 0) {
        console.warn('Google Maps geocoding returned no results:', data.status);
        throw new Error(`Google Maps API returned status: ${data.status}`);
      }
      
      return this.formatGoogleMapsAddress(data.results[0]);

    } catch (error) {
        console.error('Error reverse geocoding with Google Maps via proxy:', error);
        throw error; // Re-throw to be caught by unified service
    }
  }

  private formatGoogleMapsAddress(result: any): string {
    // Google Maps provides more structured and accurate addresses
    const formattedAddress = result.formatted_address;
    
    // Clean up the address by removing country if it's too long
    const parts = formattedAddress.split(', ');
    if (parts.length > 4) {
      // Keep street, city, state/region, postal code - remove country
      return parts.slice(0, -1).join(', ');
    }
    
    return formattedAddress;
  }

  clearCache(): void {
    this.addressCache.clear();
  }

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

export const googleMapsGeocodingService = new GoogleMapsGeocodingService();
