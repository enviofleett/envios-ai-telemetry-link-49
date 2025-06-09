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
  private apiKey: string | null = null;
  private addressCache = new Map<string, { address: string; timestamp: number }>();
  private readonly CACHE_DURATION = 60 * 60 * 1000; // 1 hour
  private readonly STORAGE_KEY = 'google_maps_api_key';

  async initialize(): Promise<void> {
    try {
      // Restore from localStorage
      const storedKey = localStorage.getItem(this.STORAGE_KEY);
      if (storedKey) {
        this.apiKey = storedKey;
        console.log('Google Maps API key restored from localStorage');
        
        // Validate the stored key
        try {
          await this.testConnection();
          console.log('Google Maps service initialized with stored key');
          return;
        } catch (error) {
          console.warn('Stored Google Maps key is invalid, clearing:', error);
          localStorage.removeItem(this.STORAGE_KEY);
          this.apiKey = null;
        }
      }
      
      console.log('Google Maps service initialized');
    } catch (error) {
      console.error('Failed to initialize Google Maps service:', error);
    }
  }

  setApiKey(key: string): void {
    this.apiKey = key;
    localStorage.setItem(this.STORAGE_KEY, key);
    console.log('Google Maps API key set and persisted');
  }

  getApiKey(): string | null {
    return this.apiKey;
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async testConnection(): Promise<boolean> {
    if (!this.apiKey) {
      throw new Error('No Google Maps API key configured');
    }

    try {
      // Test with a simple geocoding request to New York
      const testAddress = await this.reverseGeocode(40.7128, -74.0060);
      console.log('Google Maps connection test successful:', testAddress);
      return true;
    } catch (error) {
      console.error('Google Maps connection test failed:', error);
      throw error;
    }
  }

  async reverseGeocode(lat: number, lon: number): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Google Maps API key not configured');
    }

    const cacheKey = `gm_${lat.toFixed(4)},${lon.toFixed(4)}`;
    
    // Check cache
    const cached = this.addressCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
      return cached.address;
    }

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${this.apiKey}&result_type=street_address|route|neighborhood|locality`
      );

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Google Maps rate limit exceeded');
        } else if (response.status === 403) {
          throw new Error('Google Maps API key invalid or quota exceeded');
        }
        throw new Error(`Google Maps geocoding failed: ${response.status}`);
      }

      const data: GoogleMapsGeocodingResult = await response.json();

      if (data.status === 'OK' && data.results && data.results.length > 0) {
        const result = data.results[0];
        const address = this.formatGoogleMapsAddress(result);
        
        // Cache the result
        this.addressCache.set(cacheKey, {
          address,
          timestamp: Date.now()
        });
        
        return address;
      } else if (data.status === 'ZERO_RESULTS') {
        const coords = `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
        this.addressCache.set(cacheKey, {
          address: coords,
          timestamp: Date.now()
        });
        return coords;
      } else {
        throw new Error(`Google Maps API error: ${data.status}`);
      }
    } catch (error) {
      console.error('Google Maps reverse geocoding error:', error);
      
      // Return cached address if available
      if (cached) {
        return cached.address;
      }
      
      throw error;
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

  clearApiKey(): void {
    this.apiKey = null;
    localStorage.removeItem(this.STORAGE_KEY);
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
