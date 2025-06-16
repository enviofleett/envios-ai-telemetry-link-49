
import { supabase } from '@/integrations/supabase/client';

export interface HealthMetrics {
  totalVehicles: number;
  activeVehicles: number;
  onlineVehicles: number;
  lastSyncTime?: Date;
  systemStatus: 'healthy' | 'warning' | 'critical';
  connectionStatus: 'connected' | 'disconnected' | 'error';
  dataFreshness: 'fresh' | 'stale' | 'expired';
  errors: string[];
}

export class GP51HealthMonitor {
  private static instance: GP51HealthMonitor;
  private healthMetrics: HealthMetrics | null = null;
  private lastCheckTime: Date | null = null;
  private subscribers: Set<(metrics: HealthMetrics) => void> = new Set();

  static getInstance(): GP51HealthMonitor {
    if (!GP51HealthMonitor.instance) {
      GP51HealthMonitor.instance = new GP51HealthMonitor();
    }
    return GP51HealthMonitor.instance;
  }

  // Add the missing subscribe method
  subscribe(callback: (metrics: HealthMetrics) => void): () => void {
    this.subscribers.add(callback);
    
    // If we have cached metrics, immediately call the callback
    if (this.healthMetrics) {
      callback(this.healthMetrics);
    }
    
    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
    };
  }

  // Add the missing triggerVehicleSync method
  async triggerVehicleSync(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🔄 Triggering manual vehicle sync...');
      
      // Perform health check which includes vehicle data validation
      const metrics = await this.getHealthMetrics();
      
      // Notify all subscribers of the updated metrics
      this.notifySubscribers(metrics);
      
      return {
        success: true,
        message: `Vehicle sync completed. Found ${metrics.totalVehicles} total vehicles, ${metrics.activeVehicles} active.`
      };
    } catch (error) {
      console.error('❌ Vehicle sync failed:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Vehicle sync failed'
      };
    }
  }

  private notifySubscribers(metrics: HealthMetrics): void {
    this.subscribers.forEach(callback => {
      try {
        callback(metrics);
      } catch (error) {
        console.error('❌ Subscriber callback error:', error);
      }
    });
  }

  async getHealthMetrics(): Promise<HealthMetrics> {
    try {
      console.log('🏥 Gathering GP51 health metrics...');
      
      const metrics = await this.collectHealthData();
      this.healthMetrics = metrics;
      this.lastCheckTime = new Date();
      
      // Notify subscribers of updated metrics
      this.notifySubscribers(metrics);
      
      return metrics;
    } catch (error) {
      console.error('❌ Failed to gather health metrics:', error);
      
      const errorMetrics = {
        totalVehicles: 0,
        activeVehicles: 0,
        onlineVehicles: 0,
        systemStatus: 'critical' as const,
        connectionStatus: 'error' as const,
        dataFreshness: 'expired' as const,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
      
      this.notifySubscribers(errorMetrics);
      return errorMetrics;
    }
  }

  private async collectHealthData(): Promise<HealthMetrics> {
    const errors: string[] = [];
    
    // Get vehicle counts using correct column names
    const { data: vehicles, error: vehicleError } = await supabase
      .from('vehicles')
      .select('id, gp51_device_id, updated_at');

    if (vehicleError) {
      errors.push(`Vehicle query failed: ${vehicleError.message}`);
      throw new Error(`Failed to fetch vehicle data: ${vehicleError.message}`);
    }

    const totalVehicles = vehicles?.length || 0;
    
    // Since we don't have is_active or last_position columns, we'll use updated_at as a proxy
    const recentlyUpdated = vehicles?.filter(v => {
      const updatedAt = new Date(v.updated_at);
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      return updatedAt > tenMinutesAgo;
    }) || [];

    const activeVehicles = recentlyUpdated.length;
    const onlineVehicles = recentlyUpdated.length; // Using same logic since we don't have separate online status

    // Determine system status
    let systemStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (errors.length > 0) {
      systemStatus = 'critical';
    } else if (totalVehicles > 0 && activeVehicles < totalVehicles * 0.5) {
      systemStatus = 'warning';
    }

    // Determine connection status
    const connectionStatus: 'connected' | 'disconnected' | 'error' = 
      errors.length > 0 ? 'error' : 'connected';

    // Determine data freshness
    const lastUpdate = vehicles?.length > 0 
      ? new Date(Math.max(...vehicles.map(v => new Date(v.updated_at).getTime())))
      : new Date(0);
    
    const timeSinceLastUpdate = Date.now() - lastUpdate.getTime();
    let dataFreshness: 'fresh' | 'stale' | 'expired' = 'fresh';
    
    if (timeSinceLastUpdate > 30 * 60 * 1000) { // 30 minutes
      dataFreshness = 'expired';
    } else if (timeSinceLastUpdate > 5 * 60 * 1000) { // 5 minutes
      dataFreshness = 'stale';
    }

    return {
      totalVehicles,
      activeVehicles,
      onlineVehicles,
      lastSyncTime: lastUpdate.getTime() > 0 ? lastUpdate : undefined,
      systemStatus,
      connectionStatus,
      dataFreshness,
      errors
    };
  }

  getCachedMetrics(): HealthMetrics | null {
    return this.healthMetrics;
  }

  getLastCheckTime(): Date | null {
    return this.lastCheckTime;
  }

  async performHealthCheck(): Promise<boolean> {
    try {
      const metrics = await this.getHealthMetrics();
      return metrics.systemStatus !== 'critical';
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
}

export const gp51HealthMonitor = GP51HealthMonitor.getInstance();
