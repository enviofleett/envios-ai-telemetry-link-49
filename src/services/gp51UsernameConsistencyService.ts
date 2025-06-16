
import { supabase } from '@/integrations/supabase/client';

export interface UsernameConsistencyResult {
  isConsistent: boolean;
  inconsistencies: {
    vehicleId: string;
    deviceId: string;
    expectedUsername: string;
    actualUsername: string;
  }[];
  recommendedActions: string[];
}

export class GP51UsernameConsistencyService {
  async checkUsernameConsistency(): Promise<UsernameConsistencyResult> {
    try {
      console.log('🔍 Checking GP51 username consistency...');

      // Get vehicles with their user assignments using correct column names
      const { data: vehicles, error } = await supabase
        .from('vehicles')
        .select(`
          id,
          gp51_device_id,
          name,
          user_id,
          envio_users (
            id,
            name,
            email
          )
        `)
        .not('user_id', 'is', null);

      if (error) {
        console.error('Error fetching vehicles for consistency check:', error);
        throw new Error(`Failed to fetch vehicle data: ${error.message}`);
      }

      if (!vehicles || vehicles.length === 0) {
        return {
          isConsistent: true,
          inconsistencies: [],
          recommendedActions: ['No vehicles with user assignments found']
        };
      }

      const inconsistencies: any[] = [];
      const recommendedActions: string[] = [];

      // Check each vehicle's username consistency
      vehicles.forEach(vehicle => {
        // Since gp51_username doesn't exist on vehicles table, we'll check user assignments
        if (vehicle.user_id && !vehicle.envio_users) {
          inconsistencies.push({
            vehicleId: vehicle.id,
            deviceId: vehicle.gp51_device_id,
            expectedUsername: `user_${vehicle.user_id}`,
            actualUsername: 'missing_user_data'
          });
        }
      });

      // Generate recommendations
      if (inconsistencies.length > 0) {
        recommendedActions.push(`Fix ${inconsistencies.length} orphaned vehicle assignments`);
        recommendedActions.push('Review user-vehicle relationships in admin panel');
      } else {
        recommendedActions.push('Username consistency is good');
        recommendedActions.push('Schedule regular consistency checks');
      }

      const result = {
        isConsistent: inconsistencies.length === 0,
        inconsistencies,
        recommendedActions
      };

      console.log(`✅ Username consistency check completed. Found ${inconsistencies.length} issues.`);
      return result;

    } catch (error) {
      console.error('❌ Username consistency check failed:', error);
      throw error;
    }
  }

  async fixUsernameInconsistencies(inconsistencies: any[]): Promise<{ fixed: number; failed: number; errors: string[] }> {
    const errors: string[] = [];
    let fixed = 0;
    let failed = 0;

    console.log(`🔧 Fixing ${inconsistencies.length} username inconsistencies...`);

    for (const inconsistency of inconsistencies) {
      try {
        // For orphaned vehicle assignments, unassign the vehicle
        if (inconsistency.actualUsername === 'missing_user_data') {
          const { error } = await supabase
            .from('vehicles')
            .update({ user_id: null })
            .eq('id', inconsistency.vehicleId);

          if (error) {
            failed++;
            errors.push(`Failed to fix vehicle ${inconsistency.deviceId}: ${error.message}`);
          } else {
            fixed++;
            console.log(`Fixed orphaned assignment for vehicle ${inconsistency.deviceId}`);
          }
        }
      } catch (error) {
        failed++;
        errors.push(`Exception fixing vehicle ${inconsistency.deviceId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    console.log(`🔧 Fixed ${fixed} inconsistencies, ${failed} failed`);
    return { fixed, failed, errors };
  }
}

export const gp51UsernameConsistencyService = new GP51UsernameConsistencyService();
