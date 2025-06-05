
import { supabase } from '@/integrations/supabase/client';
import { telemetryApi } from '@/services/telemetryApi';
import type { VehiclePositionData } from './types';

export class VehiclePositionProcessor {
  async fetchAndUpdateVehiclePositions(vehicles: any[]): Promise<{ updatedCount: number; errors: number }> {
    let updatedCount = 0;
    let errors = 0;

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
          errors++;
        } else {
          updatedCount++;
        }
      } catch (error) {
        console.error(`Error updating vehicle ${position.deviceid}:`, error);
        errors++;
      }
    }

    return { updatedCount, errors };
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
}

export const vehiclePositionProcessor = new VehiclePositionProcessor();
