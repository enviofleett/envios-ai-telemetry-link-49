
import { supabase } from '@/integrations/supabase/client';
import { SecureCache } from '@/hooks/useSecureCache';
import { PerformanceMonitor } from '@/services/performance/PerformanceMonitor';
import { SecurityService } from '@/services/security/SecurityService';

interface GP51AuthResult {
  success: boolean;
  token?: string;
  error?: string;
  sessionId?: string;
  vehicles?: any[];
}

interface GP51ConnectionTest {
  success: boolean;
  error?: string;
  latency?: number;
}

export class ConsolidatedGP51Service {
  private static instance: ConsolidatedGP51Service;
  private cache = SecureCache.getInstance();
  private monitor = PerformanceMonitor.getInstance();

  static getInstance(): ConsolidatedGP51Service {
    if (!ConsolidatedGP51Service.instance) {
      ConsolidatedGP51Service.instance = new ConsolidatedGP51Service();
    }
    return ConsolidatedGP51Service.instance;
  }

  async testConnection(): Promise<GP51ConnectionTest> {
    const cacheKey = 'gp51_connection_test';
    const cached = this.cache.get<GP51ConnectionTest>(cacheKey);
    
    if (cached) {
      return cached;
    }

    return this.monitor.measureApiCall('gp51_connection_test', async () => {
      try {
        const startTime = performance.now();
        
        const { data, error } = await supabase.functions.invoke('telemetry-auth', {
          body: { testConnection: true }
        });

        const latency = performance.now() - startTime;

        if (error) {
          const result = { success: false, error: error.message, latency };
          this.cache.set(cacheKey, result, 30000); // Cache for 30 seconds
          return result;
        }

        const result = { 
          success: data.success, 
          error: data.error,
          latency 
        };
        
        this.cache.set(cacheKey, result, 60000); // Cache for 1 minute
        return result;
      } catch (error) {
        const result = {
          success: false,
          error: error instanceof Error ? error.message : 'Connection test failed'
        };
        
        this.cache.set(cacheKey, result, 10000); // Cache error for 10 seconds
        return result;
      }
    });
  }

  async authenticate(username: string, password: string, apiUrl?: string): Promise<GP51AuthResult> {
    return this.monitor.measureApiCall('gp51_authenticate', async () => {
      try {
        // Validate inputs
        const usernameValidation = SecurityService.validateInput(username, 'username');
        if (!usernameValidation.isValid) {
          return { success: false, error: usernameValidation.error };
        }

        const passwordValidation = SecurityService.validateInput(password, 'password');
        if (!passwordValidation.isValid) {
          return { success: false, error: passwordValidation.error };
        }

        // Check rate limiting
        const rateLimitResult = SecurityService.checkRateLimit(`gp51_auth_${username}`);
        if (!rateLimitResult.allowed) {
          return { 
            success: false, 
            error: `Too many attempts. Try again in ${Math.ceil((rateLimitResult.resetTime! - Date.now()) / 1000 / 60)} minutes.`
          };
        }

        const { data, error } = await supabase.functions.invoke('telemetry-auth', {
          body: { 
            username: usernameValidation.sanitized, 
            password,
            apiUrl 
          }
        });

        if (error) {
          return { success: false, error: error.message };
        }

        // Cache successful authentication result (without sensitive data)
        if (data.success && data.token) {
          const cacheKey = `gp51_session_${username}`;
          this.cache.set(cacheKey, {
            authenticated: true,
            timestamp: Date.now(),
            vehicleCount: data.vehicles?.length || 0
          }, 300000); // 5 minutes
        }

        return data;
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Authentication failed'
        };
      }
    });
  }

  async getVehicleData(deviceId: string): Promise<any> {
    const cacheKey = `vehicle_data_${deviceId}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    return this.monitor.measureApiCall('gp51_vehicle_data', async () => {
      try {
        // Validate device ID
        const validation = SecurityService.validateInput(deviceId, 'deviceId');
        if (!validation.isValid) {
          throw new Error(validation.error);
        }

        const { data, error } = await supabase.functions.invoke('telemetry-positions', {
          body: { deviceId: validation.sanitized }
        });

        if (error) {
          throw new Error(error.message);
        }

        // Cache vehicle data for 30 seconds
        this.cache.set(cacheKey, data, 30000);
        return data;
      } catch (error) {
        throw error;
      }
    });
  }

  clearCache(): void {
    this.cache.clear();
  }

  getPerformanceReport() {
    return this.monitor.getReport();
  }

  // Invalidate authentication cache
  invalidateAuthCache(username: string): void {
    this.cache.invalidate(`gp51_session_${username}`);
    this.cache.invalidate('gp51_connection_test');
  }
}

export const consolidatedGP51Service = ConsolidatedGP51Service.getInstance();
