
import { supabase } from '@/integrations/supabase/client';

interface HealthCheckResult {
  overall: 'healthy' | 'warning' | 'critical';
  timestamp: Date;
  checks: {
    gp51Connection: boolean;
    vehicleSync: boolean;
    databaseAccess: boolean;
    sessionValidity: boolean;
    apiConnectivity: boolean;
  };
  metrics: {
    totalVehicles: number;
    activeVehicles: number;
    lastSyncTime?: Date;
    sessionExpiresAt?: Date;
    vehiclesWithPositions: number;
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
      sessionValidity: false,
      apiConnectivity: false
    };
    const metrics = {
      totalVehicles: 0,
      activeVehicles: 0,
      lastSyncTime: undefined as Date | undefined,
      sessionExpiresAt: undefined as Date | undefined,
      vehiclesWithPositions: 0
    };

    try {
      // Check GP51 session status using enhanced health check
      const { data: statusData, error: statusError } = await supabase.functions.invoke('settings-management', {
        body: { action: 'health-check' }
      });

      if (statusError) {
        errors.push(`Status check failed: ${statusError.message}`);
      } else if (statusData?.healthy) {
        checks.sessionValidity = statusData.details?.gp51Connected || false;
        checks.gp51Connection = statusData.details?.authentication || false;
        checks.apiConnectivity = statusData.details?.apiConnectivity || false;
        
        if (statusData.details?.expiresAt) {
          metrics.sessionExpiresAt = new Date(statusData.details.expiresAt);
        }
      } else {
        errors.push(statusData?.error || 'GP51 health check failed');
      }

      // Check database access and vehicle metrics
      try {
        const { data: vehicles, error: vehiclesError } = await supabase
          .from('vehicles')
          .select('id, is_active, updated_at, last_position')
          .limit(5000); // Increased limit for better metrics

        if (vehiclesError) {
          errors.push(`Database access failed: ${vehiclesError.message}`);
        } else {
          checks.databaseAccess = true;
          metrics.totalVehicles = vehicles?.length || 0;
          metrics.activeVehicles = vehicles?.filter(v => v.is_active)?.length || 0;
          
          // Count vehicles with recent position data
          metrics.vehiclesWithPositions = vehicles?.filter(v => v.last_position)?.length || 0;

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

      // Enhanced vehicle sync check
      checks.vehicleSync = metrics.totalVehicles > 0 && metrics.activeVehicles > 0;

      // Determine overall health with enhanced criteria
      const criticalIssues = !checks.databaseAccess || !checks.sessionValidity || !checks.apiConnectivity;
      const warningIssues = !checks.gp51Connection || !checks.vehicleSync || 
                           metrics.activeVehicles === 0 || 
                           (metrics.totalVehicles > 0 && metrics.vehiclesWithPositions / metrics.totalVehicles < 0.5);

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
      console.log('Triggering enhanced vehicle sync...');
      
      // Get current session
      const { data: statusData, error: statusError } = await supabase.functions.invoke('settings-management', {
        body: { action: 'get-gp51-status' }
      });

      if (statusError || !statusData?.connected) {
        return { success: false, message: 'GP51 not connected. Please check your credentials.' };
      }

      // Trigger enhanced vehicle import
      const { data: importData, error: importError } = await supabase.functions.invoke('settings-management', {
        body: { action: 'save-gp51-credentials' }
      });

      if (importError) {
        return { success: false, message: `Vehicle sync failed: ${importError.message}` };
      }

      // Update health metrics
      await this.performHealthCheck();

      return { 
        success: true, 
        message: `Vehicle sync completed successfully. Imported ${importData?.vehicleImport?.vehiclesImported || 0} vehicles.` 
      };
    } catch (error) {
      console.error('Enhanced vehicle sync failed:', error);
      return { 
        success: false, 
        message: `Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }
}

export const gp51HealthMonitor = new GP51HealthMonitor();
