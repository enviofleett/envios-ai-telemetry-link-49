import { supabase } from '@/integrations/supabase/client';
import type { GP51ProcessedPosition } from '@/services/gp51/GP51DataService';

export interface VehiclePersistenceResult {
  success: boolean;
  vehicleId?: string;
  deviceId: string;
  action: 'created' | 'updated' | 'skipped' | 'error';
  error?: string;
  vehicleStatus?: 'online' | 'offline' | 'inactive' | 'unknown';
}

export interface VehiclePersistenceOptions {
  overwriteStrategy: 'update' | 'skip';
  batchSize?: number;
}

class GP51VehiclePersistenceService {
  private static instance: GP51VehiclePersistenceService;

  static getInstance(): GP51VehiclePersistenceService {
    if (!GP51VehiclePersistenceService.instance) {
      GP51VehiclePersistenceService.instance = new GP51VehiclePersistenceService();
    }
    return GP51VehiclePersistenceService.instance;
  }

  private log(level: 'info' | 'error' | 'warn', message: string, data?: any): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [GP51Persistence] ${message}`;
    
    if (level === 'error') {
      console.error(logMessage, data);
    } else if (level === 'warn') {
      console.warn(logMessage, data);
    } else {
      console.log(logMessage, data);
    }
  }

  private determineVehicleStatus(gp51Vehicle: GP51ProcessedPosition): 'online' | 'offline' | 'inactive' | 'unknown' {
    if (!gp51Vehicle.timestamp) {
      return 'unknown';
    }

    const lastUpdateTime = gp51Vehicle.timestamp.getTime();
    const now = Date.now();
    const timeDifference = now - lastUpdateTime;

    // Consider vehicle online if last update was within 15 minutes
    if (timeDifference <= 15 * 60 * 1000) {
      return gp51Vehicle.isOnline ? 'online' : 'offline';
    }

    // Consider vehicle offline if last update was within 24 hours
    if (timeDifference <= 24 * 60 * 60 * 1000) {
      return 'offline';
    }

    // Consider vehicle inactive if no update for more than 24 hours
    return 'inactive';
  }

  private mapGP51ToSupabaseVehicle(gp51Vehicle: GP51ProcessedPosition) {
    const vehicleStatus = this.determineVehicleStatus(gp51Vehicle);
    const importTimestamp = new Date().toISOString();

    return {
      device_id: gp51Vehicle.deviceId,
      device_name: gp51Vehicle.deviceName || gp51Vehicle.deviceId,
      is_active: gp51Vehicle.isOnline,
      gp51_username: null, // Will be set from session if available
      gp51_metadata: {
        latitude: gp51Vehicle.latitude,
        longitude: gp51Vehicle.longitude,
        speed: gp51Vehicle.speed,
        course: gp51Vehicle.course,
        status: gp51Vehicle.status,
        statusText: gp51Vehicle.statusText,
        timestamp: gp51Vehicle.timestamp.toISOString(),
        isMoving: gp51Vehicle.isMoving,
        vehicleStatus,
        importedAt: importTimestamp,
        lastGP51Sync: importTimestamp,
        importSource: 'gp51_comprehensive'
      },
      // Set defaults for required fields that aren't available from GP51
      make: null,
      model: null,
      year: null,
      color: null,
      license_plate: null,
      envio_user_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  async saveVehiclesToSupabase(
    vehicles: GP51ProcessedPosition[], 
    options: VehiclePersistenceOptions,
    onProgress?: (processed: number, total: number, result: VehiclePersistenceResult) => void
  ): Promise<VehiclePersistenceResult[]> {
    const results: VehiclePersistenceResult[] = [];
    const batchSize = options.batchSize || 10;
    
    this.log('info', `Starting comprehensive vehicle persistence for ${vehicles.length} vehicles`, {
      overwriteStrategy: options.overwriteStrategy,
      batchSize,
      vehicleTypes: this.getVehicleStatusDistribution(vehicles)
    });

    // Process vehicles in batches to avoid overwhelming the database
    for (let i = 0; i < vehicles.length; i += batchSize) {
      const batch = vehicles.slice(i, i + batchSize);
      const batchResults = await this.processBatch(batch, options);
      
      results.push(...batchResults);
      
      // Report progress for each vehicle in the batch
      batchResults.forEach((result, index) => {
        if (onProgress) {
          onProgress(i + index + 1, vehicles.length, result);
        }
      });

      // Small delay between batches to prevent overwhelming the database
      if (i + batchSize < vehicles.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    const summary = this.generateImportSummary(results, vehicles);
    this.log('info', `Comprehensive vehicle persistence completed`, summary);

    return results;
  }

  private getVehicleStatusDistribution(vehicles: GP51ProcessedPosition[]) {
    const distribution = {
      online: 0,
      offline: 0,
      inactive: 0,
      unknown: 0
    };

    vehicles.forEach(vehicle => {
      const status = this.determineVehicleStatus(vehicle);
      distribution[status]++;
    });

    return distribution;
  }

  private generateImportSummary(results: VehiclePersistenceResult[], vehicles: GP51ProcessedPosition[]) {
    const statusDistribution = this.getVehicleStatusDistribution(vehicles);
    
    return {
      total: vehicles.length,
      created: results.filter(r => r.action === 'created').length,
      updated: results.filter(r => r.action === 'updated').length,
      skipped: results.filter(r => r.action === 'skipped').length,
      errors: results.filter(r => r.action === 'error').length,
      vehicleStatusDistribution: statusDistribution,
      successRate: ((results.filter(r => r.success).length / results.length) * 100).toFixed(2) + '%'
    };
  }

  private async processBatch(
    vehicles: GP51ProcessedPosition[], 
    options: VehiclePersistenceOptions
  ): Promise<VehiclePersistenceResult[]> {
    const results: VehiclePersistenceResult[] = [];

    for (const vehicle of vehicles) {
      try {
        const result = await this.saveVehicle(vehicle, options);
        results.push(result);
      } catch (error) {
        this.log('error', `Failed to process vehicle ${vehicle.deviceId}`, error);
        results.push({
          success: false,
          deviceId: vehicle.deviceId,
          action: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
          vehicleStatus: this.determineVehicleStatus(vehicle)
        });
      }
    }

    return results;
  }

  private async saveVehicle(
    gp51Vehicle: GP51ProcessedPosition,
    options: VehiclePersistenceOptions
  ): Promise<VehiclePersistenceResult> {
    const vehicleStatus = this.determineVehicleStatus(gp51Vehicle);

    // First, check if vehicle already exists
    const { data: existingVehicle, error: checkError } = await supabase
      .from('vehicles')
      .select('id, device_id, updated_at, gp51_metadata')
      .eq('device_id', gp51Vehicle.deviceId)
      .maybeSingle();

    if (checkError) {
      throw new Error(`Database check failed: ${checkError.message}`);
    }

    const vehicleData = this.mapGP51ToSupabaseVehicle(gp51Vehicle);

    if (existingVehicle) {
      // Vehicle exists - handle based on overwrite strategy
      if (options.overwriteStrategy === 'skip') {
        this.log('info', `Skipping existing vehicle: ${gp51Vehicle.deviceId} (${vehicleStatus})`);
        return {
          success: true,
          vehicleId: existingVehicle.id,
          deviceId: gp51Vehicle.deviceId,
          action: 'skipped',
          vehicleStatus
        };
      }

      // Update existing vehicle with comprehensive data
      const { data: updatedVehicle, error: updateError } = await supabase
        .from('vehicles')
        .update({
          device_name: vehicleData.device_name,
          is_active: vehicleData.is_active,
          gp51_metadata: {
            ...existingVehicle.gp51_metadata,
            ...vehicleData.gp51_metadata,
            previousStatus: existingVehicle.gp51_metadata?.vehicleStatus,
            statusHistory: [
              ...(existingVehicle.gp51_metadata?.statusHistory || []),
              {
                status: vehicleStatus,
                timestamp: new Date().toISOString()
              }
            ].slice(-10) // Keep last 10 status changes
          },
          updated_at: vehicleData.updated_at
        })
        .eq('id', existingVehicle.id)
        .select('id')
        .single();

      if (updateError) {
        throw new Error(`Update failed: ${updateError.message}`);
      }

      this.log('info', `Updated vehicle: ${gp51Vehicle.deviceId} (${vehicleStatus})`);
      return {
        success: true,
        vehicleId: updatedVehicle.id,
        deviceId: gp51Vehicle.deviceId,
        action: 'updated',
        vehicleStatus
      };
    } else {
      // Create new vehicle
      const { data: newVehicle, error: insertError } = await supabase
        .from('vehicles')
        .insert(vehicleData)
        .select('id')
        .single();

      if (insertError) {
        throw new Error(`Insert failed: ${insertError.message}`);
      }

      this.log('info', `Created vehicle: ${gp51Vehicle.deviceId} (${vehicleStatus})`);
      return {
        success: true,
        vehicleId: newVehicle.id,
        deviceId: gp51Vehicle.deviceId,
        action: 'created',
        vehicleStatus
      };
    }
  }

  async assignUserToVehicle(vehicleId: string, userId: string | null): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('vehicles')
        .update({ 
          envio_user_id: userId,
          updated_at: new Date().toISOString()
        })
        .eq('id', vehicleId);

      if (error) {
        this.log('error', `Failed to assign user to vehicle: ${vehicleId}`, error);
        return false;
      }

      this.log('info', `Assigned user ${userId} to vehicle ${vehicleId}`);
      return true;
    } catch (error) {
      this.log('error', `User assignment failed`, error);
      return false;
    }
  }

  async getImportStats(): Promise<{
    totalVehicles: number;
    importedVehicles: number;
    assignedVehicles: number;
    statusDistribution: {
      online: number;
      offline: number;
      inactive: number;
      unknown: number;
    };
    lastImportDate?: Date;
  }> {
    try {
      const { data: stats, error } = await supabase
        .from('vehicles')
        .select('id, envio_user_id, gp51_metadata, created_at')
        .not('gp51_metadata', 'is', null);

      if (error) {
        throw error;
      }

      const importedVehicles = stats?.length || 0;
      const assignedVehicles = stats?.filter(v => v.envio_user_id).length || 0;
      const lastImportDate = stats && stats.length > 0 
        ? new Date(Math.max(...stats.map(v => new Date(v.created_at).getTime())))
        : undefined;

      // Calculate status distribution
      const statusDistribution = {
        online: 0,
        offline: 0,
        inactive: 0,
        unknown: 0
      };

      stats?.forEach(vehicle => {
        const status = vehicle.gp51_metadata?.vehicleStatus || 'unknown';
        if (status in statusDistribution) {
          statusDistribution[status as keyof typeof statusDistribution]++;
        }
      });

      // Get total vehicle count
      const { count: totalVehicles } = await supabase
        .from('vehicles')
        .select('*', { count: 'exact', head: true });

      return {
        totalVehicles: totalVehicles || 0,
        importedVehicles,
        assignedVehicles,
        statusDistribution,
        lastImportDate
      };
    } catch (error) {
      this.log('error', 'Failed to get import stats', error);
      return {
        totalVehicles: 0,
        importedVehicles: 0,
        assignedVehicles: 0,
        statusDistribution: {
          online: 0,
          offline: 0,
          inactive: 0,
          unknown: 0
        }
      };
    }
  }
}

export const gp51VehiclePersistenceService = GP51VehiclePersistenceService.getInstance();
