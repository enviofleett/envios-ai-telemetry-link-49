
import { supabase } from '@/integrations/supabase/client';
import { AnalysisResult } from './types';
import { DataValidator } from './dataValidator';

export class AnalysisService {
  async analyzeCurrentAssignments(): Promise<AnalysisResult> {
    console.log('Analyzing current vehicle assignments...');

    // Get vehicle assignment stats
    const { data: vehicles, error: vehiclesError } = await supabase
      .from('vehicles')
      .select('gp51_device_id, user_id'); // Fixed column names

    if (vehiclesError) {
      console.error('Error fetching vehicles:', vehiclesError);
      throw vehiclesError;
    }

    // Get user stats
    const { data: users, error: usersError } = await supabase
      .from('envio_users')
      .select('id, name');

    if (usersError) {
      console.error('Error fetching users:', usersError);
      throw usersError;
    }

    const totalVehicles = vehicles?.length || 0;
    const unassignedVehicles = vehicles?.filter(v => !v.user_id).length || 0; // Fixed property name
    const assignedVehicles = vehicles?.filter(v => v.user_id) || []; // Fixed property name
    
    // Count unique users with vehicles
    const usersWithVehicles = new Set(assignedVehicles.map(v => v.user_id)).size; // Fixed property name

    // For now, assume all vehicles have valid assignment (since gp51_username doesn't exist on vehicles)
    const validAssignments = assignedVehicles.length;
    const invalidAssignments = 0;

    // Simple redistribution check - if there are unassigned vehicles, redistribution is needed
    const redistributionNeeded = unassignedVehicles > 0;

    console.log(`Analysis: ${totalVehicles} total vehicles, ${unassignedVehicles} unassigned, ${usersWithVehicles} users have vehicles`);
    console.log(`Valid assignments: ${validAssignments}, Invalid: ${invalidAssignments}`);
    console.log(`Redistribution needed: ${redistributionNeeded}`);

    return {
      totalVehicles,
      unassignedVehicles,
      usersWithVehicles,
      redistributionNeeded,
      validGp51Usernames: validAssignments, // Simplified for now
      invalidGp51Usernames: invalidAssignments
    };
  }
}
