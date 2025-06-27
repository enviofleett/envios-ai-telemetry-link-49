
import { supabaseGP51AuthService } from './SupabaseGP51AuthService';
import { gp51DataService } from './GP51DataService';
import { GP51HealthStatus } from '@/types/gp51-unified';

export class GP51HealthService {
  private healthCheckCache: { data: GP51HealthStatus; timestamp: number } | null = null;
  private readonly HEALTH_CACHE_TTL = 30000; // 30 seconds

  async getConnectionHealth(): Promise<GP51HealthStatus> {
    // Check cache first
    if (this.healthCheckCache) {
      const age = Date.now() - this.healthCheckCache.timestamp;
      if (age < this.HEALTH_CACHE_TTL) {
        return this.healthCheckCache.data;
      }
    }

    const startTime = Date.now();
    const errorMessages: string[] = [];
    let isConnected = false;
    let tokenValid = false;
    let sessionValid = false;
    let activeDevices = 0;

    try {
      // Check authentication status
      const authStatus = supabaseGP51AuthService.getSessionStatus();
      tokenValid = authStatus.isAuthenticated;
      sessionValid = !authStatus.isExpired;

      if (!tokenValid) {
        errorMessages.push('No valid GP51 authentication token');
      }

      if (!sessionValid) {
        errorMessages.push('GP51 session has expired');
      }

      // Test connection if authenticated
      if (tokenValid && sessionValid) {
        try {
          const connectionTest = await gp51DataService.testConnection();
          isConnected = connectionTest.success;

          if (!connectionTest.success && connectionTest.error) {
            errorMessages.push(`Connection test failed: ${connectionTest.error}`);
          }

          // Try to get device count
          if (isConnected) {
            const devicesResult = await gp51DataService.queryMonitorList();
            if (devicesResult.success && devicesResult.data) {
              activeDevices = devicesResult.data.length;
            }
          }
        } catch (error) {
          errorMessages.push(`Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

    } catch (error) {
      errorMessages.push(`Health check error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    const responseTime = Date.now() - startTime;
    const lastCheck = new Date();
    const isHealthy = isConnected && tokenValid && sessionValid;
    const status = isHealthy ? 'healthy' : 'unhealthy';
    const connectionStatus = isConnected ? 'connected' : 'disconnected';

    const healthStatus: GP51HealthStatus = {
      status,
      isHealthy,
      connectionStatus,
      isConnected,
      lastPingTime: lastCheck,
      responseTime,
      tokenValid,
      sessionValid,
      activeDevices,
      errorMessage: errorMessages.length > 0 ? errorMessages.join('; ') : undefined,
      lastCheck
    };

    // Cache the result
    this.healthCheckCache = {
      data: healthStatus,
      timestamp: Date.now()
    };

    return healthStatus;
  }

  // Clear health cache to force fresh check
  clearHealthCache(): void {
    this.healthCheckCache = null;
  }

  // Get quick status without full health check
  getQuickStatus(): {
    isAuthenticated: boolean;
    hasValidSession: boolean;
    canMakeRequests: boolean;
  } {
    const authStatus = supabaseGP51AuthService.getSessionStatus();
    
    return {
      isAuthenticated: authStatus.isAuthenticated,
      hasValidSession: !authStatus.isExpired,
      canMakeRequests: authStatus.isAuthenticated && !authStatus.isExpired
    };
  }
}

export const gp51HealthService = new GP51HealthService();
