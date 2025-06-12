import { supabase } from '@/integrations/supabase/client';
import { VehicleData, VehiclePosition } from '@/types/vehicle';

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
      // Simplified query to avoid type complexity
      const { data: vehicles, error: vehicleError } = await supabase
        .from('vehicles')
        .select('id, device_id, envio_user_id')
        .not('envio_user_id', 'is', null);

      if (vehicleError) {
        this.addCheck('User-Vehicle Relationships', 'fail', 'Failed to check vehicle relationships', { error: vehicleError.message });
        return;
      }

      // Check if any vehicles have invalid user references
      let orphanedCount = 0;
      if (vehicles && vehicles.length > 0) {
        for (const vehicle of vehicles) {
          const { data: user, error: userError } = await supabase
            .from('envio_users')
            .select('id')
            .eq('id', vehicle.envio_user_id)
            .single();

          if (userError || !user) {
            orphanedCount++;
          }
        }
      }

      if (orphanedCount > 0) {
        this.addCheck(
          'User-Vehicle Relationships',
          'warning',
          `Found ${orphanedCount} vehicles with invalid user references`,
          { orphanedCount }
        );
      } else {
        this.addCheck('User-Vehicle Relationships', 'pass', 'All vehicle-user relationships are valid');
      }

    } catch (error) {
      this.addCheck('User-Vehicle Relationships', 'fail', 'Relationship check failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private async checkVehicleDataIntegrity(): Promise<void> {
    try {
      const { data: vehicles, error } = await supabase
        .from('vehicles')
        .select('id, device_id, device_name, is_active, created_at, updated_at');

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
          { invalidCount, issues: issues.slice(0, 10) }
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

        if (position && typeof position === 'object') {
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
        .order('created_at', { ascending: false })
        .limit(100); // Limit to avoid complexity

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
        if (vehicle.last_position && typeof vehicle.last_position === 'object') {
          const position = vehicle.last_position as any;
          if (position.updatetime) {
            const positionTime = new Date(position.updatetime);
            const now = new Date();
            const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

            if (positionTime > now) {
              issues.push('Position timestamp is in the future');
            }
            
            if (positionTime < oneYearAgo) {
              issues.push('Position timestamp is more than a year old');
            }
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
      // Simple duplicate check for device_ids
      const { data: vehicles, error } = await supabase
        .from('vehicles')
        .select('device_id');

      if (error) {
        this.addCheck('Duplicate Records', 'fail', 'Failed to check duplicates', { error: error.message });
        return;
      }

      if (vehicles) {
        const deviceIds = vehicles.map(v => v.device_id);
        const duplicates = deviceIds.filter((id, index) => deviceIds.indexOf(id) !== index);
        
        if (duplicates.length > 0) {
          this.addCheck('Duplicate Records', 'warning', `Found ${duplicates.length} duplicate device IDs`, { duplicates });
        } else {
          this.addCheck('Duplicate Records', 'pass', 'No duplicate records found');
        }
      }

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
