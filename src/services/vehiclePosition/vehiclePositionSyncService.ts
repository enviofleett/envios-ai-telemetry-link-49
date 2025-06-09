
import { supabase } from '@/integrations/supabase/client';
import { enhancedGP51SessionValidator } from './enhancedSessionValidator';
import { TimestampConverter } from './timestampConverter';
import { PollingResetService } from './pollingResetService';
import { liveDataMonitor } from '@/services/monitoring/liveDataMonitor';
import { performanceOptimizer } from '@/services/optimization/performanceOptimizer';

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

interface ProcessedPosition {
  deviceid: string;
  lat: number | null;
  lon: number | null;
  speed: number;
  course: number;
  updatetime: string;
  statusText: string;
  isValid: boolean;
  warnings: string[];
}

export class VehiclePositionSyncService {
  private static instance: VehiclePositionSyncService;
  private syncInterval: NodeJS.Timeout | null = null;
  private positionOnlyInterval: NodeJS.Timeout | null = null;
  private isSyncing = false;
  private isPositionSyncing = false;
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
    console.log('🔄 Resetting and restarting vehicle position sync with optimizations...');
    
    try {
      // Stop current sync
      this.stopPeriodicSync();
      
      // Reset polling status with retry mechanism
      await performanceOptimizer.executeWithRetry(
        () => PollingResetService.forcePollingRestart(),
        'Polling Reset'
      );
      
      // Clear session cache and force revalidation
      enhancedGP51SessionValidator.clearCache();
      
      // Reset monitoring metrics
      liveDataMonitor.reset();
      
      // Reset sync metrics
      this.syncMetrics = {
        totalSyncs: 0,
        successfulSyncs: 0,
        failedSyncs: 0,
        lastSyncTime: new Date(),
        averageLatency: 0
      };
      
      // Start fresh sync with optimized intervals
      console.log('✅ Reset complete, starting optimized sync...');
      await this.syncActiveVehiclePositions();
      
    } catch (error) {
      console.error('❌ Failed to reset and restart sync:', error);
      liveDataMonitor.recordError('api', `Reset failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  startPeriodicSync(customIntervals?: { position: number; full: number }): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    if (this.positionOnlyInterval) {
      clearInterval(this.positionOnlyInterval);
    }

    // Get optimized intervals based on system performance
    const successRate = liveDataMonitor.getSuccessRate();
    const recentErrors = liveDataMonitor.getMetrics().errors.recentErrors.length;
    const optimization = performanceOptimizer.optimizePollingStrategy(recentErrors, successRate);

    const positionInterval = customIntervals?.position || optimization.positionInterval;
    const fullSyncInterval = customIntervals?.full || optimization.fullSyncInterval;

    console.log(`📡 Starting optimized vehicle position sync:
      - Position-only sync: ${positionInterval / 1000}s
      - Full sync: ${fullSyncInterval / 1000}s
      - Load reduction: ${optimization.shouldReduceLoad ? 'enabled' : 'disabled'}`);
    
    // Start immediately with reset
    this.resetAndRestart();
    
    // Position-only sync for active vehicles (more frequent)
    this.positionOnlyInterval = setInterval(() => {
      this.syncPositionsOnly();
    }, positionInterval);

    // Full sync with all data (less frequent)
    this.syncInterval = setInterval(() => {
      this.syncActiveVehiclePositions();
    }, fullSyncInterval);
  }

  stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    if (this.positionOnlyInterval) {
      clearInterval(this.positionOnlyInterval);
      this.positionOnlyInterval = null;
    }
    console.log('🛑 Vehicle position sync stopped');
  }

  private async syncPositionsOnly(): Promise<void> {
    if (this.isPositionSyncing || this.isSyncing) {
      return;
    }

    this.isPositionSyncing = true;

    try {
      await performanceOptimizer.executeWithRetry(async () => {
        // Get active vehicles only (updated within last 5 minutes)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        
        const { data: activeVehicles, error } = await supabase
          .from('vehicles')
          .select('device_id, last_position')
          .eq('is_active', true)
          .gte('last_position->>updatetime', fiveMinutesAgo)
          .limit(100);

        if (error || !activeVehicles || activeVehicles.length === 0) {
          return;
        }

        const deviceIds = activeVehicles.map(v => parseInt(v.device_id)).filter(Boolean);
        
        if (deviceIds.length === 0) {
          return;
        }

        // Fetch only position data from GP51
        const { data: positionResult, error: positionError } = await supabase.functions.invoke('gp51-service-management', {
          body: { 
            action: 'lastposition',
            deviceids: deviceIds,
            lastquerypositiontime: 0
          }
        });

        if (positionError || positionResult?.error) {
          throw new Error(positionResult?.error || positionError?.message || 'Position sync failed');
        }

        const rawPositions = positionResult?.records || [];
        console.log(`🎯 Position-only sync: ${rawPositions.length} positions for ${deviceIds.length} active vehicles`);

        // Process and update positions
        const processedPositions = this.processPositionsWithEnhancedMonitoring(rawPositions);
        let updatedCount = 0;

        for (const position of processedPositions) {
          if (position.isValid) {
            const { error: updateError } = await supabase
              .from('vehicles')
              .update({
                last_position: {
                  lat: position.lat,
                  lon: position.lon,
                  speed: position.speed,
                  course: position.course,
                  updatetime: position.updatetime,
                  statusText: position.statusText
                },
                updated_at: new Date().toISOString()
              })
              .eq('device_id', position.deviceid);

            if (!updateError) {
              updatedCount++;
              liveDataMonitor.recordDatabaseOperation(true);
            } else {
              liveDataMonitor.recordDatabaseOperation(false, updateError.message);
            }
          }
        }

        console.log(`✅ Position-only sync completed: ${updatedCount}/${processedPositions.length} vehicles updated`);
      }, 'Position-Only Sync');

    } catch (error) {
      console.error('❌ Position-only sync failed:', error);
      liveDataMonitor.recordError('api', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      this.isPositionSyncing = false;
    }
  }

  async syncActiveVehiclePositions(): Promise<SyncResult> {
    if (this.isSyncing) {
      console.log('Full sync: another sync in progress, skipping...');
      return { success: false, updatedCount: 0, errorCount: 0, message: 'Sync already in progress' };
    }

    this.isSyncing = true;
    this.notifyListeners('syncing');
    const startTime = Date.now();

    try {
      this.syncMetrics.totalSyncs++;

      // Use retry mechanism for session validation
      const sessionResult = await performanceOptimizer.executeWithRetry(
        () => enhancedGP51SessionValidator.validateGP51Session(),
        'GP51 Session Validation'
      );
      
      if (!sessionResult.valid) {
        const error = `Enhanced session validation failed: ${sessionResult.error}`;
        liveDataMonitor.recordError('api', error);
        throw new Error(error);
      }

      const apiUrl = sessionResult.apiUrl || 'https://www.gps51.com';
      console.log('✅ Enhanced session validated, API URL:', apiUrl, 'for user:', sessionResult.username);

      // Get active vehicles with optimized query
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      
      const { data: vehicles, error: vehicleError } = await supabase
        .from('vehicles')
        .select('device_id, device_name, last_position')
        .eq('is_active', true)
        .or(`last_position->updatetime.gte.${twoHoursAgo},last_position.is.null`)
        .limit(500);

      if (vehicleError) {
        const error = `Database error: ${vehicleError.message}`;
        liveDataMonitor.recordError('database', error);
        throw new Error(error);
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

      console.log(`🚛 Enhanced full sync for ${vehicles.length} vehicles with performance optimization...`);
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

      // Fetch positions from GP51 with retry
      const deviceIds = vehicles.map(v => v.device_id).filter(Boolean);
      
      if (deviceIds.length === 0) {
        const error = 'No valid device IDs found';
        liveDataMonitor.recordError('validation', error);
        throw new Error(error);
      }

      const { data: positionResult, error: positionError } = await performanceOptimizer.executeWithRetry(
        () => supabase.functions.invoke('gp51-service-management', {
          body: { 
            action: 'lastposition',
            deviceids: deviceIds,
            lastquerypositiontime: 0
          }
        }),
        'GP51 Position Fetch'
      );

      if (positionError) {
        const error = `GP51 API error: ${positionError.message}`;
        liveDataMonitor.recordError('api', error);
        throw new Error(error);
      }

      if (positionResult?.error) {
        const error = `GP51 service error: ${positionResult.error}`;
        liveDataMonitor.recordError('api', error);
        throw new Error(error);
      }

      const rawPositions = positionResult?.records || [];
      console.log(`📍 Received ${rawPositions.length} position records from optimized GP51 API`);

      // Process positions with enhanced validation and monitoring
      const processedPositions = this.processPositionsWithEnhancedMonitoring(rawPositions);
      
      let updatedCount = 0;
      let errorCount = 0;

      // Update positions with enhanced monitoring and batch processing
      const batchSize = 10;
      for (let i = 0; i < processedPositions.length; i += batchSize) {
        const batch = processedPositions.slice(i, i + batchSize);
        
        await Promise.all(batch.map(async (processedPosition) => {
          try {
            if (!processedPosition.isValid) {
              console.warn(`Skipping invalid position for device ${processedPosition.deviceid}:`, processedPosition.warnings);
              errorCount++;
              this.syncProgress.errors++;
              liveDataMonitor.recordPositionValidation(processedPosition, false);
              return;
            }

            // Record successful position validation
            liveDataMonitor.recordPositionValidation(processedPosition, true);

            const { error: updateError } = await supabase
              .from('vehicles')
              .update({
                last_position: {
                  lat: processedPosition.lat,
                  lon: processedPosition.lon,
                  speed: processedPosition.speed,
                  course: processedPosition.course,
                  updatetime: processedPosition.updatetime,
                  statusText: processedPosition.statusText
                },
                updated_at: new Date().toISOString()
              })
              .eq('device_id', processedPosition.deviceid);

            if (updateError) {
              console.error(`Failed to update vehicle ${processedPosition.deviceid}:`, updateError);
              errorCount++;
              liveDataMonitor.recordDatabaseOperation(false, updateError.message);
            } else {
              updatedCount++;
              liveDataMonitor.recordDatabaseOperation(true);
              const timeAgo = TimestampConverter.getTimeAgo(processedPosition.updatetime);
              console.log(`✅ Updated vehicle ${processedPosition.deviceid} with timestamp ${processedPosition.updatetime} (${timeAgo})`);
              
              if (processedPosition.warnings.length > 0) {
                console.warn(`Warnings for vehicle ${processedPosition.deviceid}:`, processedPosition.warnings);
              }
            }

            this.syncProgress.processed++;
            this.syncProgress.percentage = Math.round((this.syncProgress.processed / this.syncProgress.total) * 100);
            this.syncProgress.completionPercentage = this.syncProgress.percentage;

          } catch (positionError) {
            console.error(`Error processing position for ${processedPosition.deviceid}:`, positionError);
            errorCount++;
            this.syncProgress.errors++;
            liveDataMonitor.recordError('validation', `Position processing failed: ${positionError instanceof Error ? positionError.message : 'Unknown error'}`);
          }
        }));
      }

      // Update final metrics
      this.syncProgress.vehiclesWithRecentUpdates = updatedCount;
      this.syncProgress.vehiclesNeedingUpdates = Math.max(0, vehicles.length - updatedCount);
      this.syncProgress.completionPercentage = updatedCount > 0 ? Math.round((updatedCount / vehicles.length) * 100) : 0;

      const endTime = Date.now();
      const latency = endTime - startTime;
      this.syncMetrics.averageLatency = (this.syncMetrics.averageLatency + latency) / 2;
      this.syncMetrics.lastSyncTime = new Date();

      // Record performance metrics
      liveDataMonitor.recordSyncPerformance(startTime, endTime);

      const message = `Optimized sync: Updated ${updatedCount} vehicles, ${errorCount} errors using API: ${apiUrl}`;
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
      liveDataMonitor.recordError('api', errorMessage);
      this.notifyListeners('failed');
      return { success: false, updatedCount: 0, errorCount: 1, message: errorMessage };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Process raw positions with enhanced validation, monitoring and field mapping
   */
  private processPositionsWithEnhancedMonitoring(rawPositions: any[]): ProcessedPosition[] {
    return rawPositions.map(position => {
      const warnings: string[] = [];
      let isValid = true;

      // Enhanced field mapping with multiple possible field names
      const lat = this.extractCoordinate(position, ['callat', 'lat', 'latitude'], 'latitude');
      const lon = this.extractCoordinate(position, ['callon', 'lon', 'longitude'], 'longitude');
      
      if (lat === null || lon === null) {
        isValid = false;
        warnings.push('Missing or invalid coordinates');
      }

      // Validate coordinate ranges
      if (lat !== null && (lat < -90 || lat > 90)) {
        isValid = false;
        warnings.push(`Invalid latitude: ${lat}`);
      }
      
      if (lon !== null && (lon < -180 || lon > 180)) {
        isValid = false;
        warnings.push(`Invalid longitude: ${lon}`);
      }

      // Enhanced timestamp processing with monitoring
      const rawTimestamp = position.updatetime || position.timestamp || position.time;
      let processedUpdatetime: string;
      let timestampSuccess = true;
      let isScientificNotation = false;
      
      try {
        // Check if timestamp is in scientific notation
        if (typeof rawTimestamp === 'string') {
          const scientificPattern = /^[+-]?[0-9]*\.?[0-9]+([eE][+-]?[0-9]+)$/;
          isScientificNotation = scientificPattern.test(rawTimestamp.trim());
        }
        
        processedUpdatetime = TimestampConverter.convertToISO(rawTimestamp);
        
        // Check if timestamp is recent
        if (!TimestampConverter.isRecent(processedUpdatetime, 120)) { // 2 hours
          warnings.push(`Stale position data: ${TimestampConverter.getTimeAgo(processedUpdatetime)}`);
        }
      } catch (error) {
        console.error(`Timestamp conversion failed for device ${position.deviceid}:`, error);
        processedUpdatetime = new Date().toISOString();
        warnings.push('Timestamp conversion failed, using current time');
        timestampSuccess = false;
      }

      // Record timestamp conversion monitoring
      liveDataMonitor.recordTimestampConversion(timestampSuccess, isScientificNotation);

      // Extract other fields with fallbacks
      const speed = this.extractNumericValue(position, ['speed', 'velocity'], 0);
      const course = this.extractNumericValue(position, ['course', 'direction', 'heading'], 0);
      const statusText = position.strstatusen || position.strstatus || position.status || 'Unknown';

      // Validate device ID
      if (!position.deviceid) {
        isValid = false;
        warnings.push('Missing device ID');
      }

      return {
        deviceid: position.deviceid || 'unknown',
        lat,
        lon,
        speed,
        course,
        updatetime: processedUpdatetime,
        statusText,
        isValid,
        warnings
      };
    });
  }

  /**
   * Extract coordinate value with validation
   */
  private extractCoordinate(position: any, fieldNames: string[], coordinateType: string): number | null {
    for (const fieldName of fieldNames) {
      if (fieldName in position && position[fieldName] !== null && position[fieldName] !== undefined) {
        const value = parseFloat(position[fieldName]);
        if (!isNaN(value)) {
          return value;
        }
      }
    }
    console.warn(`No valid ${coordinateType} found in position data:`, position);
    return null;
  }

  /**
   * Extract numeric value with fallback
   */
  private extractNumericValue(position: any, fieldNames: string[], defaultValue: number): number {
    for (const fieldName of fieldNames) {
      if (fieldName in position && position[fieldName] !== null && position[fieldName] !== undefined) {
        const value = parseFloat(position[fieldName]);
        if (!isNaN(value)) {
          return value;
        }
      }
    }
    return defaultValue;
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
