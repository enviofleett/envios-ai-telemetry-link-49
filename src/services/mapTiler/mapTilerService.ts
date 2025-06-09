
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
  private addressCache = new Map<string, string>();

  async initialize(): Promise<void> {
    try {
      // Get MapTiler API key from Supabase secrets
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.warn('No auth session for MapTiler API key');
        return;
      }

      // For now, we'll use a placeholder - the user will need to set this up
      console.log('MapTiler service initialized');
    } catch (error) {
      console.error('Failed to initialize MapTiler service:', error);
    }
  }

  setApiKey(key: string): void {
    this.apiKey = key;
  }

  getMapStyle(): string {
    if (!this.apiKey) {
      return 'https://api.maptiler.com/maps/streets-v2/style.json?key=demo';
    }
    return `https://api.maptiler.com/maps/streets-v2/style.json?key=${this.apiKey}`;
  }

  async reverseGeocode(lat: number, lon: number): Promise<string> {
    if (!this.apiKey) {
      return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
    }

    const cacheKey = `${lat.toFixed(4)},${lon.toFixed(4)}`;
    
    if (this.addressCache.has(cacheKey)) {
      return this.addressCache.get(cacheKey)!;
    }

    try {
      const response = await fetch(
        `https://api.maptiler.com/geocoding/${lon},${lat}.json?key=${this.apiKey}&limit=1`
      );
      
      if (!response.ok) {
        throw new Error(`Geocoding failed: ${response.status}`);
      }

      const data: ReverseGeocodingResult = await response.json();
      
      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        const address = this.formatAddress(feature);
        this.addressCache.set(cacheKey, address);
        return address;
      }
      
      return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
    }
  }

  private formatAddress(feature: any): string {
    const placeName = feature.place_name || '';
    
    // Extract components from context
    const context = feature.context || [];
    const address = feature.properties?.address || '';
    const name = feature.properties?.name || '';
    
    // Build formatted address with better structure
    const parts = [];
    
    // Add street number and name first
    if (name && !placeName.includes(name)) {
      parts.push(name);
    }
    
    if (address) {
      parts.push(address);
    }
    
    // Add city and region from context
    const place = context.find((c: any) => c.id?.includes('place'));
    const region = context.find((c: any) => c.id?.includes('region'));
    const country = context.find((c: any) => c.id?.includes('country'));
    
    if (place) parts.push(place.text);
    if (region) parts.push(region.text);
    if (country && parts.length > 0) parts.push(country.text);
    
    // If we have structured parts, join them nicely
    if (parts.length > 0) {
      return parts.join(', ');
    }
    
    // Fallback to the raw place name, but clean it up
    const cleanPlaceName = placeName.split(',').slice(0, 3).join(', ');
    return cleanPlaceName || 'Unknown location';
  }

  clearCache(): void {
    this.addressCache.clear();
  }
}

export const mapTilerService = new MapTilerService();
