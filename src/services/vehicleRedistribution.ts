
import { supabase } from '@/integrations/supabase/client';

interface VehicleAssignment {
  device_id: string;
  device_name: string;
  gp51_username?: string;
  current_user_id?: string;
}

interface UserProfile {
  id: string;
  name: string;
  gp51_username?: string;
  assigned_vehicle_count: number;
}

export class VehicleRedistributionService {
  async analyzeCurrentAssignments(): Promise<{
    totalVehicles: number;
    unassignedVehicles: number;
    usersWithVehicles: number;
    redistributionNeeded: boolean;
  }> {
    console.log('Analyzing current vehicle assignments...');

    // Get vehicle assignment stats
    const { data: vehicles, error: vehiclesError } = await supabase
      .from('vehicles')
      .select('device_id, envio_user_id, gp51_username')
      .eq('is_active', true);

    if (vehiclesError) throw vehiclesError;

    // Get user stats
    const { data: users, error: usersError } = await supabase
      .from('envio_users')
      .select('id, name, gp51_username');

    if (usersError) throw usersError;

    const totalVehicles = vehicles?.length || 0;
    const unassignedVehicles = vehicles?.filter(v => !v.envio_user_id).length || 0;
    const assignedVehicles = vehicles?.filter(v => v.envio_user_id) || [];
    
    // Count unique users with vehicles
    const usersWithVehicles = new Set(assignedVehicles.map(v => v.envio_user_id)).size;

    const redistributionNeeded = usersWithVehicles < (users?.length || 0) / 2;

    console.log(`Analysis: ${totalVehicles} total vehicles, ${unassignedVehicles} unassigned, ${usersWithVehicles} users have vehicles`);

    return {
      totalVehicles,
      unassignedVehicles,
      usersWithVehicles,
      redistributionNeeded
    };
  }

  async redistributeVehicles(): Promise<{
    success: boolean;
    redistributed: number;
    errors: string[];
  }> {
    console.log('Starting vehicle redistribution...');
    const errors: string[] = [];
    let redistributed = 0;

    try {
      // Get all vehicles with their current assignments and GP51 usernames
      const { data: vehicles, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('id, device_id, device_name, envio_user_id, gp51_username')
        .eq('is_active', true);

      if (vehiclesError) throw vehiclesError;

      // Get all users
      const { data: users, error: usersError } = await supabase
        .from('envio_users')
        .select('id, name, gp51_username');

      if (usersError) throw usersError;

      if (!vehicles || !users) {
        throw new Error('Failed to fetch vehicles or users');
      }

      // Create a map of GP51 usernames to user IDs for quick lookup
      const gp51UsernameToUserId = new Map<string, string>();
      users.forEach(user => {
        if (user.gp51_username) {
          gp51UsernameToUserId.set(user.gp51_username, user.id);
        }
      });

      // Process vehicles that need redistribution
      const vehiclesToRedistribute = vehicles.filter(vehicle => {
        // Vehicle needs redistribution if:
        // 1. It has a GP51 username but no user assignment
        // 2. It has a GP51 username but is assigned to wrong user
        if (!vehicle.gp51_username) return false;

        const correctUserId = gp51UsernameToUserId.get(vehicle.gp51_username);
        return correctUserId && vehicle.envio_user_id !== correctUserId;
      });

      console.log(`Found ${vehiclesToRedistribute.length} vehicles that need redistribution`);

      // Redistribute vehicles in batches
      const batchSize = 50;
      for (let i = 0; i < vehiclesToRedistribute.length; i += batchSize) {
        const batch = vehiclesToRedistribute.slice(i, i + batchSize);
        
        for (const vehicle of batch) {
          const correctUserId = gp51UsernameToUserId.get(vehicle.gp51_username!);
          
          if (correctUserId) {
            const { error } = await supabase
              .from('vehicles')
              .update({ envio_user_id: correctUserId })
              .eq('id', vehicle.id);

            if (error) {
              errors.push(`Failed to reassign vehicle ${vehicle.device_id}: ${error.message}`);
            } else {
              redistributed++;
              console.log(`Reassigned vehicle ${vehicle.device_id} to user ${correctUserId}`);
            }
          }
        }

        // Small delay between batches to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log(`Redistribution complete: ${redistributed} vehicles reassigned`);

      return {
        success: errors.length === 0,
        redistributed,
        errors
      };

    } catch (error) {
      console.error('Vehicle redistribution failed:', error);
      return {
        success: false,
        redistributed,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  async autoLinkNewVehicle(deviceId: string, gp51Username?: string): Promise<boolean> {
    if (!gp51Username) {
      console.log(`No GP51 username provided for vehicle ${deviceId}, skipping auto-link`);
      return false;
    }

    try {
      // Find user by GP51 username
      const { data: user, error: userError } = await supabase
        .from('envio_users')
        .select('id')
        .eq('gp51_username', gp51Username)
        .single();

      if (userError || !user) {
        console.log(`No user found for GP51 username ${gp51Username}`);
        return false;
      }

      // Link vehicle to user
      const { error: linkError } = await supabase
        .from('vehicles')
        .update({ envio_user_id: user.id })
        .eq('device_id', deviceId);

      if (linkError) {
        console.error(`Failed to auto-link vehicle ${deviceId}:`, linkError);
        return false;
      }

      console.log(`Auto-linked vehicle ${deviceId} to user ${user.id}`);
      return true;

    } catch (error) {
      console.error(`Auto-link failed for vehicle ${deviceId}:`, error);
      return false;
    }
  }

  async autoLinkNewUser(userId: string, gp51Username?: string): Promise<number> {
    if (!gp51Username) {
      console.log(`No GP51 username provided for user ${userId}, skipping auto-link`);
      return 0;
    }

    try {
      // Find unassigned vehicles for this GP51 username
      const { data: vehicles, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('id, device_id')
        .eq('gp51_username', gp51Username)
        .is('envio_user_id', null)
        .eq('is_active', true);

      if (vehiclesError) throw vehiclesError;

      if (!vehicles || vehicles.length === 0) {
        console.log(`No unassigned vehicles found for GP51 username ${gp51Username}`);
        return 0;
      }

      // Link all matching vehicles to the user
      const { error: linkError } = await supabase
        .from('vehicles')
        .update({ envio_user_id: userId })
        .eq('gp51_username', gp51Username)
        .is('envio_user_id', null);

      if (linkError) {
        console.error(`Failed to auto-link vehicles for user ${userId}:`, linkError);
        return 0;
      }

      console.log(`Auto-linked ${vehicles.length} vehicles to user ${userId}`);
      return vehicles.length;

    } catch (error) {
      console.error(`Auto-link failed for user ${userId}:`, error);
      return 0;
    }
  }
}

export const vehicleRedistributionService = new VehicleRedistributionService();
