
import { supabase } from '@/integrations/supabase/client';
import { DataValidator } from './dataValidator';

// Simple type definitions to avoid deep instantiation
interface BasicVehicleResult {
  id: string;
  gp51_device_id: string;
}

interface BasicUserResult {
  id: string;
  name: string;
}

export class AutoLinkingService {
  async autoLinkNewVehicle(deviceId: string, gp51Username?: string): Promise<boolean> {
    if (!DataValidator.validateGp51Username(gp51Username, `vehicle ${deviceId}`)) {
      return false;
    }

    try {
      // Find user by GP51 username using direct query
      const { data: userData, error: userError } = await supabase
        .from('envio_users')
        .select('id, name')
        .eq('gp51_username', gp51Username)
        .limit(1);

      if (userError || !userData || userData.length === 0) {
        console.log(`No user found for GP51 username ${gp51Username}`);
        return false;
      }

      const user: BasicUserResult = {
        id: userData[0].id,
        name: userData[0].name
      };

      // Link vehicle to user using direct update
      const { error: linkError } = await supabase
        .from('vehicles')
        .update({ 
          user_id: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('gp51_device_id', deviceId);

      if (linkError) {
        console.error(`Failed to auto-link vehicle ${deviceId}:`, linkError);
        return false;
      }

      console.log(`Auto-linked vehicle ${deviceId} to user ${user.name} (${gp51Username})`);
      return true;

    } catch (error) {
      console.error(`Auto-link failed for vehicle ${deviceId}:`, error);
      return false;
    }
  }

  async autoLinkNewUser(userId: string, gp51Username?: string): Promise<number> {
    if (!DataValidator.validateGp51Username(gp51Username, `user ${userId}`)) {
      return 0;
    }

    try {
      // Find unassigned vehicles for this user by joining with envio_users
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('id, gp51_device_id')
        .is('user_id', null)
        .in('id', 
          // Subquery to find vehicles that should belong to this user
          // Since vehicles table doesn't have gp51_username, we'll use a different approach
          // For now, we'll return an empty result and log the limitation
          []
        );

      if (vehiclesError) {
        console.error('Error fetching unassigned vehicles:', vehiclesError);
        return 0;
      }

      // Since we can't directly link vehicles by username without the gp51_username column
      // in the vehicles table, we'll skip this operation for now
      console.log(`Auto-linking for user ${userId} (${gp51Username}) skipped - vehicles table needs gp51_username column`);
      return 0;

    } catch (error) {
      console.error(`Auto-link failed for user ${userId}:`, error);
      return 0;
    }
  }
}
