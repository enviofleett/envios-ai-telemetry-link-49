
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
      // Find user by GP51 username using raw SQL to bypass TS2589
      const { data: userData, error: userError } = await supabase.rpc('find_user_by_gp51_username', {
        username_param: gp51Username
      });

      if (userError || !userData || userData.length === 0) {
        console.log(`No user found for GP51 username ${gp51Username}`);
        return false;
      }

      // Reconstruct user data from raw result
      const user: BasicUserResult = {
        id: userData[0].id,
        name: userData[0].name
      };

      // Link vehicle to user using raw SQL
      const { error: linkError } = await supabase.rpc('link_vehicle_to_user', {
        device_id_param: deviceId,
        user_id_param: user.id
      });

      if (linkError) {
        console.error(`Failed to auto-link vehicle ${deviceId}:`, linkError);
        return false;
      }

      console.log(`Auto-linked vehicle ${deviceId} to user ${user.name} (${gp51Username})`);
      return true;

    } catch (error) {
      // Fallback to direct queries if RPC functions don't exist
      console.warn('RPC functions not found, using fallback queries');
      
      try {
        // Simple fallback query
        const { data: userFallback, error: userFallbackError } = await supabase
          .from('envio_users')
          .select('id, name')
          .eq('gp51_username', gp51Username)
          .limit(1);

        if (userFallbackError || !userFallback || userFallback.length === 0) {
          console.log(`No user found for GP51 username ${gp51Username}`);
          return false;
        }

        const user = userFallback[0];

        // Simple update query
        const { error: updateError } = await supabase
          .from('vehicles')
          .update({ 
            user_id: user.id,
            updated_at: new Date().toISOString()
          })
          .eq('gp51_device_id', deviceId);

        if (updateError) {
          console.error(`Failed to auto-link vehicle ${deviceId}:`, updateError);
          return false;
        }

        console.log(`Auto-linked vehicle ${deviceId} to user ${user.name} (${gp51Username})`);
        return true;

      } catch (fallbackError) {
        console.error(`Auto-link failed for vehicle ${deviceId}:`, fallbackError);
        return false;
      }
    }
  }

  async autoLinkNewUser(userId: string, gp51Username?: string): Promise<number> {
    if (!DataValidator.validateGp51Username(gp51Username, `user ${userId}`)) {
      return 0;
    }

    try {
      // Find unassigned vehicles using raw SQL to bypass TS2589
      const { data: vehiclesData, error: vehiclesError } = await supabase.rpc('find_unassigned_vehicles_by_username', {
        username_param: gp51Username
      });

      if (vehiclesError) {
        console.error('Error fetching unassigned vehicles:', vehiclesError);
        return 0;
      }

      if (!vehiclesData || vehiclesData.length === 0) {
        console.log(`No unassigned vehicles found for GP51 username ${gp51Username}`);
        return 0;
      }

      // Link all matching vehicles to the user using raw SQL
      const { error: linkError } = await supabase.rpc('bulk_link_vehicles_to_user', {
        username_param: gp51Username,
        user_id_param: userId
      });

      if (linkError) {
        console.error(`Failed to auto-link vehicles for user ${userId}:`, linkError);
        return 0;
      }

      console.log(`Auto-linked ${vehiclesData.length} vehicles to user ${userId} (${gp51Username})`);
      return vehiclesData.length;

    } catch (error) {
      // Fallback to direct queries if RPC functions don't exist
      console.warn('RPC functions not found, using fallback queries');
      
      try {
        // Simple fallback query
        const { data: vehiclesFallback, error: vehiclesFallbackError } = await supabase
          .from('vehicles')
          .select('id, gp51_device_id')
          .eq('gp51_username', gp51Username)
          .is('user_id', null)
          .eq('is_active', true);

        if (vehiclesFallbackError) {
          console.error('Error fetching vehicles:', vehiclesFallbackError);
          return 0;
        }

        if (!vehiclesFallback || vehiclesFallback.length === 0) {
          console.log(`No unassigned vehicles found for GP51 username ${gp51Username}`);
          return 0;
        }

        // Simple bulk update
        const { error: updateError } = await supabase
          .from('vehicles')
          .update({ 
            user_id: userId,
            updated_at: new Date().toISOString()
          })
          .eq('gp51_username', gp51Username)
          .is('user_id', null);

        if (updateError) {
          console.error(`Failed to auto-link vehicles for user ${userId}:`, updateError);
          return 0;
        }

        console.log(`Auto-linked ${vehiclesFallback.length} vehicles to user ${userId} (${gp51Username})`);
        return vehiclesFallback.length;

      } catch (fallbackError) {
        console.error(`Auto-link failed for user ${userId}:`, fallbackError);
        return 0;
      }
    }
  }
}
