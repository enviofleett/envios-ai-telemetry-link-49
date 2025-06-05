
import { supabase } from '@/integrations/supabase/client';
import { AnalysisResult } from './types';
import { DataValidator } from './dataValidator';

export class AnalysisService {
  async analyzeCurrentAssignments(): Promise<AnalysisResult> {
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

    // Check for valid GP51 usernames
    const validGp51Usernames = vehicles?.filter(v => 
      DataValidator.isValidGp51Username(v.gp51_username)
    ).length || 0;

    const invalidGp51Usernames = totalVehicles - validGp51Usernames;

    // Create a map of GP51 usernames to user IDs for redistribution check
    const gp51UsernameToUserId = new Map<string, string>();
    users?.forEach(user => {
      if (DataValidator.isValidGp51Username(user.gp51_username)) {
        gp51UsernameToUserId.set(user.gp51_username!, user.id);
      }
    });

    // Check if redistribution is needed based on multiple factors
    const hasUnassignedVehiclesWithValidUsernames = vehicles?.some(v => 
      !v.envio_user_id && 
      DataValidator.isValidGp51Username(v.gp51_username) &&
      gp51UsernameToUserId.has(v.gp51_username!)
    ) || false;

    const hasIncorrectlyAssignedVehicles = vehicles?.some(v => 
      v.envio_user_id && 
      DataValidator.isValidGp51Username(v.gp51_username) &&
      gp51UsernameToUserId.has(v.gp51_username!) &&
      gp51UsernameToUserId.get(v.gp51_username!) !== v.envio_user_id
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
}
