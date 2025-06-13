
import { supabase } from '@/integrations/supabase/client';

export interface VinApiConfig {
  id: string;
  provider_name: string;
  is_active: boolean;
  primary_provider: boolean;
  rate_limit_per_day: number;
  last_tested_at?: string;
  test_status?: string;
  test_error_message?: string;
}

export interface VinDecodeResult {
  success: boolean;
  data?: {
    make: string;
    model: string;
    year: string;
    engine?: string;
    fuelType?: string;
    bodyStyle?: string;
  };
  error?: string;
}

export class VinApiService {
  static async decodeVin(vin: string): Promise<VinDecodeResult> {
    try {
      const { data, error } = await supabase.functions.invoke('vin-decoder', {
        body: { vin }
      });

      if (error) {
        return {
          success: false,
          error: error.message || 'VIN decode failed'
        };
      }

      return data;
    } catch (error) {
      return {
        success: false,
        error: 'VIN decoding service unavailable'
      };
    }
  }

  static async getApiConfigurations(): Promise<VinApiConfig[]> {
    const { data, error } = await supabase
      .from('vin_api_configurations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  }

  static async saveApiConfiguration(config: {
    provider_name: string;
    api_key: string;
    secret_key: string;
    is_active?: boolean;
    primary_provider?: boolean;
    rate_limit_per_day?: number;
  }): Promise<void> {
    // In production, encrypt the keys before storing
    const { error } = await supabase
      .from('vin_api_configurations')
      .insert({
        provider_name: config.provider_name,
        api_key_encrypted: config.api_key, // TODO: Encrypt in production
        secret_key_encrypted: config.secret_key, // TODO: Encrypt in production
        is_active: config.is_active ?? true,
        primary_provider: config.primary_provider ?? true,
        rate_limit_per_day: config.rate_limit_per_day ?? 1000
      });

    if (error) {
      throw new Error(error.message);
    }
  }

  static async testApiConfiguration(configId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Use a test VIN for validation
      const testVin = '1HGBH41JXMN109186'; // Honda Civic test VIN
      const result = await this.decodeVin(testVin);
      
      // Update test status
      await supabase
        .from('vin_api_configurations')
        .update({
          last_tested_at: new Date().toISOString(),
          test_status: result.success ? 'success' : 'failed',
          test_error_message: result.error || null
        })
        .eq('id', configId);

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Test failed'
      };
    }
  }

  static async getDecodeHistory(limit = 50) {
    const { data, error } = await supabase
      .from('vin_decode_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  }
}
