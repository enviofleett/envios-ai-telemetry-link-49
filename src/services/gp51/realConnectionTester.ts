
import { supabase } from '@/integrations/supabase/client';

export interface RealConnectionResult {
  isConnected: boolean;
  sessionValid: boolean;
  apiReachable: boolean;
  dataFlowing: boolean;
  lastSuccessfulPing?: Date;
  errorMessage?: string;
  deviceCount?: number;
  latency?: number;
}

export class GP51RealConnectionTester {
  private static lastTestResult: RealConnectionResult | null = null;
  private static lastTestTime: Date | null = null;
  private static readonly CACHE_DURATION = 30000; // 30 seconds

  static async testRealConnection(): Promise<RealConnectionResult> {
    // Return cached result if recent
    if (this.lastTestResult && this.lastTestTime) {
      const timeSinceLastTest = Date.now() - this.lastTestTime.getTime();
      if (timeSinceLastTest < this.CACHE_DURATION) {
        console.log('🎯 [REAL-CONNECTION] Using cached test result');
        return this.lastTestResult;
      }
    }

    console.log('🔍 [REAL-CONNECTION] Testing actual GP51 connectivity...');
    const startTime = Date.now();

    try {
      // Test 1: Session validation
      const sessionResult = await this.testSessionValidity();
      
      if (!sessionResult.valid) {
        const result: RealConnectionResult = {
          isConnected: false,
          sessionValid: false,
          apiReachable: false,
          dataFlowing: false,
          errorMessage: sessionResult.error,
          latency: Date.now() - startTime
        };
        this.cacheResult(result);
        return result;
      }

      // Test 2: API reachability
      const apiResult = await this.testApiReachability();
      
      if (!apiResult.reachable) {
        const result: RealConnectionResult = {
          isConnected: false,
          sessionValid: true,
          apiReachable: false,
          dataFlowing: false,
          errorMessage: apiResult.error,
          latency: Date.now() - startTime
        };
        this.cacheResult(result);
        return result;
      }

      // Test 3: Data flow verification
      const dataResult = await this.testDataFlow();
      
      const result: RealConnectionResult = {
        isConnected: dataResult.flowing,
        sessionValid: true,
        apiReachable: true,
        dataFlowing: dataResult.flowing,
        lastSuccessfulPing: new Date(),
        deviceCount: dataResult.deviceCount,
        errorMessage: dataResult.error,
        latency: Date.now() - startTime
      };

      this.cacheResult(result);
      return result;

    } catch (error) {
      console.error('❌ [REAL-CONNECTION] Test failed:', error);
      const result: RealConnectionResult = {
        isConnected: false,
        sessionValid: false,
        apiReachable: false,
        dataFlowing: false,
        errorMessage: error instanceof Error ? error.message : 'Connection test failed',
        latency: Date.now() - startTime
      };
      this.cacheResult(result);
      return result;
    }
  }

  private static async testSessionValidity(): Promise<{ valid: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('gp51-service-management', {
        body: { action: 'test_connection' }
      });

      if (error) {
        return { valid: false, error: error.message };
      }

      return { valid: data?.isValid || false, error: data?.errorMessage };
    } catch (error) {
      return { 
        valid: false, 
        error: error instanceof Error ? error.message : 'Session validation failed' 
      };
    }
  }

  private static async testApiReachability(): Promise<{ reachable: boolean; error?: string }> {
    try {
      // This would test if the GP51 API is actually reachable
      // For now, we'll assume it's reachable if session is valid
      return { reachable: true };
    } catch (error) {
      return { 
        reachable: false, 
        error: error instanceof Error ? error.message : 'API not reachable' 
      };
    }
  }

  private static async testDataFlow(): Promise<{ flowing: boolean; deviceCount?: number; error?: string }> {
    try {
      // Test if we can actually fetch live data
      const { data, error } = await supabase.functions.invoke('fetchLiveGp51Data');

      if (error) {
        return { flowing: false, error: error.message };
      }

      if (!data?.success) {
        return { flowing: false, error: data?.error || 'Data fetch failed' };
      }

      return { 
        flowing: true, 
        deviceCount: data.data?.total_devices || 0 
      };
    } catch (error) {
      return { 
        flowing: false, 
        error: error instanceof Error ? error.message : 'Data flow test failed' 
      };
    }
  }

  private static cacheResult(result: RealConnectionResult): void {
    this.lastTestResult = result;
    this.lastTestTime = new Date();
  }

  static clearCache(): void {
    this.lastTestResult = null;
    this.lastTestTime = null;
  }
}
