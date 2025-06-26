
import { supabase } from '@/integrations/supabase/client';
import { GP51HealthStatus } from '@/types/gp51-unified';

export class GP51HealthService {
  async getConnectionHealth(): Promise<GP51HealthStatus> {
    try {
      const start = Date.now();
      
      const { data, error } = await supabase.functions.invoke('gp51-service-management', {
        body: { action: 'health_check' }
      });
      
      const responseTime = Date.now() - start;
      
      if (error || !data?.success) {
        return {
          status: 'failed',
          lastCheck: new Date(),
          responseTime,
          errors: [error?.message || 'Health check failed'],
          isConnected: false,
          lastPingTime: new Date(),
          tokenValid: false,
          sessionValid: false,
          activeDevices: 0,
          errorMessage: error?.message || 'Health check failed'
        };
      }
      
      return {
        status: 'healthy',
        lastCheck: new Date(),
        responseTime,
        isConnected: true,
        lastPingTime: new Date(),
        tokenValid: !!data.tokenValid,
        sessionValid: !!data.sessionValid,
        activeDevices: data.activeDevices || 0,
        errorMessage: undefined
      };
    } catch (error) {
      return {
        status: 'failed',
        lastCheck: new Date(),
        responseTime: 0,
        errors: [error.message],
        isConnected: false,
        lastPingTime: new Date(),
        tokenValid: false,
        sessionValid: false,
        activeDevices: 0,
        errorMessage: error.message
      };
    }
  }
}
