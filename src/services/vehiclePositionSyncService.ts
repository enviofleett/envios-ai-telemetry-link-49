
import { supabase } from '@/integrations/supabase/client';
import { telemetryApi } from '@/services/telemetryApi';

interface VehiclePositionData {
  deviceid: string;
  lat: number;
  lon: number;
  speed: number;
  course: number;
  updatetime: string;
  statusText: string;
}

interface SyncMetrics {
  totalVehicles: number;
  positionsUpdated: number;
  errors: number;
  lastSyncTime: Date;
}

export class VehiclePositionSyncService {
  private syncInterval: NodeJS.Timeout | null = null;
  private isSyncing = false;
  private metrics: SyncMetrics = {
    totalVehicles: 0,
    positionsUpdated: 0,
    errors: 0,
    lastSyncTime: new Date()
  };

  constructor() {
    this.initializeSync();
  }

  private async initializeSync(): Promise<void> {
    console.log('Initializing vehicle position sync service...');
    
    // Check if we have an active GP51 session with consistent username
    const sessionValidation = await this.validateGP51Session();
    if (!sessionValidation.valid) {
      console.warn('GP51 session validation failed:', sessionValidation.error);
    }

    // Start periodic sync
    this.startPeriodicSync();
  }

  private async validateGP51Session(): Promise<{ valid: boolean; error?: string }> {
    try {
      // Get the admin username from envio_users
      const { data: adminUsers, error: adminError } = await supabase
        .from('envio_users')
        .select('gp51_username')
        .not('gp51_username', 'is', null)
        .limit(1);

      if (adminError || !adminUsers || adminUsers.length === 0) {
        return { valid: false, error: 'No admin GP51 username found' };
      }

      const adminUsername = adminUsers[0].gp51_username;

      // Check if we have a valid session for this username
      const { data: sessions, error: sessionError } = await supabase
        .from('gp51_sessions')
        .select('*')
        .eq('username', adminUsername)
        .order('created_at', { ascending: false })
        .limit(1);

      if (sessionError || !sessions || sessions.length === 0) {
        return { valid: false, error: `No GP51 session found for username: ${adminUsername}` };
      }

      const session = sessions[0];

      // Check if session is still valid
      if (new Date(session.token_expires_at) <= new Date()) {
        return { valid: false, error: 'GP51 session expired' };
      }

      console.log(`Valid GP51 session found for username: ${adminUsername}`);
      return { valid: true };

    } catch (error) {
      return { 
        valid: false, 
        error: error instanceof Error ? error.message : 'Session validation failed' 
      };
    }
  }

  public startPeriodicSync(intervalMs: number = 30000): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    console.log(`Starting vehicle position sync with ${intervalMs}ms interval`);
    
    // Perform initial sync
    this.syncVehiclePositions();

    // Set up periodic sync
    this.syncInterval = setInterval(() => {
      this.syncVehiclePositions();
    }, intervalMs);
  }

  public stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('Vehicle position sync stopped');
    }
  }

  public async syncVehiclePositions(): Promise<SyncMetrics> {
    if (this.isSyncing) {
      console.log('Position sync already in progress, skipping...');
      return this.metrics;
    }

    this.isSyncing = true;
    console.log('Starting vehicle position sync...');

    try {
      // Validate session before attempting sync
      const sessionValidation = await this.validateGP51Session();
      if (!sessionValidation.valid) {
        throw new Error(`GP51 session invalid: ${sessionValidation.error}`);
      }

      // Get all active vehicles from the database
      const { data: vehicles, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('device_id, device_name, is_active, gp51_username')
        .eq('is_active', true);

      if (vehiclesError) {
        throw new Error(`Failed to fetch vehicles: ${vehiclesError.message}`);
      }

      if (!vehicles || vehicles.length === 0) {
        console.log('No active vehicles found for position sync');
        this.metrics.totalVehicles = 0;
        return this.metrics;
      }

      this.metrics.totalVehicles = vehicles.length;
      console.log(`Syncing positions for ${vehicles.length} active vehicles`);

      // Check for username consistency in vehicles
      const uniqueUsernames = new Set(vehicles.map(v => v.gp51_username).filter(Boolean));
      if (uniqueUsernames.size > 1) {
        console.warn('Multiple GP51 usernames found in vehicles:', Array.from(uniqueUsernames));
      }

      // Get device IDs for position request
      const deviceIds = vehicles.map(v => v.device_id);

      // Fetch positions from GP51 using the telemetry API
      const positionsResult = await telemetryApi.getVehiclePositions(deviceIds);

      if (!positionsResult.success) {
        throw new Error(`Failed to fetch positions from GP51: ${positionsResult.error}`);
      }

      const positions = positionsResult.positions || [];
      console.log(`Received ${positions.length} position updates from GP51`);

      // Update vehicle positions in database
      let updatedCount = 0;
      for (const position of positions) {
        try {
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
              status: this.determineVehicleStatus(position),
              updated_at: new Date().toISOString()
            })
            .eq('device_id', position.deviceid);

          if (updateError) {
            console.error(`Failed to update position for vehicle ${position.deviceid}:`, updateError);
            this.metrics.errors++;
          } else {
            updatedCount++;
          }
        } catch (error) {
          console.error(`Error updating vehicle ${position.deviceid}:`, error);
          this.metrics.errors++;
        }
      }

      this.metrics.positionsUpdated = updatedCount;
      this.metrics.lastSyncTime = new Date();

      console.log(`Position sync completed: ${updatedCount} vehicles updated`);

      // Update sync status in database
      await this.updateSyncStatus(true);

      return this.metrics;

    } catch (error) {
      console.error('Vehicle position sync failed:', error);
      this.metrics.errors++;
      await this.updateSyncStatus(false, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    } finally {
      this.isSyncing = false;
    }
  }

  private determineVehicleStatus(position: VehiclePositionData): string {
    const now = new Date();
    const positionTime = new Date(position.updatetime);
    const timeDiff = now.getTime() - positionTime.getTime();
    const minutesDiff = timeDiff / (1000 * 60);

    // Consider vehicle offline if position is older than 30 minutes
    if (minutesDiff > 30) {
      return 'offline';
    }

    // Determine status based on speed
    if (position.speed > 5) {
      return 'moving';
    } else if (position.speed <= 5 && position.speed >= 0) {
      return 'stopped';
    }

    return position.statusText || 'unknown';
  }

  private async updateSyncStatus(success: boolean, errorMessage?: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('update_polling_status', {
        p_last_poll_time: new Date().toISOString(),
        p_success: success,
        p_error_message: errorMessage || null
      });

      if (error) {
        console.error('Failed to update sync status:', error);
      }
    } catch (error) {
      console.error('Error updating sync status:', error);
    }
  }

  public getMetrics(): SyncMetrics {
    return { ...this.metrics };
  }

  public async forceSync(): Promise<SyncMetrics> {
    console.log('Force syncing vehicle positions...');
    return await this.syncVehiclePositions();
  }
}

export const vehiclePositionSyncService = new VehiclePositionSyncService();
