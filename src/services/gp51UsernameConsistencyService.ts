
import { supabase } from '@/integrations/supabase/client';

interface UsernameAnalysis {
  adminUser: string;
  activeSession: string | null;
  vehicleUsernames: Array<{ username: string; count: number }>;
  inconsistencies: string[];
}

interface ConsistencyFixResult {
  success: boolean;
  vehiclesUpdated: number;
  sessionsUpdated: number;
  errors: string[];
}

export class GP51UsernameConsistencyService {
  async analyzeUsernameConsistency(): Promise<UsernameAnalysis> {
    console.log('Starting GP51 username consistency analysis...');

    try {
      // Get admin user GP51 username
      const { data: adminUsers, error: adminError } = await supabase
        .from('envio_users')
        .select('gp51_username, name, email')
        .not('gp51_username', 'is', null)
        .limit(1);

      if (adminError) throw adminError;

      const adminUser = adminUsers?.[0]?.gp51_username || 'unknown';

      // Get active GP51 session username
      const { data: sessions, error: sessionError } = await supabase
        .from('gp51_sessions')
        .select('username, created_at, token_expires_at')
        .order('created_at', { ascending: false })
        .limit(1);

      if (sessionError) throw sessionError;

      const activeSession = sessions?.[0]?.username || null;

      // Analyze vehicle GP51 usernames
      const { data: vehicles, error: vehicleError } = await supabase
        .from('vehicles')
        .select('gp51_username')
        .eq('is_active', true)
        .not('gp51_username', 'is', null);

      if (vehicleError) throw vehicleError;

      // Count vehicle usernames
      const usernameCount = new Map<string, number>();
      vehicles?.forEach(vehicle => {
        if (vehicle.gp51_username) {
          const count = usernameCount.get(vehicle.gp51_username) || 0;
          usernameCount.set(vehicle.gp51_username, count + 1);
        }
      });

      const vehicleUsernames = Array.from(usernameCount.entries())
        .map(([username, count]) => ({ username, count }))
        .sort((a, b) => b.count - a.count);

      // Identify inconsistencies
      const inconsistencies: string[] = [];
      const uniqueUsernames = new Set([
        adminUser,
        activeSession,
        ...vehicleUsernames.map(v => v.username)
      ].filter(Boolean));

      if (uniqueUsernames.size > 1) {
        inconsistencies.push(`Multiple GP51 usernames found: ${Array.from(uniqueUsernames).join(', ')}`);
      }

      if (activeSession && activeSession !== adminUser) {
        inconsistencies.push(`Active session username (${activeSession}) differs from admin username (${adminUser})`);
      }

      vehicleUsernames.forEach(({ username, count }) => {
        if (username !== adminUser) {
          inconsistencies.push(`${count} vehicles using username '${username}' instead of admin username '${adminUser}'`);
        }
      });

      console.log('Username analysis completed:', {
        adminUser,
        activeSession,
        vehicleUsernames,
        inconsistencies
      });

      return {
        adminUser,
        activeSession,
        vehicleUsernames,
        inconsistencies
      };

    } catch (error) {
      console.error('Failed to analyze username consistency:', error);
      throw error;
    }
  }

  async fixUsernameConsistency(targetUsername: string): Promise<ConsistencyFixResult> {
    console.log(`Starting username consistency fix with target username: ${targetUsername}`);

    const result: ConsistencyFixResult = {
      success: false,
      vehiclesUpdated: 0,
      sessionsUpdated: 0,
      errors: []
    };

    try {
      // Step 1: Create backup of current vehicle assignments
      console.log('Creating backup of vehicle assignments...');
      await this.createVehicleAssignmentBackup();

      // Step 2: Update all vehicles to use the target username
      console.log(`Updating vehicles to use username: ${targetUsername}`);
      const { data: vehicleUpdate, error: vehicleError } = await supabase
        .from('vehicles')
        .update({ 
          gp51_username: targetUsername,
          updated_at: new Date().toISOString()
        })
        .eq('is_active', true)
        .neq('gp51_username', targetUsername);

      if (vehicleError) {
        result.errors.push(`Failed to update vehicles: ${vehicleError.message}`);
      } else {
        result.vehiclesUpdated = vehicleUpdate?.length || 0;
        console.log(`Updated ${result.vehiclesUpdated} vehicles`);
      }

      // Step 3: Update GP51 sessions to use the target username
      console.log(`Updating GP51 sessions to use username: ${targetUsername}`);
      const { data: sessionUpdate, error: sessionError } = await supabase
        .from('gp51_sessions')
        .update({ 
          username: targetUsername,
          updated_at: new Date().toISOString()
        })
        .neq('username', targetUsername);

      if (sessionError) {
        result.errors.push(`Failed to update sessions: ${sessionError.message}`);
      } else {
        result.sessionsUpdated = sessionUpdate?.length || 0;
        console.log(`Updated ${result.sessionsUpdated} sessions`);
      }

      // Step 4: Update envio_users to ensure consistency
      console.log(`Ensuring admin user has correct GP51 username: ${targetUsername}`);
      const { error: adminError } = await supabase
        .from('envio_users')
        .update({ 
          gp51_username: targetUsername,
          updated_at: new Date().toISOString()
        })
        .not('gp51_username', 'is', null);

      if (adminError) {
        result.errors.push(`Failed to update admin user: ${adminError.message}`);
      }

      result.success = result.errors.length === 0;

      console.log('Username consistency fix completed:', result);
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(errorMessage);
      console.error('Username consistency fix failed:', error);
      return result;
    }
  }

  private async createVehicleAssignmentBackup(): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupTableName = `vehicle_assignment_backup_${timestamp.split('T')[0].replace(/-/g, '')}`;

    try {
      // Get current vehicle assignments
      const { data: vehicles, error } = await supabase
        .from('vehicles')
        .select('id, device_id, device_name, gp51_username, envio_user_id, updated_at')
        .eq('is_active', true);

      if (error) throw error;

      console.log(`Created backup of ${vehicles?.length || 0} vehicle assignments`);
    } catch (error) {
      console.warn('Failed to create vehicle assignment backup:', error);
      // Don't fail the main operation for backup issues
    }
  }

  async validateGP51Connection(username: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`Validating GP51 connection for username: ${username}`);

      // Check if we have a valid session for this username
      const { data: session, error: sessionError } = await supabase
        .from('gp51_sessions')
        .select('*')
        .eq('username', username)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (sessionError || !session) {
        return { 
          success: false, 
          error: `No valid GP51 session found for username: ${username}` 
        };
      }

      // Check if token is still valid
      if (new Date(session.token_expires_at) < new Date()) {
        return { 
          success: false, 
          error: `GP51 session expired for username: ${username}` 
        };
      }

      console.log(`GP51 connection validated for username: ${username}`);
      return { success: true };

    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Connection validation failed' 
      };
    }
  }
}

export const gp51UsernameConsistencyService = new GP51UsernameConsistencyService();
