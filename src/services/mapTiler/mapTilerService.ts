
import { SUPABASE_URL } from '@/integrations/supabase/client';

class MapTilerService {
  private baseUrl = 'https://api.maptiler.com';
  private defaultApiKey = 'YOUR_MAPTILER_API_KEY';
  private configured = false;
  private cache = new Map<string, any>();

  async initialize(): Promise<void> {
    // Initialize the service
    console.log('MapTiler service initialized');
    this.configured = true;
  }

  getMapStyle(): string {
    // Use a basic OpenStreetMap style as fallback
    return 'https://demotiles.maplibre.org/style.json';
  }

  getApiKey(): string {
    return this.defaultApiKey;
  }

  isConfigured(): boolean {
    return this.configured;
  }

  setIsConfigured(configured: boolean): void {
    this.configured = configured;
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/maps/streets/style.json?key=${this.getApiKey()}`);
      if (!response.ok) {
        console.error(`MapTiler connection test failed: ${response.status}`);
        return false;
      }
      return true;
    } catch (error) {
      console.error('MapTiler connection test failed:', error);
      return false;
    }
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  async geocode(address: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/geocoding/${encodeURIComponent(address)}.json?key=${this.getApiKey()}`);
      return await response.json();
    } catch (error) {
      console.error('Geocoding failed:', error);
      throw error;
    }
  }

  async reverseGeocode(lat: number, lng: number): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/geocoding/${lng},${lat}.json?key=${this.getApiKey()}`);
      return await response.json();
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      throw error;
    }
  }
}

export const mapTilerService = new MapTilerService();
