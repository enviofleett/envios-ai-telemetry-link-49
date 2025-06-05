
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
    validGp51Usernames: number;
    invalidGp51Usernames: number;
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

    // Check for valid GP51 usernames (not empty, null, or generic "User")
    const validGp51Usernames = vehicles?.filter(v => 
      v.gp51_username && 
      v.gp51_username.trim() !== '' && 
      v.gp51_username !== 'User'
    ).length || 0;

    const invalidGp51Usernames = totalVehicles - validGp51Usernames;

    // Create a map of GP51 usernames to user IDs for redistribution check
    const gp51UsernameToUserId = new Map<string, string>();
    users?.forEach(user => {
      if (user.gp51_username && user.gp51_username.trim() !== '' && user.gp51_username !== 'User') {
        gp51UsernameToUserId.set(user.gp51_username, user.id);
      }
    });

    // Check if redistribution is needed based on multiple factors
    const hasUnassignedVehiclesWithValidUsernames = vehicles?.some(v => 
      !v.envio_user_id && 
      v.gp51_username && 
      v.gp51_username.trim() !== '' && 
      v.gp51_username !== 'User' &&
      gp51UsernameToUserId.has(v.gp51_username)
    ) || false;

    const hasIncorrectlyAssignedVehicles = vehicles?.some(v => 
      v.envio_user_id && 
      v.gp51_username && 
      v.gp51_username.trim() !== '' && 
      v.gp51_username !== 'User' &&
      gp51UsernameToUserId.has(v.gp51_username) &&
      gp51UsernameToUserId.get(v.gp51_username) !== v.envio_user_id
    ) || false;

    const redistributionNeeded = hasUnassignedVehiclesWithValidUsernames || hasIncorrectlyAssignedVehicles;

    console.log(`Analysis: ${totalVehicles} total vehicles, ${unassignedVehicles} unassigned, ${usersWithVehicles} users have vehicles`);
    console.log(`Valid GP51 usernames: ${validGp51Usernames}, Invalid: ${invalidGp51Usernames}`);
    console.log(`Redistribution needed: ${redistributionNeeded}`);

    return {
      totalVehicles,
      unassignedVehicles,
      usersWithVehicles,
      redistributionNeeded,
      validGp51Usernames,
      invalidGp51Usernames
    };
  }

  async redistributeVehicles(): Promise<{
    success: boolean;
    redistributed: number;
    errors: string[];
    skippedInvalidUsernames: number;
    summary: string[];
  }> {
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
        if (user.gp51_username && user.gp51_username.trim() !== '' && user.gp51_username !== 'User') {
          gp51UsernameToUserId.set(user.gp51_username, user.id);
          validUsernames.add(user.gp51_username);
        }
      });

      console.log(`Found ${validUsernames.size} valid GP51 usernames in user database`);
      summary.push(`Found ${validUsernames.size} users with valid GP51 usernames`);

      // Filter vehicles that need redistribution
      const vehiclesToRedistribute = vehicles.filter(vehicle => {
        // Skip vehicles without GP51 username or with invalid usernames
        if (!vehicle.gp51_username || 
            vehicle.gp51_username.trim() === '' || 
            vehicle.gp51_username === 'User') {
          skippedInvalidUsernames++;
          return false;
        }

        const correctUserId = gp51UsernameToUserId.get(vehicle.gp51_username);
        
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

  async autoLinkNewVehicle(deviceId: string, gp51Username?: string): Promise<boolean> {
    // Validate GP51 username before processing
    if (!gp51Username || 
        gp51Username.trim() === '' || 
        gp51Username === 'User') {
      console.log(`Invalid GP51 username provided for vehicle ${deviceId}: "${gp51Username}". Skipping auto-link.`);
      return false;
    }

    try {
      // Find user by GP51 username
      const { data: user, error: userError } = await supabase
        .from('envio_users')
        .select('id, name')
        .eq('gp51_username', gp51Username)
        .single();

      if (userError || !user) {
        console.log(`No user found for GP51 username ${gp51Username}`);
        return false;
      }

      // Link vehicle to user
      const { error: linkError } = await supabase
        .from('vehicles')
        .update({ 
          envio_user_id: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('device_id', deviceId);

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
    // Validate GP51 username before processing
    if (!gp51Username || 
        gp51Username.trim() === '' || 
        gp51Username === 'User') {
      console.log(`Invalid GP51 username provided for user ${userId}: "${gp51Username}". Skipping auto-link.`);
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
        .update({ 
          envio_user_id: userId,
          updated_at: new Date().toISOString()
        })
        .eq('gp51_username', gp51Username)
        .is('envio_user_id', null);

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

  async validateGp51DataIntegrity(): Promise<{
    totalVehicles: number;
    validUsernames: number;
    invalidUsernames: number;
    emptyUsernames: number;
    genericUsernames: number;
    recommendations: string[];
  }> {
    console.log('Validating GP51 data integrity...');

    const { data: vehicles, error } = await supabase
      .from('vehicles')
      .select('device_id, gp51_username')
      .eq('is_active', true);

    if (error) throw error;

    const totalVehicles = vehicles?.length || 0;
    let validUsernames = 0;
    let emptyUsernames = 0;
    let genericUsernames = 0;
    
    const recommendations: string[] = [];

    vehicles?.forEach(vehicle => {
      if (!vehicle.gp51_username || vehicle.gp51_username.trim() === '') {
        emptyUsernames++;
      } else if (vehicle.gp51_username === 'User') {
        genericUsernames++;
      } else {
        validUsernames++;
      }
    });

    const invalidUsernames = emptyUsernames + genericUsernames;

    if (genericUsernames > 0) {
      recommendations.push(`${genericUsernames} vehicles have generic "User" username - re-import data with correct GP51 usernames`);
    }

    if (emptyUsernames > 0) {
      recommendations.push(`${emptyUsernames} vehicles have empty GP51 usernames - update with correct usernames`);
    }

    if (validUsernames < totalVehicles * 0.8) {
      recommendations.push('Less than 80% of vehicles have valid GP51 usernames - consider bulk data re-import');
    }

    return {
      totalVehicles,
      validUsernames,
      invalidUsernames,
      emptyUsernames,
      genericUsernames,
      recommendations
    };
  }
}

export const vehicleRedistributionService = new VehicleRedistributionService();
