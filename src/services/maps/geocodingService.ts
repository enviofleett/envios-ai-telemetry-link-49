
export interface GeocodingResult {
  lat: number;
  lng: number;
  formatted_address?: string;
}

export interface ReverseGeocodingResult {
  formatted_address: string;
  address_components: any[];
}

class GeocodingService {
  private apiKey: string;
  private cache: Map<string, any> = new Map();
  private readonly CACHE_DURATION = 60 * 60 * 1000; // 1 hour

  constructor() {
    this.apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '';
    if (!this.apiKey) {
      console.warn('Google Maps API key not found. Geocoding features will not work.');
    }
  }

  private getCacheKey(operation: string, params: string): string {
    return `${operation}:${params}`;
  }

  private getCachedResult<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
      return cached.data;
    }
    if (cached) {
      this.cache.delete(key); // Remove expired cache
    }
    return null;
  }

  private setCachedResult<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Convert an address string to coordinates
   */
  async geocodeAddress(address: string): Promise<GeocodingResult[]> {
    if (!this.apiKey) {
      throw new Error('Google Maps API key is not configured');
    }

    if (!address.trim()) {
      return [];
    }

    const cacheKey = this.getCacheKey('geocode', address);
    const cached = this.getCachedResult<GeocodingResult[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const encodedAddress = encodeURIComponent(address.trim());
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${this.apiKey}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.status === 'OK' && data.results && data.results.length > 0) {
        const results: GeocodingResult[] = data.results.map((result: any) => ({
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng,
          formatted_address: result.formatted_address
        }));

        this.setCachedResult(cacheKey, results);
        return results;
      } else if (data.status === 'ZERO_RESULTS') {
        this.setCachedResult(cacheKey, []);
        return [];
      } else {
        throw new Error(`Geocoding failed: ${data.status} - ${data.error_message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to geocode address');
    }
  }

  /**
   * Convert coordinates to a formatted address
   */
  async reverseGeocodeCoordinates(lat: number, lng: number): Promise<string | null> {
    if (!this.apiKey) {
      console.warn('Google Maps API key is not configured');
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`; // Return coordinates as fallback
    }

    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
      return null;
    }

    const cacheKey = this.getCacheKey('reverse', `${lat},${lng}`);
    const cached = this.getCachedResult<string>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${this.apiKey}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.status === 'OK' && data.results && data.results.length > 0) {
        const address = data.results[0].formatted_address;
        this.setCachedResult(cacheKey, address);
        return address;
      } else if (data.status === 'ZERO_RESULTS') {
        const fallback = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        this.setCachedResult(cacheKey, fallback);
        return fallback;
      } else {
        throw new Error(`Reverse geocoding failed: ${data.status} - ${data.error_message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      // Return coordinates as fallback
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  }

  /**
   * Get detailed reverse geocoding result with address components
   */
  async reverseGeocodeDetailed(lat: number, lng: number): Promise<ReverseGeocodingResult | null> {
    if (!this.apiKey) {
      throw new Error('Google Maps API key is not configured');
    }

    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
      return null;
    }

    const cacheKey = this.getCacheKey('reverse_detailed', `${lat},${lng}`);
    const cached = this.getCachedResult<ReverseGeocodingResult>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${this.apiKey}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.status === 'OK' && data.results && data.results.length > 0) {
        const result: ReverseGeocodingResult = {
          formatted_address: data.results[0].formatted_address,
          address_components: data.results[0].address_components
        };
        
        this.setCachedResult(cacheKey, result);
        return result;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Detailed reverse geocoding error:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to reverse geocode coordinates');
    }
  }

  /**
   * Clear the geocoding cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Export singleton instance
export const geocodingService = new GeocodingService();
