
import { supabase } from '@/integrations/supabase/client';

interface VehicleRecord {
  device_id: string;
  device_name: string;
  is_active: boolean;
  gp51_username: string;
}

interface ProcessingResult {
  updatedCount: number;
  errors: number;
}

export class VehiclePositionProcessor {
  async fetchAndUpdateVehiclePositions(vehicles: VehicleRecord[]): Promise<ProcessingResult> {
    console.log(`Starting position fetch for ${vehicles.length} vehicles`);
    
    let updatedCount = 0;
    let errors = 0;

    try {
      // Get active GP51 session
      const { data: session, error: sessionError } = await supabase
        .from('gp51_sessions')
        .select('gp51_token, username, token_expires_at')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (sessionError || !session) {
        throw new Error('No active GP51 session found');
      }

      // Check if token is still valid
      if (new Date(session.token_expires_at) < new Date()) {
        throw new Error('GP51 session token has expired');
      }

      console.log(`Using GP51 session for user: ${session.username}`);

      // Fetch positions from GP51 for all devices
      const deviceIds = vehicles.map(v => v.device_id);
      
      const positionPayload = {
        deviceids: deviceIds,
        lastquerypositiontime: ""
      };

      const response = await fetch(`https://www.gps51.com/webapi?action=lastposition&token=${encodeURIComponent(session.gp51_token)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(positionPayload),
      });

      if (!response.ok) {
        throw new Error(`GP51 API request failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.status !== 0) {
        throw new Error(`GP51 API error: ${result.cause || 'Unknown error'}`);
      }

      const positions = result.records || [];
      console.log(`Received ${positions.length} position records from GP51`);

      // Update vehicle positions in database
      for (const position of positions) {
        try {
          const { error: updateError } = await supabase
            .from('vehicles')
            .update({
              last_position: {
                lat: position.callat,
                lon: position.callon,
                speed: position.speed,
                course: position.course,
                updatetime: position.updatetime,
                statusText: position.strstatusen
              },
              updated_at: new Date().toISOString()
            })
            .eq('device_id', position.deviceid);

          if (updateError) {
            console.error(`Failed to update vehicle ${position.deviceid}:`, updateError);
            errors++;
          } else {
            updatedCount++;
          }
        } catch (error) {
          console.error(`Error updating vehicle ${position.deviceid}:`, error);
          errors++;
        }
      }

      console.log(`Position update completed: ${updatedCount} updated, ${errors} errors`);

    } catch (error) {
      console.error('Position fetch failed:', error);
      throw new Error(`Failed to fetch positions from GP51: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return { updatedCount, errors };
  }
}

export const vehiclePositionProcessor = new VehiclePositionProcessor();
