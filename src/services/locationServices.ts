
import { supabase } from '@/integrations/supabase/client';

class LocationServices {
  private apiKey: string | null = null;

  async getApiKey() {
    if (!this.apiKey) {
      try {
        const { data, error } = await supabase.functions.invoke('map-management', {
          body: { action: 'get-active-key' }
        });
        
        if (error) throw error;
        this.apiKey = data.apiKey;
      } catch (error) {
        console.error('Failed to get MapTiler API key:', error);
        throw error;
      }
    }
    return this.apiKey;
  }

  async geocodeAddress(address: string): Promise<GeocodingResult[]> {
    try {
      const apiKey = await this.getApiKey();
      const response = await fetch(
        `https://api.maptiler.com/geocoding/${encodeURIComponent(address)}.json?key=${apiKey}`
      );
      
      if (!response.ok) throw new Error('Geocoding failed');
      
      const data = await response.json();
      
      return data.features.map((feature: any) => ({
        coordinates: {
          lat: feature.center[1],
          lng: feature.center[0]
        },
        address: feature.place_name,
        confidence: feature.relevance || 0
      }));
    } catch (error) {
      console.error('Geocoding error:', error);
      return [];
    }
  }

  async reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
      const apiKey = await this.getApiKey();
      const response = await fetch(
        `https://api.maptiler.com/geocoding/${lng},${lat}.json?key=${apiKey}`
      );
      
      if (!response.ok) throw new Error('Reverse geocoding failed');
      
      const data = await response.json();
      return data.features[0]?.place_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  }

  calculateDistance(
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number }
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(point2.lat - point1.lat);
    const dLng = this.toRadians(point2.lng - point1.lng);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(point1.lat)) * Math.cos(this.toRadians(point2.lat)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

export const locationServices = new LocationServices();
