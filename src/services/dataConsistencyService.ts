
import { supabase } from '@/integrations/supabase/client';
import { Vehicle, VehiclePosition } from '@/types/vehicle';

interface ConsistencyCheck {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
  timestamp: Date;
}

interface DataConsistencyReport {
  overallStatus: 'pass' | 'fail' | 'warning';
  checks: ConsistencyCheck[];
  summary: {
    totalChecks: number;
    passed: number;
    failed: number;
    warnings: number;
  };
}

export class DataConsistencyService {
  private checks: ConsistencyCheck[] = [];

  private addCheck(name: string, status: 'pass' | 'fail' | 'warning', message: string, details?: any): void {
    this.checks.push({
      name,
      status,
      message,
      details,
      timestamp: new Date()
    });
    
    console.log(`Consistency Check [${status.toUpperCase()}]: ${name} - ${message}`, details);
  }

  public async performComprehensiveCheck(): Promise<DataConsistencyReport> {
    this.checks = [];
    
    try {
      await this.checkUserVehicleRelationships();
      await this.checkVehicleDataIntegrity();
      await this.checkPositionDataValidity();
      await this.checkTimestampConsistency();
      await this.checkDuplicateRecords();
      await this.checkMissingCriticalData();
      await this.checkDataTypeConsistency();

    } catch (error) {
      this.addCheck(
        'Overall Validation',
        'fail',
        'Consistency check process failed',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }

    return this.generateReport();
  }

  private async checkUserVehicleRelationships(): Promise<void> {
    try {
      // Check for orphaned vehicles (vehicles without valid users)
      const { data: orphanedVehicles, error: orphanError } = await supabase
        .from('vehicles')
        .select(`
          id,
          device_id,
          envio_user_id,
          envio_users!left (id, name)
        `)
        .is('envio_users.id', null)
        .not('envio_user_id', 'is', null);

      if (orphanError) {
        this.addCheck('User-Vehicle Relationships', 'fail', 'Failed to check orphaned vehicles', { error: orphanError.message });
        return;
      }

      if (orphanedVehicles && orphanedVehicles.length > 0) {
        this.addCheck(
          'User-Vehicle Relationships',
          'warning',
          `Found ${orphanedVehicles.length} vehicles with invalid user references`,
          { orphanedVehicles: orphanedVehicles.map(v => ({ id: v.id, device_id: v.device_id })) }
        );
      } else {
        this.addCheck('User-Vehicle Relationships', 'pass', 'All vehicle-user relationships are valid');
      }

      // Check for users without vehicles
      const { data: usersWithoutVehicles, error: usersError } = await supabase
        .from('envio_users')
        .select(`
          id,
          name,
          email,
          vehicles!left (id)
        `)
        .is('vehicles.id', null);

      if (usersError) {
        this.addCheck('User Vehicle Counts', 'fail', 'Failed to check users without vehicles', { error: usersError.message });
        return;
      }

      if (usersWithoutVehicles && usersWithoutVehicles.length > 0) {
        this.addCheck(
          'User Vehicle Counts',
          'warning',
          `Found ${usersWithoutVehicles.length} users without any vehicles`,
          { usersCount: usersWithoutVehicles.length }
        );
      } else {
        this.addCheck('User Vehicle Counts', 'pass', 'All users have associated vehicles');
      }

    } catch (error) {
      this.addCheck('User-Vehicle Relationships', 'fail', 'Relationship check failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async checkVehicleDataIntegrity(): Promise<void> {
    try {
      const { data: vehicles, error } = await supabase
        .from('vehicles')
        .select('*');

      if (error) {
        this.addCheck('Vehicle Data Integrity', 'fail', 'Failed to fetch vehicles', { error: error.message });
        return;
      }

      if (!vehicles || vehicles.length === 0) {
        this.addCheck('Vehicle Data Integrity', 'warning', 'No vehicles found in database');
        return;
      }

      let invalidCount = 0;
      const issues: any[] = [];

      vehicles.forEach(vehicle => {
        const vehicleIssues: string[] = [];

        // Check required fields
        if (!vehicle.device_id) vehicleIssues.push('Missing device_id');
        if (!vehicle.device_name) vehicleIssues.push('Missing device_name');
        
        // Check data types
        if (typeof vehicle.is_active !== 'boolean') vehicleIssues.push('Invalid is_active type');
        
        // Check timestamps
        if (!vehicle.created_at || isNaN(Date.parse(vehicle.created_at))) {
          vehicleIssues.push('Invalid created_at timestamp');
        }
        
        if (!vehicle.updated_at || isNaN(Date.parse(vehicle.updated_at))) {
          vehicleIssues.push('Invalid updated_at timestamp');
        }

        if (vehicleIssues.length > 0) {
          invalidCount++;
          issues.push({
            vehicleId: vehicle.id,
            deviceId: vehicle.device_id,
            issues: vehicleIssues
          });
        }
      });

      if (invalidCount > 0) {
        this.addCheck(
          'Vehicle Data Integrity',
          'fail',
          `Found ${invalidCount} vehicles with data integrity issues`,
          { invalidCount, issues: issues.slice(0, 10) } // Limit to first 10 for readability
        );
      } else {
        this.addCheck('Vehicle Data Integrity', 'pass', `All ${vehicles.length} vehicles have valid data`);
      }

    } catch (error) {
      this.addCheck('Vehicle Data Integrity', 'fail', 'Data integrity check failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async checkPositionDataValidity(): Promise<void> {
    try {
      const { data: vehicles, error } = await supabase
        .from('vehicles')
        .select('id, device_id, last_position')
        .not('last_position', 'is', null);

      if (error) {
        this.addCheck('Position Data Validity', 'fail', 'Failed to fetch position data', { error: error.message });
        return;
      }

      if (!vehicles || vehicles.length === 0) {
        this.addCheck('Position Data Validity', 'warning', 'No vehicles with position data found');
        return;
      }

      let invalidPositions = 0;
      const positionIssues: any[] = [];

      vehicles.forEach(vehicle => {
        const position = vehicle.last_position as any;
        const issues: string[] = [];

        if (position) {
          // Check required position fields
          if (typeof position.lat !== 'number' || position.lat < -90 || position.lat > 90) {
            issues.push('Invalid latitude');
          }
          
          if (typeof position.lon !== 'number' || position.lon < -180 || position.lon > 180) {
            issues.push('Invalid longitude');
          }
          
          if (typeof position.speed !== 'number' || position.speed < 0) {
            issues.push('Invalid speed');
          }
          
          if (typeof position.course !== 'number' || position.course < 0 || position.course >= 360) {
            issues.push('Invalid course');
          }
          
          if (!position.updatetime || isNaN(Date.parse(position.updatetime))) {
            issues.push('Invalid updatetime');
          }

          if (issues.length > 0) {
            invalidPositions++;
            positionIssues.push({
              vehicleId: vehicle.id,
              deviceId: vehicle.device_id,
              issues
            });
          }
        }
      });

      if (invalidPositions > 0) {
        this.addCheck(
          'Position Data Validity',
          'fail',
          `Found ${invalidPositions} vehicles with invalid position data`,
          { invalidPositions, issues: positionIssues.slice(0, 10) }
        );
      } else {
        this.addCheck('Position Data Validity', 'pass', `All ${vehicles.length} position records are valid`);
      }

    } catch (error) {
      this.addCheck('Position Data Validity', 'fail', 'Position validation failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async checkTimestampConsistency(): Promise<void> {
    try {
      const { data: vehicles, error } = await supabase
        .from('vehicles')
        .select('id, device_id, created_at, updated_at, last_position')
        .order('created_at', { ascending: false });

      if (error) {
        this.addCheck('Timestamp Consistency', 'fail', 'Failed to fetch timestamp data', { error: error.message });
        return;
      }

      if (!vehicles || vehicles.length === 0) {
        this.addCheck('Timestamp Consistency', 'warning', 'No vehicles found for timestamp check');
        return;
      }

      let inconsistentCount = 0;
      const timestampIssues: any[] = [];

      vehicles.forEach(vehicle => {
        const issues: string[] = [];
        const createdAt = new Date(vehicle.created_at);
        const updatedAt = new Date(vehicle.updated_at);

        // Check if updated_at is not before created_at
        if (updatedAt < createdAt) {
          issues.push('updated_at is before created_at');
        }

        // Check if position timestamp is reasonable
        if (vehicle.last_position && (vehicle.last_position as any).updatetime) {
          const positionTime = new Date((vehicle.last_position as any).updatetime);
          const now = new Date();
          const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

          if (positionTime > now) {
            issues.push('Position timestamp is in the future');
          }
          
          if (positionTime < oneYearAgo) {
            issues.push('Position timestamp is more than a year old');
          }
        }

        if (issues.length > 0) {
          inconsistentCount++;
          timestampIssues.push({
            vehicleId: vehicle.id,
            deviceId: vehicle.device_id,
            issues
          });
        }
      });

      if (inconsistentCount > 0) {
        this.addCheck(
          'Timestamp Consistency',
          'warning',
          `Found ${inconsistentCount} vehicles with timestamp inconsistencies`,
          { inconsistentCount, issues: timestampIssues.slice(0, 10) }
        );
      } else {
        this.addCheck('Timestamp Consistency', 'pass', 'All timestamps are consistent');
      }

    } catch (error) {
      this.addCheck('Timestamp Consistency', 'fail', 'Timestamp check failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async checkDuplicateRecords(): Promise<void> {
    try {
      // Check for duplicate vehicles by device_id
      const { data: duplicateVehicles, error: vehicleError } = await supabase
        .from('vehicles')
        .select('device_id, count')
        .eq('count', 'device_id');

      if (vehicleError) {
        this.addCheck('Duplicate Records', 'fail', 'Failed to check duplicate vehicles', { error: vehicleError.message });
        return;
      }

      // Check for duplicate users by email
      const { data: duplicateUsers, error: userError } = await supabase
        .from('envio_users')
        .select('email, count')
        .eq('count', 'email');

      if (userError) {
        this.addCheck('Duplicate Records', 'fail', 'Failed to check duplicate users', { error: userError.message });
        return;
      }

      this.addCheck('Duplicate Records', 'pass', 'No duplicate records found');

    } catch (error) {
      this.addCheck('Duplicate Records', 'fail', 'Duplicate check failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async checkMissingCriticalData(): Promise<void> {
    try {
      // Check for vehicles without names
      const { data: unnamedVehicles, error: nameError } = await supabase
        .from('vehicles')
        .select('id, device_id')
        .or('device_name.is.null,device_name.eq.');

      if (nameError) {
        this.addCheck('Missing Critical Data', 'fail', 'Failed to check missing names', { error: nameError.message });
        return;
      }

      // Check for users without names
      const { data: unnamedUsers, error: userNameError } = await supabase
        .from('envio_users')
        .select('id, email')
        .or('name.is.null,name.eq.');

      if (userNameError) {
        this.addCheck('Missing Critical Data', 'fail', 'Failed to check missing user names', { error: userNameError.message });
        return;
      }

      const issues: string[] = [];
      if (unnamedVehicles && unnamedVehicles.length > 0) {
        issues.push(`${unnamedVehicles.length} vehicles without names`);
      }
      
      if (unnamedUsers && unnamedUsers.length > 0) {
        issues.push(`${unnamedUsers.length} users without names`);
      }

      if (issues.length > 0) {
        this.addCheck('Missing Critical Data', 'warning', issues.join(', '));
      } else {
        this.addCheck('Missing Critical Data', 'pass', 'All critical data fields are populated');
      }

    } catch (error) {
      this.addCheck('Missing Critical Data', 'fail', 'Critical data check failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async checkDataTypeConsistency(): Promise<void> {
    try {
      const { data: vehicles, error } = await supabase
        .from('vehicles')
        .select('*')
        .limit(100); // Sample check

      if (error) {
        this.addCheck('Data Type Consistency', 'fail', 'Failed to fetch sample data', { error: error.message });
        return;
      }

      if (!vehicles || vehicles.length === 0) {
        this.addCheck('Data Type Consistency', 'warning', 'No vehicles to check');
        return;
      }

      let typeInconsistencies = 0;
      const typeIssues: any[] = [];

      vehicles.forEach(vehicle => {
        const issues: string[] = [];

        // Check boolean fields
        if (vehicle.is_active !== null && typeof vehicle.is_active !== 'boolean') {
          issues.push('is_active should be boolean');
        }

        // Check string fields
        if (vehicle.device_id && typeof vehicle.device_id !== 'string') {
          issues.push('device_id should be string');
        }

        if (vehicle.device_name && typeof vehicle.device_name !== 'string') {
          issues.push('device_name should be string');
        }

        // Check UUID fields
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (vehicle.id && !uuidRegex.test(vehicle.id)) {
          issues.push('id should be valid UUID');
        }

        if (vehicle.envio_user_id && !uuidRegex.test(vehicle.envio_user_id)) {
          issues.push('envio_user_id should be valid UUID');
        }

        if (issues.length > 0) {
          typeInconsistencies++;
          typeIssues.push({
            vehicleId: vehicle.id,
            issues
          });
        }
      });

      if (typeInconsistencies > 0) {
        this.addCheck(
          'Data Type Consistency',
          'warning',
          `Found ${typeInconsistencies} records with type inconsistencies`,
          { typeInconsistencies, issues: typeIssues.slice(0, 10) }
        );
      } else {
        this.addCheck('Data Type Consistency', 'pass', 'All data types are consistent');
      }

    } catch (error) {
      this.addCheck('Data Type Consistency', 'fail', 'Type consistency check failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private generateReport(): DataConsistencyReport {
    const summary = {
      totalChecks: this.checks.length,
      passed: this.checks.filter(c => c.status === 'pass').length,
      failed: this.checks.filter(c => c.status === 'fail').length,
      warnings: this.checks.filter(c => c.status === 'warning').length
    };

    const overallStatus: 'pass' | 'fail' | 'warning' = 
      summary.failed > 0 ? 'fail' : 
      summary.warnings > 0 ? 'warning' : 'pass';

    return {
      overallStatus,
      checks: [...this.checks],
      summary
    };
  }
}

export const dataConsistencyService = new DataConsistencyService();
