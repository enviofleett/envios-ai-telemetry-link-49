import { supabase } from '@/integrations/supabase/client';
import { enhancedGP51SessionValidator } from './enhancedSessionValidator';
import { TimestampConverter } from './timestampConverter';
import { PollingResetService } from './pollingResetService';

interface VehicleRecord {
  device_id: string;
  device_name: string;
  last_position?: any;
}

interface SyncResult {
  success: boolean;
  updatedCount: number;
  errorCount: number;
  message: string;
}

interface SyncProgress {
  total: number;
  processed: number;
  errors: number;
  percentage: number;
  completionPercentage: number;
  vehiclesNeedingUpdates: number;
  vehiclesWithRecentUpdates: number;
  totalVehicles: number;
}

interface SyncMetrics {
  totalSyncs: number;
  successfulSyncs: number;
  failedSyncs: number;
  lastSyncTime: Date;
  averageLatency: number;
}

export class VehiclePositionSyncService {
  private static instance: VehiclePositionSyncService;
  private syncInterval: NodeJS.Timeout | null = null;
  private isSyncing = false;
  private listeners: Set<(status: string) => void> = new Set();
  private syncProgress: SyncProgress = { 
    total: 0, 
    processed: 0, 
    errors: 0, 
    percentage: 0,
    completionPercentage: 0,
    vehiclesNeedingUpdates: 0,
    vehiclesWithRecentUpdates: 0,
    totalVehicles: 0
  };
  private syncMetrics: SyncMetrics = {
    totalSyncs: 0,
    successfulSyncs: 0,
    failedSyncs: 0,
    lastSyncTime: new Date(),
    averageLatency: 0
  };

  static getInstance(): VehiclePositionSyncService {
    if (!VehiclePositionSyncService.instance) {
      VehiclePositionSyncService.instance = new VehiclePositionSyncService();
    }
    return VehiclePositionSyncService.instance;
  }

  async resetAndRestart(): Promise<void> {
    console.log('🔄 Resetting and restarting vehicle position sync...');
    
    try {
      // Stop current sync
      this.stopPeriodicSync();
      
      // Reset polling status
      await PollingResetService.forcePollingRestart();
      
      // Clear session cache and force revalidation
      enhancedGP51SessionValidator.clearCache();
      
      // Reset sync metrics
      this.syncMetrics = {
        totalSyncs: 0,
        successfulSyncs: 0,
        failedSyncs: 0,
        lastSyncTime: new Date(),
        averageLatency: 0
      };
      
      // Start fresh sync
      console.log('✅ Reset complete, starting fresh sync...');
      await this.syncActiveVehiclePositions();
      
    } catch (error) {
      console.error('❌ Failed to reset and restart sync:', error);
      throw error;
    }
  }

  startPeriodicSync(intervalMs: number = 30000): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    console.log('📡 Starting enhanced vehicle position sync with reset capability...');
    
    // Start immediately with reset
    this.resetAndRestart();
    
