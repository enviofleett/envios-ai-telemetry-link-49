
import { supabase } from '@/integrations/supabase/client';
import { DataValidator } from './dataValidator';

// Explicit type for vehicle query result
interface VehicleQueryResult {
  id: string;
  gp51_device_id: string;
}

// Explicit type for user query result  
interface UserQueryResult {
  id: string;
  name: string;
}

export class AutoLinkingService {
  async autoLinkNewVehicle(deviceId: string, gp51Username?: string): Promise<boolean> {
    if (!DataValidator.validateGp51Username(gp51Username, `vehicle ${deviceId}`)) {
      return false;
    }

    try {
      // Find user by GP51 username with explicit typing
      const { data: user, error: userError } = await supabase
        .from('envio_users')
        .select('id, name')
        .eq('gp51_username', gp51Username)
        .single() as { data: UserQueryResult | null; error: any };

      if (userError || !user) {
        console.log(`No user found for GP51 username ${gp51Username}`);
        return false;
      }

      // Link vehicle to user - using correct column names
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
      // Find unassigned vehicles for this GP51 username with explicit typing
      const { data: vehicles, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('id, gp51_device_id')
        .eq('gp51_username', gp51Username)
        .is('user_id', null)
        .eq('is_active', true) as { data: VehicleQueryResult[] | null; error: any };

      if (vehiclesError) throw vehiclesError;

      if (!vehicles || vehicles.length === 0) {
        console.log(`No unassigned vehicles found for GP51 username ${gp51Username}`);
        return 0;
      }

      // Link all matching vehicles to the user
      const { error: linkError } = await supabase
        .from('vehicles')
        .update({ 
          user_id: userId,
          updated_at: new Date().toISOString()
        })
        .eq('gp51_username', gp51Username)
        .is('user_id', null);

      if (linkError) {
        console.error(`Failed to auto-link vehicles for user ${userId}:`, linkError);
        return 0;
      }

      console.log(`Auto-linked ${vehicles.length} vehicles to user ${userId} (${gp51Username})`);
      return vehicles.length;

    } catch (error) {
      console.error(`Auto-link failed for user ${userId}:`, error);
      return 0;
    }
  }
}
