
import { SUPABASE_URL } from '@/integrations/supabase/client';

class MapTilerService {
  private baseUrl = 'https://api.maptiler.com';
  private defaultApiKey = 'YOUR_MAPTILER_API_KEY';

  getMapStyle(): string {
    // Use a basic OpenStreetMap style as fallback
    return 'https://demotiles.maplibre.org/style.json';
  }

  getApiKey(): string {
    return this.defaultApiKey;
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
