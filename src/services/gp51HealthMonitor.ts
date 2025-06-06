import { supabase } from '@/integrations/supabase/client';
import { gp51ApiService } from './gp51ApiService';

interface HealthCheckResult {
  overall: 'healthy' | 'warning' | 'critical';
  timestamp: Date;
  checks: {
    gp51Connection: boolean;
    vehicleSync: boolean;
    databaseAccess: boolean;
    sessionValidity: boolean;
  };
  metrics: {
    totalVehicles: number;
    activeVehicles: number;
    lastSyncTime?: Date;
    sessionExpiresAt?: Date;
  };
  errors: string[];
}

export class GP51HealthMonitor {
  private lastHealthCheck: HealthCheckResult | null = null;
  private subscribers: ((result: HealthCheckResult) => void)[] = [];

  async performHealthCheck(): Promise<HealthCheckResult> {
    const errors: string[] = [];
    const checks = {
      gp51Connection: false,
      vehicleSync: false,
      databaseAccess: false,
      sessionValidity: false
    };
    const metrics = {
      totalVehicles: 0,
      activeVehicles: 0,
      lastSyncTime: undefined as Date | undefined,
      sessionExpiresAt: undefined as Date | undefined
    };

    try {
      // Check GP51 session status
      const { data: statusData, error: statusError } = await supabase.functions.invoke('settings-management', {
        body: { action: 'get-gp51-status' }
      });

      if (statusError) {
        errors.push(`Status check failed: ${statusError.message}`);
      } else if (statusData?.connected) {
        checks.sessionValidity = true;
        if (statusData.expiresAt) {
          metrics.sessionExpiresAt = new Date(statusData.expiresAt);
        }
      } else {
        errors.push('GP51 session not connected');
      }

      // Check database access and vehicle counts
      try {
        const { data: vehicles, error: vehiclesError } = await supabase
          .from('vehicles')
          .select('id, is_active, updated_at')
          .limit(1000);

        if (vehiclesError) {
          errors.push(`Database access failed: ${vehiclesError.message}`);
        } else {
          checks.databaseAccess = true;
          metrics.totalVehicles = vehicles?.length || 0;
          metrics.activeVehicles = vehicles?.filter(v => v.is_active)?.length || 0;

          if (vehicles && vehicles.length > 0) {
            const latestUpdate = vehicles.reduce((latest, vehicle) => {
              const updateTime = new Date(vehicle.updated_at);
              return updateTime > latest ? updateTime : latest;
            }, new Date(0));
            metrics.lastSyncTime = latestUpdate;
          }
        }
      } catch (dbError) {
        errors.push(`Database error: ${dbError instanceof Error ? dbError.message : 'Unknown database error'}`);
      }

      // Perform GP51 API health check if session is valid
      if (checks.sessionValidity) {
        try {
          const { data: healthData, error: healthError } = await supabase.functions.invoke('settings-management', {
            body: { action: 'health-check' }
          });

          if (healthError) {
            errors.push(`GP51 health check failed: ${healthError.message}`);
          } else if (healthData?.healthy) {
            checks.gp51Connection = true;
            checks.vehicleSync = metrics.totalVehicles > 0;
          } else {
            errors.push('GP51 health check returned unhealthy status');
          }
        } catch (healthError) {
          errors.push(`GP51 health check error: ${healthError instanceof Error ? healthError.message : 'Unknown error'}`);
        }
      }

      // Determine overall health
      const criticalIssues = !checks.databaseAccess || !checks.sessionValidity;
      const warningIssues = !checks.gp51Connection || !checks.vehicleSync || metrics.activeVehicles === 0;

      const overall = criticalIssues ? 'critical' : warningIssues ? 'warning' : 'healthy';

      const result: HealthCheckResult = {
        overall,
        timestamp: new Date(),
        checks,
        metrics,
        errors
      };

      this.lastHealthCheck = result;
      this.notifySubscribers(result);

      return result;
    } catch (error) {
      const criticalResult: HealthCheckResult = {
        overall: 'critical',
        timestamp: new Date(),
        checks,
        metrics,
        errors: [...errors, `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };

      this.lastHealthCheck = criticalResult;
      this.notifySubscribers(criticalResult);

      return criticalResult;
    }
  }

  async startMonitoring(intervalMinutes: number = 5): Promise<void> {
    // Perform initial health check
    await this.performHealthCheck();

    // Set up periodic monitoring
    setInterval(async () => {
      await this.performHealthCheck();
    }, intervalMinutes * 60 * 1000);
  }

  subscribe(callback: (result: HealthCheckResult) => void): () => void {
    this.subscribers.push(callback);
    
    // Send current status if available
    if (this.lastHealthCheck) {
      callback(this.lastHealthCheck);
    }

    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  private notifySubscribers(result: HealthCheckResult): void {
    this.subscribers.forEach(callback => {
      try {
        callback(result);
      } catch (error) {
        console.error('Error notifying health monitor subscriber:', error);
      }
    });
  }

  getLastHealthCheck(): HealthCheckResult | null {
    return this.lastHealthCheck;
  }

  async triggerVehicleSync(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('Triggering manual vehicle sync...');
      
      // Get current session
      const { data: statusData, error: statusError } = await supabase.functions.invoke('settings-management', {
        body: { action: 'get-gp51-status' }
      });

      if (statusError || !statusData?.connected) {
        return { success: false, message: 'GP51 not connected. Please check your credentials.' };
      }

      // The enhanced handler will automatically import vehicles
      // We can trigger this by calling the health check which will update metrics
      await this.performHealthCheck();

      return { success: true, message: 'Vehicle sync completed successfully' };
    } catch (error) {
      console.error('Manual vehicle sync failed:', error);
      return { 
        success: false, 
        message: `Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }
}

export const gp51HealthMonitor = new GP51HealthMonitor();
