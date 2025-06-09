
import { supabase } from '@/integrations/supabase/client';
import { vehiclePositionSyncService } from '@/services/vehiclePosition/vehiclePositionSyncService';

interface PollingConfig {
  interval: number;
  maxRetries: number;
  backoffMultiplier: number;
  enabled: boolean;
}

interface PollingMetrics {
  totalPolls: number;
  successfulPolls: number;
  failedPolls: number;
  lastPollTime?: Date;
  lastSuccessTime?: Date;
  lastErrorTime?: Date;
  currentRetryCount: number;
}

export class EnhancedPollingService {
  private config: PollingConfig = {
    interval: 300000, // 5 minutes for full sync of all vehicles
    maxRetries: 3,
    backoffMultiplier: 2,
    enabled: true
  };

  private metrics: PollingMetrics = {
    totalPolls: 0,
    successfulPolls: 0,
    failedPolls: 0,
    currentRetryCount: 0
  };

  private pollingInterval: NodeJS.Timeout | null = null;
  private progressiveInterval: NodeJS.Timeout | null = null;
  private isPolling = false;

  constructor() {
    this.loadConfig();
    this.initializePolling();
  }

  private async loadConfig(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('gp51_polling_config')
        .select('*')
        .single();

      if (data && !error) {
        this.config.interval = data.polling_interval_seconds * 1000;
        this.config.enabled = data.is_enabled;
        console.log('Polling configuration loaded:', this.config);
      }
    } catch (error) {
      console.error('Failed to load polling config:', error);
    }
  }

  private initializePolling(): void {
    if (this.config.enabled) {
      this.startPolling();
      this.startProgressivePolling();
    }
  }

  public startPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }

    console.log(`Starting enhanced polling service with ${this.config.interval}ms interval for ALL vehicles`);
    
    // Start vehicle position sync service for all vehicles
    vehiclePositionSyncService.startPeriodicSync(this.config.interval);

    this.pollingInterval = setInterval(() => {
      this.performFullPoll();
    }, this.config.interval);

    // Perform initial poll immediately
    this.performFullPoll();
  }

  private startProgressivePolling(): void {
    if (this.progressiveInterval) {
      clearInterval(this.progressiveInterval);
    }

    console.log('Starting progressive polling for vehicles needing updates');
    
    this.progressiveInterval = setInterval(() => {
      this.performProgressivePoll();
    }, 60000); // Every minute for urgent updates
  }

  private async performFullPoll(): Promise<void> {
    if (this.isPolling) {
      console.log('Full poll already in progress, skipping...');
      return;
    }

    this.isPolling = true;
    this.metrics.totalPolls++;
    this.metrics.lastPollTime = new Date();

    try {
      console.log(`Starting full poll #${this.metrics.totalPolls} for ALL vehicles at ${this.metrics.lastPollTime.toISOString()}`);

      // Use the enhanced vehicle position sync service for all vehicles
      const syncMetrics = await vehiclePositionSyncService.forceSync();
      
      // Get detailed progress
      const progress = vehiclePositionSyncService.getSyncProgress();
      const completionPercentage = progress.completionPercentage || 0;
      
      console.log(`Full poll #${this.metrics.totalPolls} completed:`, {
        ...syncMetrics,
        progress
      });

      this.metrics.successfulPolls++;
      this.metrics.lastSuccessTime = new Date();
      this.metrics.currentRetryCount = 0;

      // Update polling status with enhanced metrics
      await this.updatePollingStatus(true, undefined, progress);

      // Alert if completion rate is low
      if (completionPercentage < 90) {
        console.warn(`⚠️  Low sync completion rate: ${completionPercentage.toFixed(2)}%`);
      }

    } catch (error) {
      console.error(`Full poll #${this.metrics.totalPolls} failed:`, error);
      
      this.metrics.failedPolls++;
      this.metrics.lastErrorTime = new Date();
      this.metrics.currentRetryCount++;

      await this.updatePollingStatus(false, error instanceof Error ? error.message : 'Unknown error');

      // Implement exponential backoff for retries
      if (this.metrics.currentRetryCount < this.config.maxRetries) {
        const backoffDelay = this.config.interval * Math.pow(this.config.backoffMultiplier, this.metrics.currentRetryCount);
        console.log(`Scheduling retry in ${backoffDelay}ms`);
        
        setTimeout(() => {
          this.performFullPoll();
        }, backoffDelay);
      } else {
        console.error('Max retries exceeded, stopping polling');
        this.stopPolling();
      }
    } finally {
      this.isPolling = false;
    }
  }

  private async performProgressivePoll(): Promise<void> {
    if (this.isPolling) {
      return; // Don't interfere with full poll
    }

    try {
      const progress = vehiclePositionSyncService.getSyncProgress();
      const vehiclesNeedingUpdates = progress.vehiclesNeedingUpdates || 0;
      
      // Only perform progressive poll if there are vehicles needing updates
      if (vehiclesNeedingUpdates > 0) {
        console.log(`Progressive poll: ${vehiclesNeedingUpdates} vehicles need position updates`);
        // The progressive sync is handled automatically by the VehiclePositionSyncService
      }
    } catch (error) {
      console.error('Progressive poll check failed:', error);
    }
  }

  public stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    if (this.progressiveInterval) {
      clearInterval(this.progressiveInterval);
      this.progressiveInterval = null;
    }

    // Stop vehicle position sync service
    vehiclePositionSyncService.stopPeriodicSync();
    console.log('Enhanced polling service stopped');
  }

  private async updatePollingStatus(success: boolean, errorMessage?: string, progress?: any): Promise<void> {
    try {
      const { error } = await supabase.rpc('update_polling_status', {
        p_last_poll_time: new Date().toISOString(),
        p_success: success,
        p_error_message: errorMessage || null
      });

      if (error) {
        console.error('Failed to update polling status:', error);
      }

      // Log progress for monitoring
      if (progress) {
        const totalVehicles = progress.totalVehicles || 0;
        const vehiclesWithRecentUpdates = progress.vehiclesWithRecentUpdates || 0;
        const vehiclesNeedingUpdates = progress.vehiclesNeedingUpdates || 0;
        const completionPercentage = progress.completionPercentage || 0;
        
        console.log(`Sync Progress - Total: ${totalVehicles}, Recent Updates: ${vehiclesWithRecentUpdates}, Needing Updates: ${vehiclesNeedingUpdates}, Completion: ${completionPercentage.toFixed(2)}%`);
      }
    } catch (error) {
      console.error('Error updating polling status:', error);
    }
  }

  public getMetrics(): PollingMetrics {
    return { ...this.metrics };
  }

  public getSyncMetrics() {
    return vehiclePositionSyncService.getMetrics();
  }

  public updateConfig(newConfig: Partial<PollingConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (newConfig.enabled !== undefined) {
      if (newConfig.enabled) {
        this.startPolling();
      } else {
        this.stopPolling();
      }
    }

    if (newConfig.interval && this.config.enabled) {
      this.startPolling(); // Restart with new interval
    }
  }

  public async validateConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      // Test connection by attempting a sync of all vehicles
      const syncMetrics = await vehiclePositionSyncService.forceSync();
      const progress = vehiclePositionSyncService.getSyncProgress();
      const completionPercentage = progress.completionPercentage || 0;
      
      const success = completionPercentage > 50; // At least 50% of vehicles should sync
      
      return { 
        success,
        error: success ? undefined : `Low completion rate: ${completionPercentage.toFixed(2)}%`
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Connection validation failed' 
      };
    }
  }
}

export const enhancedPollingService = new EnhancedPollingService();
