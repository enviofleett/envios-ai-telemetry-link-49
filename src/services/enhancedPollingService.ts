
import { supabase } from '@/integrations/supabase/client';
import { vehiclePositionSyncService } from '@/services/vehiclePositionSyncService';

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
    interval: 30000, // 30 seconds
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
    }
  }

  public startPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }

    console.log(`Starting enhanced polling service with ${this.config.interval}ms interval`);
    
    // Start vehicle position sync service with the same interval
    vehiclePositionSyncService.startPeriodicSync(this.config.interval);

    this.pollingInterval = setInterval(() => {
      this.performPoll();
    }, this.config.interval);

    // Perform initial poll immediately
    this.performPoll();
  }

  public stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      console.log('Polling service stopped');
    }

    // Stop vehicle position sync service
    vehiclePositionSyncService.stopPeriodicSync();
  }

  private async performPoll(): Promise<void> {
    if (this.isPolling) {
      console.log('Poll already in progress, skipping...');
      return;
    }

    this.isPolling = true;
    this.metrics.totalPolls++;
    this.metrics.lastPollTime = new Date();

    try {
      console.log(`Starting poll #${this.metrics.totalPolls} at ${this.metrics.lastPollTime.toISOString()}`);

      // Use the updated vehicle position sync service
      const syncMetrics = await vehiclePositionSyncService.forceSync();
      
      console.log(`Poll #${this.metrics.totalPolls} completed:`, syncMetrics);

      this.metrics.successfulPolls++;
      this.metrics.lastSuccessTime = new Date();
      this.metrics.currentRetryCount = 0;

      // Update polling status
      await this.updatePollingStatus(true);

    } catch (error) {
      console.error(`Poll #${this.metrics.totalPolls} failed:`, error);
      
      this.metrics.failedPolls++;
      this.metrics.lastErrorTime = new Date();
      this.metrics.currentRetryCount++;

      await this.updatePollingStatus(false, error instanceof Error ? error.message : 'Unknown error');

      // Implement exponential backoff for retries
      if (this.metrics.currentRetryCount < this.config.maxRetries) {
        const backoffDelay = this.config.interval * Math.pow(this.config.backoffMultiplier, this.metrics.currentRetryCount);
        console.log(`Scheduling retry in ${backoffDelay}ms`);
        
        setTimeout(() => {
          this.performPoll();
        }, backoffDelay);
      } else {
        console.error('Max retries exceeded, stopping polling');
        this.stopPolling();
      }
    } finally {
      this.isPolling = false;
    }
  }

  private async updatePollingStatus(success: boolean, errorMessage?: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('update_polling_status', {
        p_last_poll_time: new Date().toISOString(),
        p_success: success,
        p_error_message: errorMessage || null
      });

      if (error) {
        console.error('Failed to update polling status:', error);
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
      // Test connection by attempting a sync
      const syncMetrics = await vehiclePositionSyncService.forceSync();
      return { success: syncMetrics.positionsUpdated > 0 || syncMetrics.errors === 0 };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Connection validation failed' 
      };
    }
  }
}

export const enhancedPollingService = new EnhancedPollingService();
