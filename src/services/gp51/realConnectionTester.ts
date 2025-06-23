
import { supabase } from '@/integrations/supabase/client';

export interface GP51ConnectionHealth {
  isConnected: boolean;
  lastSuccessfulPing?: Date;
  apiResponseTime?: number;
  deviceCount?: number;
  errorMessage?: string;
  sessionValid: boolean;
  apiReachable: boolean;
  dataFlowing: boolean;
}

export class GP51RealConnectionTester {
  /**
   * Performs comprehensive GP51 connection testing beyond just session validation
   */
  static async testRealConnection(): Promise<GP51ConnectionHealth> {
    const startTime = Date.now();
    
    console.log('🧪 Testing real GP51 API connectivity...');
    
    try {
      // Step 1: Test if GP51 API is reachable with real data
      const { data: apiTest, error: apiError } = await supabase.functions.invoke('gp51-service-management', {
        body: { action: 'test_gp51_api' }
      });

      if (apiError) {
        console.error('❌ GP51 API unreachable:', apiError);
        return {
          isConnected: false,
          sessionValid: false,
          apiReachable: false,
          dataFlowing: false,
          errorMessage: apiError.message,
          apiResponseTime: Date.now() - startTime
        };
      }

      if (!apiTest.success) {
        console.error('❌ GP51 API test failed:', apiTest);
        return {
          isConnected: false,
          sessionValid: apiTest.code !== 'SESSION_EXPIRED',
          apiReachable: apiTest.code !== 'API_CONNECTION_ERROR',
          dataFlowing: false,
          errorMessage: apiTest.error,
          apiResponseTime: Date.now() - startTime
        };
      }

      // Step 2: Test live data flow by fetching actual vehicle data
      const { data: liveDataTest, error: liveError } = await supabase.functions.invoke('fetchLiveGp51Data', {
        body: {}
      });

      const responseTime = Date.now() - startTime;

      if (liveError || !liveDataTest?.success) {
        console.warn('⚠️ Live data test failed:', liveError || liveDataTest);
        return {
          isConnected: true, // API is reachable but data isn't flowing
          sessionValid: true,
          apiReachable: true,
          dataFlowing: false,
          errorMessage: liveError?.message || liveDataTest?.error || 'Live data not available',
          apiResponseTime: responseTime,
          deviceCount: apiTest.deviceCount || 0
        };
      }

      console.log('✅ Real GP51 connection test successful');
      return {
        isConnected: true,
        sessionValid: true,
        apiReachable: true,
        dataFlowing: true,
        lastSuccessfulPing: new Date(),
        apiResponseTime: responseTime,
        deviceCount: liveDataTest.data?.total_devices || apiTest.deviceCount || 0
      };

    } catch (error) {
      console.error('❌ Connection test exception:', error);
      return {
        isConnected: false,
        sessionValid: false,
        apiReachable: false,
        dataFlowing: false,
        errorMessage: error instanceof Error ? error.message : 'Connection test failed',
        apiResponseTime: Date.now() - startTime
      };
    }
  }

  /**
   * Quick health check that validates both session and live API access
   */
  static async quickHealthCheck(): Promise<boolean> {
    try {
      const health = await this.testRealConnection();
      return health.isConnected && health.dataFlowing;
    } catch (error) {
      console.error('❌ Quick health check failed:', error);
      return false;
    }
  }

  /**
   * Comprehensive connection report for admin dashboard
   */
  static async generateConnectionReport(): Promise<{
    overallHealth: 'healthy' | 'degraded' | 'critical';
    details: GP51ConnectionHealth;
    recommendations: string[];
  }> {
    const details = await this.testRealConnection();
    
    let overallHealth: 'healthy' | 'degraded' | 'critical';
    const recommendations: string[] = [];

    if (details.isConnected && details.dataFlowing) {
      overallHealth = 'healthy';
      if (details.apiResponseTime && details.apiResponseTime > 3000) {
        recommendations.push('API response time is high (>3s). Check network connectivity.');
      }
    } else if (details.sessionValid && details.apiReachable) {
      overallHealth = 'degraded';
      recommendations.push('API is reachable but live data is not flowing. Check GP51 service status.');
      if (!details.dataFlowing) {
        recommendations.push('Vehicle telemetry may not be updating. Verify device connectivity.');
      }
    } else {
      overallHealth = 'critical';
      if (!details.sessionValid) {
        recommendations.push('GP51 session expired or invalid. Re-authenticate in Admin Settings.');
      }
      if (!details.apiReachable) {
        recommendations.push('GP51 API unreachable. Check internet connectivity or GP51 service status.');
      }
    }

    return {
      overallHealth,
      details,
      recommendations
    };
  }
}
