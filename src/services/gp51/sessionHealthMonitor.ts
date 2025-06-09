
import { enhancedGP51SessionManager } from './enhancedGP51SessionManager';
import { gp51ApiService } from './gp51ApiService';

interface SessionHealth {
  isValid: boolean;
  expiresAt: Date | null;
  username: string | null;
  lastCheck: Date;
  needsRefresh: boolean;
  consecutiveFailures: number;
}

export class SessionHealthMonitor {
  private static instance: SessionHealthMonitor;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private readonly CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_FAILURES = 3;
  private consecutiveFailures = 0;
  private healthCallbacks: ((health: SessionHealth) => void)[] = [];

  private constructor() {}

  static getInstance(): SessionHealthMonitor {
    if (!SessionHealthMonitor.instance) {
      SessionHealthMonitor.instance = new SessionHealthMonitor();
    }
    return SessionHealthMonitor.instance;
  }

  startMonitoring(): void {
    if (this.healthCheckInterval) {
      return; // Already monitoring
    }

    console.log('Starting GP51 session health monitoring...');

    // Initial health check
    this.performHealthCheck();

    // Set up periodic health checks
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.CHECK_INTERVAL);
  }

  stopMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
      console.log('Stopped GP51 session health monitoring');
    }
  }

  private async performHealthCheck(): Promise<void> {
    try {
      const sessionInfo = enhancedGP51SessionManager.getSessionInfo();
      const isValid = enhancedGP51SessionManager.isSessionValid();

      if (!isValid && sessionInfo) {
        console.log('Session expired, attempting restoration...');
        
        const restored = await enhancedGP51SessionManager.restoreSession();
        if (!restored) {
          this.consecutiveFailures++;
          console.error(`Session restoration failed. Consecutive failures: ${this.consecutiveFailures}`);
        } else {
          console.log('Session successfully restored');
          this.consecutiveFailures = 0;
        }
      } else if (isValid) {
        // Test the session with a lightweight API call
        const deviceListResult = await gp51ApiService.getDeviceList();
        
        if (deviceListResult.success) {
          this.consecutiveFailures = 0;
        } else {
          this.consecutiveFailures++;
          console.warn(`GP51 API test failed. Consecutive failures: ${this.consecutiveFailures}`);
          
          // If API calls are failing, try to refresh the session
          if (this.consecutiveFailures >= 2) {
            console.log('Multiple API failures detected, attempting session refresh...');
            await enhancedGP51SessionManager.restoreSession();
          }
        }
      }

      // Notify health status
      const health: SessionHealth = {
        isValid: enhancedGP51SessionManager.isSessionValid(),
        expiresAt: sessionInfo?.expiresAt || null,
        username: sessionInfo?.username || null,
        lastCheck: new Date(),
        needsRefresh: this.consecutiveFailures > 0,
        consecutiveFailures: this.consecutiveFailures
      };

      this.notifyHealthUpdate(health);

      // If too many consecutive failures, stop monitoring and alert
      if (this.consecutiveFailures >= this.MAX_FAILURES) {
        console.error('Maximum consecutive failures reached. Stopping health monitoring.');
        this.stopMonitoring();
        
        // Clear the session to force re-authentication
        await enhancedGP51SessionManager.clearSession();
      }

    } catch (error) {
      console.error('Error during session health check:', error);
      this.consecutiveFailures++;
    }
  }

  onHealthUpdate(callback: (health: SessionHealth) => void): () => void {
    this.healthCallbacks.push(callback);
    
    return () => {
      const index = this.healthCallbacks.indexOf(callback);
      if (index > -1) {
        this.healthCallbacks.splice(index, 1);
      }
    };
  }

  private notifyHealthUpdate(health: SessionHealth): void {
    this.healthCallbacks.forEach(callback => {
      try {
        callback(health);
      } catch (error) {
        console.error('Error in health update callback:', error);
      }
    });
  }

  async forceHealthCheck(): Promise<SessionHealth> {
    await this.performHealthCheck();
    
    const sessionInfo = enhancedGP51SessionManager.getSessionInfo();
    return {
      isValid: enhancedGP51SessionManager.isSessionValid(),
      expiresAt: sessionInfo?.expiresAt || null,
      username: sessionInfo?.username || null,
      lastCheck: new Date(),
      needsRefresh: this.consecutiveFailures > 0,
      consecutiveFailures: this.consecutiveFailures
    };
  }

  getHealthStatus(): SessionHealth {
    const sessionInfo = enhancedGP51SessionManager.getSessionInfo();
    return {
      isValid: enhancedGP51SessionManager.isSessionValid(),
      expiresAt: sessionInfo?.expiresAt || null,
      username: sessionInfo?.username || null,
      lastCheck: new Date(),
      needsRefresh: this.consecutiveFailures > 0,
      consecutiveFailures: this.consecutiveFailures
    };
  }
}

export const sessionHealthMonitor = SessionHealthMonitor.getInstance();
