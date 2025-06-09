
import { supabase } from '@/integrations/supabase/client';

export interface GeocodingConfigurationRow {
  id: string;
  user_id: string;
  provider_name: 'google-maps' | 'maptiler';
  api_key_encrypted: string | null;
  is_active: boolean;
  primary_provider: boolean;
  fallback_provider: boolean;
  rate_limit_per_day: number;
  created_at: string;
  updated_at: string;
  last_tested_at: string | null;
  test_status: 'success' | 'failed' | 'pending' | null;
  test_error_message: string | null;
}

export interface GeocodingUsageLog {
  user_id: string;
  provider_name: string;
  request_type: 'reverse_geocode' | 'forward_geocode';
  latitude?: number;
  longitude?: number;
  address_input?: string;
  address_result?: string;
  response_time_ms?: number;
  success: boolean;
  error_message?: string;
  cache_hit: boolean;
}

class DatabaseGeocodingService {
  async getGeocodingConfiguration(provider: 'google-maps' | 'maptiler'): Promise<GeocodingConfigurationRow | null> {
    try {
      const { data, error } = await supabase
        .from('geocoding_configurations')
        .select('*')
        .eq('provider_name', provider)
        .maybeSingle();

      if (error) {
        console.error('Error fetching geocoding configuration:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Database error fetching geocoding configuration:', error);
      return null;
    }
  }

  async saveGeocodingConfiguration(
    provider: 'google-maps' | 'maptiler',
    apiKey: string,
    isPrimary: boolean = false
  ): Promise<boolean> {
    try {
      // Simple encryption for API key storage (base64 encoding)
      const encryptedKey = btoa(apiKey);

      const { error } = await supabase.rpc('upsert_geocoding_configuration', {
        p_provider_name: provider,
        p_api_key_encrypted: encryptedKey,
        p_is_active: true,
        p_primary_provider: isPrimary
      });

      if (error) {
        console.error('Error saving geocoding configuration:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Database error saving geocoding configuration:', error);
      return false;
    }
  }

  async updateTestStatus(
    provider: 'google-maps' | 'maptiler',
    status: 'success' | 'failed' | 'pending',
    errorMessage?: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('geocoding_configurations')
        .update({
          test_status: status,
          test_error_message: errorMessage || null,
          last_tested_at: new Date().toISOString()
        })
        .eq('provider_name', provider);

      if (error) {
        console.error('Error updating test status:', error);
      }
    } catch (error) {
      console.error('Database error updating test status:', error);
    }
  }

  async logGeocodingUsage(usageLog: GeocodingUsageLog): Promise<void> {
    try {
      const { error } = await supabase
        .from('geocoding_usage_logs')
        .insert([usageLog]);

      if (error) {
        console.error('Error logging geocoding usage:', error);
      }
    } catch (error) {
      console.error('Database error logging geocoding usage:', error);
    }
  }

  async getGeocodingStatistics(): Promise<any> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase.rpc('get_geocoding_statistics', {
        p_user_id: user.id
      });

      if (error) {
        console.error('Error fetching geocoding statistics:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Database error fetching geocoding statistics:', error);
      return null;
    }
  }

  async getCachedAddress(lat: number, lon: number): Promise<string | null> {
    try {
      const cacheKey = `${lat.toFixed(4)},${lon.toFixed(4)}`;
      
      const { data, error } = await supabase
        .from('geocoding_cache')
        .select('address_result, hit_count')
        .eq('cache_key', cacheKey)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (error || !data) {
        return null;
      }

      // Update hit count
      await supabase
        .from('geocoding_cache')
        .update({ hit_count: data.hit_count + 1 })
        .eq('cache_key', cacheKey);

      return data.address_result;
    } catch (error) {
      console.error('Error fetching cached address:', error);
      return null;
    }
  }

  async cacheAddress(
    lat: number, 
    lon: number, 
    address: string, 
    provider: string,
    confidenceScore?: number
  ): Promise<void> {
    try {
      const cacheKey = `${lat.toFixed(4)},${lon.toFixed(4)}`;
      
      const { error } = await supabase
        .from('geocoding_cache')
        .upsert({
          cache_key: cacheKey,
          provider_name: provider,
          latitude: lat,
          longitude: lon,
          address_result: address,
          confidence_score: confidenceScore || null,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        }, {
          onConflict: 'cache_key'
        });

      if (error) {
        console.error('Error caching address:', error);
      }
    } catch (error) {
      console.error('Database error caching address:', error);
    }
  }

  decryptApiKey(encryptedKey: string): string {
    try {
      return atob(encryptedKey);
    } catch (error) {
      console.error('Error decrypting API key:', error);
      return '';
    }
  }
}

export const databaseGeocodingService = new DatabaseGeocodingService();
