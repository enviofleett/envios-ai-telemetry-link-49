
import { supabase } from '@/integrations/supabase/client';
import { RedistributionResult } from './types';
import { DataValidator } from './dataValidator';

export class RedistributionService {
  async redistributeVehicles(): Promise<RedistributionResult> {
    console.log('Starting simplified vehicle redistribution...');
    const errors: string[] = [];
    const summary: string[] = [];
    let redistributed = 0;
    let skippedInvalidUsernames = 0;

    try {
      // Get all vehicles with their current assignments
      const { data: vehicles, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('id, gp51_device_id, name, user_id'); // Fixed column names

      if (vehiclesError) {
        console.error('Error fetching vehicles:', vehiclesError);
        throw vehiclesError;
      }

      // Get all users
      const { data: users, error: usersError } = await supabase
        .from('envio_users')
        .select('id, name');

      if (usersError) {
        console.error('Error fetching users:', usersError);
        throw usersError;
      }

      if (!vehicles || !users) {
        throw new Error('Failed to fetch vehicles or users');
      }

      // Simple redistribution logic - assign unassigned vehicles to users in round-robin fashion
      const unassignedVehicles = vehicles.filter(v => !v.user_id); // Fixed property name
      const availableUsers = users;

      if (unassignedVehicles.length === 0) {
        summary.push('No unassigned vehicles found');
        return {
          success: true,
          redistributed: 0,
          errors: [],
          skippedInvalidUsernames: 0,
          summary
        };
      }

      if (availableUsers.length === 0) {
        summary.push('No users available for assignment');
        return {
          success: false,
          redistributed: 0,
          errors: ['No users available for vehicle assignment'],
          skippedInvalidUsernames: 0,
          summary
        };
      }

      console.log(`Found ${unassignedVehicles.length} unassigned vehicles and ${availableUsers.length} users`);
      summary.push(`${unassignedVehicles.length} vehicles need assignment`);
      summary.push(`${availableUsers.length} users available for assignment`);

      // Assign vehicles to users in round-robin fashion
      for (let i = 0; i < unassignedVehicles.length; i++) {
        const vehicle = unassignedVehicles[i];
        const targetUser = availableUsers[i % availableUsers.length];

        const { error } = await supabase
          .from('vehicles')
          .update({ 
            user_id: targetUser.id, // Fixed property name
            updated_at: new Date().toISOString()
          })
          .eq('id', vehicle.id);

        if (error) {
          const errorMsg = `Failed to assign vehicle ${vehicle.name} to user ${targetUser.name}: ${error.message}`;
          errors.push(errorMsg);
          console.error(errorMsg);
        } else {
          redistributed++;
          const successMsg = `Assigned vehicle ${vehicle.name} to ${targetUser.name}`;
          summary.push(successMsg);
          console.log(successMsg);
        }

        // Small delay between assignments to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const finalSummary = `Redistribution complete: ${redistributed} vehicles assigned to users`;
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
