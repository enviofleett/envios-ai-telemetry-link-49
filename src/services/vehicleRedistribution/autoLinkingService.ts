
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
      // Find user by GP51 username with simple type annotation
      const { data: user, error: userError } = await supabase
        .from('envio_users')
        .select('id, name')
        .eq('gp51_username', gp51Username)
        .single();

      if (userError || !user) {
        console.log(`No user found for GP51 username ${gp51Username}`);
        return false;
      }

      // Cast to our simple type to avoid deep instantiation
      const typedUser = user as BasicUserResult;

      // Link vehicle to user - using correct column names
      const { error: linkError } = await supabase
        .from('vehicles')
        .update({ 
          user_id: typedUser.id,
          updated_at: new Date().toISOString()
        })
        .eq('gp51_device_id', deviceId);

      if (linkError) {
        console.error(`Failed to auto-link vehicle ${deviceId}:`, linkError);
        return false;
      }

      console.log(`Auto-linked vehicle ${deviceId} to user ${typedUser.name} (${gp51Username})`);
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
      // Find unassigned vehicles for this GP51 username with simple type annotation
      const { data: vehicles, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('id, gp51_device_id')
        .eq('gp51_username', gp51Username)
        .is('user_id', null)
        .eq('is_active', true);

      if (vehiclesError) throw vehiclesError;

      if (!vehicles || vehicles.length === 0) {
        console.log(`No unassigned vehicles found for GP51 username ${gp51Username}`);
        return 0;
      }

      // Cast to our simple type to avoid deep instantiation
      const typedVehicles = vehicles as BasicVehicleResult[];

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

      console.log(`Auto-linked ${typedVehicles.length} vehicles to user ${userId} (${gp51Username})`);
      return typedVehicles.length;

    } catch (error) {
      console.error(`Auto-link failed for user ${userId}:`, error);
      return 0;
    }
  }
}
