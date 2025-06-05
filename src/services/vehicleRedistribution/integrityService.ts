
import { supabase } from '@/integrations/supabase/client';
import { DataIntegrityResult } from './types';
import { DataValidator } from './dataValidator';

export class IntegrityService {
  async validateGp51DataIntegrity(): Promise<DataIntegrityResult> {
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
      const category = DataValidator.categorizeGp51Username(vehicle.gp51_username);
      switch (category) {
        case 'valid':
          validUsernames++;
          break;
        case 'empty':
          emptyUsernames++;
          break;
        case 'generic':
          genericUsernames++;
          break;
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
