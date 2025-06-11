
import { supabase } from '@/integrations/supabase/client';
import { vehiclePositionSyncService } from '@/services/vehiclePosition/vehiclePositionSyncService';

class EnhancedPollingService {
  private pollingInterval: number = 30000; // 30 seconds
  private isPolling: boolean = false;
  private pollingTimer: NodeJS.Timeout | null = null;

  constructor() {
    console.log('Enhanced polling service initialized');
  }

  startPolling() {
    if (this.isPolling) {
      console.log('Polling already active');
      return;
    }

    this.isPolling = true;
    console.log('Starting enhanced polling service');
    
    this.pollingTimer = setInterval(() => {
      this.performPollingCycle();
    }, this.pollingInterval);

    // Perform initial poll
    this.performPollingCycle();
  }

  stopPolling() {
    if (!this.isPolling) {
      console.log('Polling not active');
      return;
    }

    this.isPolling = false;
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
    console.log('Enhanced polling service stopped');
  }

  private async performPollingCycle() {
    try {
      console.log('Performing enhanced polling cycle');
      
      // Get sync progress but handle if method doesn't exist
      const syncProgress = vehiclePositionSyncService.getSyncProgress ? 
        vehiclePositionSyncService.getSyncProgress() : 
        { totalVehicles: 0, processedVehicles: 0, percentage: 0 };

      // Trigger sync if needed
      if (vehiclePositionSyncService.forceSync) {
        await vehiclePositionSyncService.forceSync();
      }

      console.log('Polling cycle completed', syncProgress);
    } catch (error) {
      console.error('Error in polling cycle:', error);
    }
  }

  setPollingInterval(interval: number) {
    this.pollingInterval = interval;
    console.log(`Polling interval set to ${interval}ms`);
    
    if (this.isPolling) {
      this.stopPolling();
      this.startPolling();
    }
  }

  getPollingStatus() {
    return {
      isPolling: this.isPolling,
      interval: this.pollingInterval,
      // Get sync progress safely
      progress: vehiclePositionSyncService.getSyncProgress ? 
        vehiclePositionSyncService.getSyncProgress() : 
        { totalVehicles: 0, processedVehicles: 0, percentage: 0 }
    };
  }

  async triggerManualSync() {
    console.log('Manual sync triggered');
    try {
      if (vehiclePositionSyncService.forceSync) {
        await vehiclePositionSyncService.forceSync();
      }
    } catch (error) {
      console.error('Manual sync failed:', error);
    }
  }

  destroy() {
    this.stopPolling();
    console.log('Enhanced polling service destroyed');
  }
}

export const enhancedPollingService = new EnhancedPollingService();
export default enhancedPollingService;
