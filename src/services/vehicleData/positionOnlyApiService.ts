
import { supabase } from '@/integrations/supabase/client';
import { unifiedGP51SessionManager } from '../unifiedGP51SessionManager';

interface GP51PositionOnly {
  deviceid: number;
  lat: number;
  lon: number;
  speed: number;
  course: number;
  updatetime: string;
  statusText?: string;
}

export class PositionOnlyApiService {
  static async fetchPositionsOnly(deviceIds: number[]): Promise<GP51PositionOnly[]> {
    if (deviceIds.length === 0) return [];

    try {
      console.log(`Fetching positions for ${deviceIds.length} devices (position-only mode)`);
      
      const session = await unifiedGP51SessionManager.validateAndEnsureSession();

      const { data: positionData, error } = await supabase.functions.invoke('gp51-service-management', {
        body: { 
          action: 'lastposition',
          deviceids: deviceIds
        }
      });

      if (error) {
        console.error('Position-only fetch error:', error);
        return [];
      }

      if (positionData?.status === 0 && positionData.positions) {
        const positions = positionData.positions.map((pos: any) => ({
          deviceid: pos.deviceid,
          lat: pos.lat,
          lon: pos.lon,
          speed: pos.speed || 0,
          course: pos.course || 0,
          updatetime: pos.updatetime,
          statusText: pos.statusText || pos.status || 'Unknown'
        }));

        console.log(`Retrieved ${positions.length} position updates`);
        return positions;
      }

      console.warn('No position data received or invalid response format');
      return [];

    } catch (error) {
      console.error('Position-only API service error:', error);
      return [];
    }
  }

  static async updateVehiclePositionsInDatabase(positions: GP51PositionOnly[]): Promise<{
    updated: number;
    errors: number;
  }> {
    let updated = 0;
    let errors = 0;

    for (const position of positions) {
      try {
        const { error } = await supabase
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
          .eq('device_id', position.deviceid.toString());

        if (error) {
          console.error(`Failed to update position for device ${position.deviceid}:`, error);
          errors++;
        } else {
          updated++;
        }
      } catch (error) {
        console.error(`Error updating position for device ${position.deviceid}:`, error);
        errors++;
      }
    }

    console.log(`Position updates completed: ${updated} updated, ${errors} errors`);
    return { updated, errors };
  }
}