    this.syncInterval = setInterval(() => {
      this.syncActiveVehiclePositions();
    }, intervalMs);
  }

  stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  async syncActiveVehiclePositions(): Promise<SyncResult> {
    if (this.isSyncing) {
      console.log('Position sync: another sync in progress, skipping...');
      return { success: false, updatedCount: 0, errorCount: 0, message: 'Sync already in progress' };
    }

    this.isSyncing = true;
    this.notifyListeners('syncing');
    const startTime = Date.now();

    try {
      this.syncMetrics.totalSyncs++;

      // Validate GP51 session using enhanced validator
      console.log('🔍 Validating GP51 session with enhanced validator...');
      const sessionResult = await enhancedGP51SessionValidator.validateGP51Session();
      
      if (!sessionResult.valid) {
        throw new Error(`Enhanced session validation failed: ${sessionResult.error}`);
      }

      const apiUrl = sessionResult.apiUrl || 'https://www.gps51.com';
      console.log('✅ Enhanced session validated, API URL:', apiUrl, 'for user:', sessionResult.username);

      // Get active vehicles
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      
      const { data: vehicles, error: vehicleError } = await supabase
        .from('vehicles')
        .select('device_id, device_name, last_position')
        .eq('is_active', true)
        .or(`last_position->updatetime.gte.${twoHoursAgo},last_position.is.null`)
        .limit(500);

      if (vehicleError) {
        throw new Error(`Database error: ${vehicleError.message}`);
      }

      if (!vehicles || vehicles.length === 0) {
        console.log('No active vehicles found for position sync');
        this.syncProgress.completionPercentage = 100;
        this.syncProgress.vehiclesNeedingUpdates = 0;
        this.syncProgress.totalVehicles = 0;
        this.notifyListeners('success');
        this.syncMetrics.successfulSyncs++;
        return { success: true, updatedCount: 0, errorCount: 0, message: 'No active vehicles found' };
      }

      console.log(`🚛 Syncing positions for ${vehicles.length} active vehicles using enhanced validation...`);
      this.syncProgress = { 
        total: vehicles.length, 
        processed: 0, 
        errors: 0, 
        percentage: 0,
        completionPercentage: 0,
        vehiclesNeedingUpdates: vehicles.length,
        vehiclesWithRecentUpdates: 0,
        totalVehicles: vehicles.length
      };

      // Fetch positions from GP51
      const deviceIds = vehicles.map(v => v.device_id).filter(Boolean);
      
      if (deviceIds.length === 0) {
        throw new Error('No valid device IDs found');
      }

      const { data: positionResult, error: positionError } = await supabase.functions.invoke('gp51-service-management', {
        body: { 
          action: 'lastposition',
          deviceids: deviceIds,
          lastquerypositiontime: 0
        }
      });

      if (positionError) {
        throw new Error(`GP51 API error: ${positionError.message}`);
      }

      if (positionResult?.error) {
        throw new Error(`GP51 service error: ${positionResult.error}`);
      }

      const positions = positionResult?.records || [];
      console.log(`📍 Received ${positions.length} position records from enhanced GP51 API`);

      let updatedCount = 0;
      let errorCount = 0;

      // Update positions with enhanced timestamp conversion
      for (const position of positions) {
        try {
          const updatetime = TimestampConverter.convertToISO(position.updatetime);
          
          const { error: updateError } = await supabase
            .from('vehicles')
            .update({
              last_position: {
                lat: position.callat,
                lon: position.callon,
                speed: position.speed,
                course: position.course,
                updatetime: updatetime,
                statusText: position.strstatusen || position.strstatus
              },
              updated_at: new Date().toISOString()
            })
            .eq('device_id', position.deviceid);

          if (updateError) {
            console.error(`Failed to update vehicle ${position.deviceid}:`, updateError);
            errorCount++;
          } else {
            updatedCount++;
            console.log(`✅ Updated vehicle ${position.deviceid} with timestamp ${updatetime}`);
          }

          this.syncProgress.processed++;
          this.syncProgress.percentage = Math.round((this.syncProgress.processed / this.syncProgress.total) * 100);
          this.syncProgress.completionPercentage = this.syncProgress.percentage;

        } catch (positionError) {
          console.error(`Error processing position for ${position.deviceid}:`, positionError);
          errorCount++;
          this.syncProgress.errors++;
        }
      }

      // Update final metrics
      this.syncProgress.vehiclesWithRecentUpdates = updatedCount;
      this.syncProgress.vehiclesNeedingUpdates = Math.max(0, vehicles.length - updatedCount);
      this.syncProgress.completionPercentage = updatedCount > 0 ? Math.round((updatedCount / vehicles.length) * 100) : 0;

      const latency = Date.now() - startTime;
      this.syncMetrics.averageLatency = (this.syncMetrics.averageLatency + latency) / 2;
      this.syncMetrics.lastSyncTime = new Date();

      const message = `Enhanced sync: Updated ${updatedCount} vehicles, ${errorCount} errors using API: ${apiUrl}`;
      console.log(`✅ ${message}`);
      
      if (errorCount === 0) {
        this.syncMetrics.successfulSyncs++;
      } else {
        this.syncMetrics.failedSyncs++;
      }
      
      this.notifyListeners(errorCount > 0 ? 'partial' : 'success');
      return { success: true, updatedCount, errorCount, message };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Enhanced vehicle position sync failed:', error);
      
      // If it's a session error, clear cache and try to reset
      if (errorMessage.includes('session') || errorMessage.includes('authentication')) {
        console.log('🔄 Session error detected, clearing cache for next attempt...');
        enhancedGP51SessionValidator.clearCache();
      }
      
      this.syncMetrics.failedSyncs++;
      this.notifyListeners('failed');
      return { success: false, updatedCount: 0, errorCount: 1, message: errorMessage };
    } finally {
      this.isSyncing = false;
    }
  }

  async forceSync(): Promise<SyncResult> {
    console.log('🔄 Force syncing vehicle positions...');
    return await this.syncActiveVehiclePositions();
  }

  getSyncProgress(): SyncProgress {
    return { ...this.syncProgress };
  }

  getMetrics(): SyncMetrics {
    return { ...this.syncMetrics };
  }

  subscribeToStatus(callback: (status: string) => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners(status: string): void {
    console.log('Sync status updated:', status);
    this.listeners.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('Error notifying sync status listener:', error);
      }
    });
  }

  destroy(): void {
    this.stopPeriodicSync();
    this.listeners.clear();
  }
}

export const vehiclePositionSyncService = VehiclePositionSyncService.getInstance();
