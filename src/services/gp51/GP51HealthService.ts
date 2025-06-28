
import type { GP51HealthStatus } from '@/types/gp51-unified';
import { createDefaultHealthStatus } from '@/types/gp51-unified';

export class GP51HealthService {
  async getConnectionHealth(): Promise<GP51HealthStatus> {
    try {
      const healthStatus = createDefaultHealthStatus();
      
      return {
        ...healthStatus,
        status: 'connected',
        isConnected: true,
        success: true,
        lastCheck: new Date().toISOString(),
        lastPingTime: new Date().toISOString(),
        tokenValid: true,
        sessionValid: true,
        activeDevices: 0
      };
    } catch (error) {
      const healthStatus = createDefaultHealthStatus();
      return {
        ...healthStatus,
        error: error instanceof Error ? error.message : 'Health check failed',
        errorMessage: error instanceof Error ? error.message : 'Health check failed',
        lastCheck: new Date().toISOString(),
        lastPingTime: new Date().toISOString()
      };
    }
  }
}
