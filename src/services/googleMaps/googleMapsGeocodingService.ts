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
      throw new Error('No API key configured on the backend.');
    }
    // This will be updated to call a proxied endpoint.
    console.warn('testConnection is temporarily disabled until geocoding proxy is implemented.');
    return false;
  }

  async reverseGeocode(lat: number, lon: number): Promise<string> {
    if (!this.isServiceConfigured) {
      return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
    }

    // NOTE: This will be updated to call the secure geocoding proxy edge function.
    // This will fail for now, which is an expected part of the security transition.
    console.warn('reverseGeocode is temporarily disabled until geocoding proxy is implemented.');
    throw new Error('Geocoding is temporarily unavailable while security is being upgraded.');
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
