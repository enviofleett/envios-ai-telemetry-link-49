
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
      // Find user by GP51 username - completely bypass Supabase type inference
      const userQueryResult = await supabase
        .from('envio_users')
        .select('id, name')
        .eq('gp51_username', gp51Username)
        .single();

      // Cast to any immediately to break type chain
      const userQuery = userQueryResult as any;

      if (userQuery.error || !userQuery.data) {
        console.log(`No user found for GP51 username ${gp51Username}`);
        return false;
      }

      // Explicitly type the user data
      const user: BasicUserResult = {
        id: userQuery.data.id,
        name: userQuery.data.name
      };

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
      // Find unassigned vehicles - completely bypass Supabase type inference
      const vehiclesQueryResult = await supabase
        .from('vehicles')
        .select('id, gp51_device_id')
        .eq('gp51_username', gp51Username)
        .is('user_id', null)
        .eq('is_active', true);

      // Cast to any immediately to break type chain
      const vehiclesQuery = vehiclesQueryResult as any;

      if (vehiclesQuery.error) throw vehiclesQuery.error;

      if (!vehiclesQuery.data || vehiclesQuery.data.length === 0) {
        console.log(`No unassigned vehicles found for GP51 username ${gp51Username}`);
        return 0;
      }

      // Explicitly type the vehicles data to break complex inference
      const vehicles: BasicVehicleResult[] = vehiclesQuery.data.map((v: any) => ({
        id: v.id,
        gp51_device_id: v.gp51_device_id
      }));

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
