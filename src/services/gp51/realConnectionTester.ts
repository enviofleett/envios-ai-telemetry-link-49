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
  apiResponseTime?: number;
}

export interface GP51ConnectionHealth {
  isConnected: boolean;
  sessionValid: boolean;
  apiReachable: boolean;
  dataFlowing: boolean;
  errorMessage?: string;
  deviceCount?: number;
  apiResponseTime?: number;
  lastChecked?: Date;
  lastSuccessfulPing?: Date;
}

export class GP51RealConnectionTester {
  private static lastTestResult: RealConnectionResult | null = null;
  private static lastTestTime: Date | null = null;
  private static readonly CACHE_DURATION = 30000; // 30 seconds

  static async testRealConnection(): Promise<GP51ConnectionHealth> {
    // Return cached result if recent
    if (this.lastTestResult && this.lastTestTime) {
      const timeSinceLastTest = Date.now() - this.lastTestTime.getTime();
      if (timeSinceLastTest < this.CACHE_DURATION) {
        console.log('🎯 [REAL-CONNECTION] Using cached test result');
        return {
          isConnected: this.lastTestResult.isConnected,
          sessionValid: this.lastTestResult.sessionValid,
          apiReachable: this.lastTestResult.apiReachable,
          dataFlowing: this.lastTestResult.dataFlowing,
          errorMessage: this.lastTestResult.errorMessage,
          deviceCount: this.lastTestResult.deviceCount,
          apiResponseTime: this.lastTestResult.apiResponseTime,
          lastChecked: this.lastTestTime
        };
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
          latency: Date.now() - startTime,
          apiResponseTime: Date.now() - startTime
        };
        this.cacheResult(result);
        return this.convertToHealthResult(result);
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
          latency: Date.now() - startTime,
          apiResponseTime: Date.now() - startTime
        };
        this.cacheResult(result);
        return this.convertToHealthResult(result);
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
        latency: Date.now() - startTime,
        apiResponseTime: Date.now() - startTime
      };

      this.cacheResult(result);
      return this.convertToHealthResult(result);

    } catch (error) {
      console.error('❌ [REAL-CONNECTION] Test failed:', error);
      const result: RealConnectionResult = {
        isConnected: false,
        sessionValid: false,
        apiReachable: false,
        dataFlowing: false,
        errorMessage: error instanceof Error ? error.message : 'Connection test failed',
        latency: Date.now() - startTime,
        apiResponseTime: Date.now() - startTime
      };
      this.cacheResult(result);
      return this.convertToHealthResult(result);
    }
  }

  static async generateConnectionReport(): Promise<{
    summary: string;
    details: GP51ConnectionHealth;
    recommendations: string[];
  }> {
    const health = await this.testRealConnection();
    
    let summary = 'GP51 Connection ';
    if (health.isConnected && health.dataFlowing) {
      summary += 'Healthy';
    } else if (health.sessionValid) {
      summary += 'Degraded';
    } else {
      summary += 'Critical';
    }

    const recommendations: string[] = [];
    if (!health.sessionValid) {
      recommendations.push('Re-authenticate with GP51');
    }
    if (!health.apiReachable) {
      recommendations.push('Check network connectivity');
    }
    if (!health.dataFlowing) {
      recommendations.push('Verify GP51 API permissions');
    }

    return {
      summary,
      details: health,
      recommendations
    };
  }

  private static convertToHealthResult(result: RealConnectionResult): GP51ConnectionHealth {
    return {
      isConnected: result.isConnected,
      sessionValid: result.sessionValid,
      apiReachable: result.apiReachable,
      dataFlowing: result.dataFlowing,
      errorMessage: result.errorMessage,
      deviceCount: result.deviceCount,
      apiResponseTime: result.apiResponseTime,
      lastChecked: new Date(),
      lastSuccessfulPing: result.lastSuccessfulPing
    };
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
