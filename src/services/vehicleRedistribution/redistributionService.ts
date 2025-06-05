
import { supabase } from '@/integrations/supabase/client';
import { RedistributionResult } from './types';
import { DataValidator } from './dataValidator';

export class RedistributionService {
  async redistributeVehicles(): Promise<RedistributionResult> {
    console.log('Starting enhanced vehicle redistribution...');
    const errors: string[] = [];
    const summary: string[] = [];
    let redistributed = 0;
    let skippedInvalidUsernames = 0;

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
      const validUsernames = new Set<string>();
      
      users.forEach(user => {
        if (DataValidator.isValidGp51Username(user.gp51_username)) {
          gp51UsernameToUserId.set(user.gp51_username!, user.id);
          validUsernames.add(user.gp51_username!);
        }
      });

      console.log(`Found ${validUsernames.size} valid GP51 usernames in user database`);
      summary.push(`Found ${validUsernames.size} users with valid GP51 usernames`);

      // Filter vehicles that need redistribution
      const vehiclesToRedistribute = vehicles.filter(vehicle => {
        // Skip vehicles without GP51 username or with invalid usernames
        if (!DataValidator.isValidGp51Username(vehicle.gp51_username)) {
          skippedInvalidUsernames++;
          return false;
        }

        const correctUserId = gp51UsernameToUserId.get(vehicle.gp51_username!);
        
        // Skip if no matching user found
        if (!correctUserId) {
          console.log(`No user found for GP51 username: ${vehicle.gp51_username}`);
          skippedInvalidUsernames++;
          return false;
        }

        // Vehicle needs redistribution if it's not assigned to the correct user
        return vehicle.envio_user_id !== correctUserId;
      });

      console.log(`Found ${vehiclesToRedistribute.length} vehicles that need redistribution`);
      console.log(`Skipping ${skippedInvalidUsernames} vehicles with invalid/missing GP51 usernames`);
      
      summary.push(`${vehiclesToRedistribute.length} vehicles need redistribution`);
      summary.push(`${skippedInvalidUsernames} vehicles skipped (invalid GP51 usernames)`);

      // Group vehicles by target user for batch processing
      const vehiclesByTargetUser = new Map<string, typeof vehiclesToRedistribute>();
      
      vehiclesToRedistribute.forEach(vehicle => {
        const targetUserId = gp51UsernameToUserId.get(vehicle.gp51_username!)!;
        if (!vehiclesByTargetUser.has(targetUserId)) {
          vehiclesByTargetUser.set(targetUserId, []);
        }
        vehiclesByTargetUser.get(targetUserId)!.push(vehicle);
      });

      // Process redistribution in batches by user
      for (const [targetUserId, userVehicles] of vehiclesByTargetUser) {
        const targetUser = users.find(u => u.id === targetUserId);
        console.log(`Assigning ${userVehicles.length} vehicles to user: ${targetUser?.name} (${targetUser?.gp51_username})`);
        
        const vehicleIds = userVehicles.map(v => v.id);
        
        // Batch update all vehicles for this user
        const { error } = await supabase
          .from('vehicles')
          .update({ 
            envio_user_id: targetUserId,
            updated_at: new Date().toISOString()
          })
          .in('id', vehicleIds);

        if (error) {
          const errorMsg = `Failed to assign ${userVehicles.length} vehicles to user ${targetUser?.name}: ${error.message}`;
          errors.push(errorMsg);
          console.error(errorMsg);
        } else {
          redistributed += userVehicles.length;
          const successMsg = `Assigned ${userVehicles.length} vehicles to ${targetUser?.name} (${targetUser?.gp51_username})`;
          summary.push(successMsg);
          console.log(successMsg);
        }

        // Small delay between user batches to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const finalSummary = `Redistribution complete: ${redistributed} vehicles reassigned to ${vehiclesByTargetUser.size} users`;
      summary.push(finalSummary);
      console.log(finalSummary);

      return {
        success: errors.length === 0,
        redistributed,
        errors,
        skippedInvalidUsernames,
        summary
      };

    } catch (error) {
      console.error('Vehicle redistribution failed:', error);
      return {
        success: false,
        redistributed,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        skippedInvalidUsernames,
        summary: ['Redistribution failed due to unexpected error']
      };
    }
  }
}
