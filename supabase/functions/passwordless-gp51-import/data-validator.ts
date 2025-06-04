
import { GP51Vehicle } from './types.ts';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  summary: {
    totalUsers: number;
    validUsers: number;
    totalVehicles: number;
    validVehicles: number;
  };
}

export interface DataConsistencyReport {
  timestamp: string;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  issues: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    affectedRecords: number;
    details: any;
  }>;
}

export class DataValidator {
  private supabase: any;

  constructor(supabase: any) {
    this.supabase = supabase;
  }

  validateUsernames(usernames: string[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    const validUsers = usernames.filter(username => {
      if (!username || typeof username !== 'string') {
        errors.push(`Invalid username: ${username} (not a string)`);
        return false;
      }
      
      if (username.trim().length === 0) {
        errors.push('Empty username found');
        return false;
      }
      
      if (username.length > 100) {
        warnings.push(`Username '${username}' is very long (${username.length} characters)`);
      }
      
      if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
        warnings.push(`Username '${username}' contains special characters that might cause issues`);
      }
      
      return true;
    });

    // Check for duplicates
    const uniqueUsers = [...new Set(validUsers)];
    if (uniqueUsers.length !== validUsers.length) {
      warnings.push(`Found ${validUsers.length - uniqueUsers.length} duplicate usernames`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      summary: {
        totalUsers: usernames.length,
        validUsers: uniqueUsers.length,
        totalVehicles: 0,
        validVehicles: 0
      }
    };
  }

  validateGP51Response(username: string, response: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (!response) {
      errors.push(`No response received for user ${username}`);
      return {
        isValid: false,
        errors,
        warnings,
        summary: { totalUsers: 1, validUsers: 0, totalVehicles: 0, validVehicles: 0 }
      };
    }

    if (response.status !== 0 && response.status !== '0') {
      errors.push(`GP51 API returned error status for ${username}: ${response.status}`);
    }

    let vehicles: GP51Vehicle[] = [];
    
    // Extract vehicles from various response structures
    if (response.records) {
      vehicles = response.records;
    } else if (response.monitors) {
      vehicles = response.monitors;
    } else if (response.data?.monitors) {
      vehicles = response.data.monitors;
    } else if (response.devices) {
      vehicles = response.devices;
    } else if (response.groups && Array.isArray(response.groups)) {
      vehicles = [];
      for (const group of response.groups) {
        if (group.devices && Array.isArray(group.devices)) {
          vehicles.push(...group.devices);
        }
      }
    }

    if (!Array.isArray(vehicles)) {
      errors.push(`Invalid vehicle data structure for ${username}`);
      vehicles = [];
    }

    const validVehicles = vehicles.filter(vehicle => this.validateVehicle(vehicle, username, errors, warnings));

    if (vehicles.length > 100) {
      warnings.push(`User ${username} has ${vehicles.length} vehicles (unusually high number)`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      summary: {
        totalUsers: 1,
        validUsers: errors.length === 0 ? 1 : 0,
        totalVehicles: vehicles.length,
        validVehicles: validVehicles.length
      }
    };
  }

  private validateVehicle(vehicle: any, username: string, errors: string[], warnings: string[]): boolean {
    if (!vehicle || typeof vehicle !== 'object') {
      errors.push(`Invalid vehicle object for ${username}`);
      return false;
    }

    if (!vehicle.deviceid) {
      errors.push(`Vehicle missing deviceid for ${username}`);
      return false;
    }

    if (typeof vehicle.deviceid !== 'string') {
      errors.push(`Invalid deviceid type for ${username}: ${typeof vehicle.deviceid}`);
      return false;
    }

    if (vehicle.deviceid.length > 50) {
      warnings.push(`Very long deviceid for ${username}: ${vehicle.deviceid}`);
    }

    // Validate position data if present
    if (vehicle.lastPosition) {
      this.validatePositionData(vehicle.lastPosition, vehicle.deviceid, warnings);
    }

    return true;
  }

  private validatePositionData(position: any, deviceId: string, warnings: string[]) {
    if (!position || typeof position !== 'object') {
      warnings.push(`Invalid position data for device ${deviceId}`);
      return;
    }

    if (typeof position.lat !== 'number' || typeof position.lon !== 'number') {
      warnings.push(`Invalid coordinates for device ${deviceId}`);
    }

    if (position.lat < -90 || position.lat > 90) {
      warnings.push(`Invalid latitude for device ${deviceId}: ${position.lat}`);
    }

    if (position.lon < -180 || position.lon > 180) {
      warnings.push(`Invalid longitude for device ${deviceId}: ${position.lon}`);
    }

    if (typeof position.speed === 'number' && position.speed < 0) {
      warnings.push(`Negative speed value for device ${deviceId}: ${position.speed}`);
    }
  }

  async performConsistencyAudit(): Promise<DataConsistencyReport> {
    console.log('Starting data consistency audit...');
    
    const report: DataConsistencyReport = {
      timestamp: new Date().toISOString(),
      totalChecks: 0,
      passedChecks: 0,
      failedChecks: 0,
      issues: []
    };

    try {
      // Check 1: Vehicles without valid envio users
      await this.checkOrphanedVehicles(report);
      
      // Check 2: Envio users without vehicles
      await this.checkUsersWithoutVehicles(report);
      
      // Check 3: Duplicate device IDs
      await this.checkDuplicateDeviceIds(report);
      
      // Check 4: Invalid position data
      await this.checkInvalidPositions(report);
      
      // Check 5: Missing required fields
      await this.checkMissingRequiredFields(report);

    } catch (error) {
      console.error('Error during consistency audit:', error);
      report.issues.push({
        type: 'audit_error',
        severity: 'critical',
        description: `Audit failed with error: ${error.message}`,
        affectedRecords: 0,
        details: { error: error.message }
      });
    }

    console.log(`Consistency audit completed: ${report.passedChecks}/${report.totalChecks} checks passed`);
    return report;
  }

  private async checkOrphanedVehicles(report: DataConsistencyReport) {
    report.totalChecks++;
    
    try {
      const { data: orphanedVehicles, error } = await this.supabase
        .from('vehicles')
        .select('id, device_id, envio_user_id')
        .or('envio_user_id.is.null,envio_user_id.not.in.(select id from envio_users)');

      if (error) throw error;

      if (orphanedVehicles && orphanedVehicles.length > 0) {
        report.failedChecks++;
        report.issues.push({
          type: 'orphaned_vehicles',
          severity: 'high',
          description: 'Vehicles found without valid envio users',
          affectedRecords: orphanedVehicles.length,
          details: { vehicleIds: orphanedVehicles.slice(0, 10).map(v => v.device_id) }
        });
      } else {
        report.passedChecks++;
      }
    } catch (error) {
      report.failedChecks++;
      report.issues.push({
        type: 'check_error',
        severity: 'medium',
        description: 'Failed to check for orphaned vehicles',
        affectedRecords: 0,
        details: { error: error.message }
      });
    }
  }

  private async checkUsersWithoutVehicles(report: DataConsistencyReport) {
    report.totalChecks++;
    
    try {
      const { data: usersWithoutVehicles, error } = await this.supabase
        .from('envio_users')
        .select(`
          id, 
          gp51_username,
          vehicles:vehicles(count)
        `)
        .eq('is_gp51_imported', true)
        .having('vehicles.count', 'eq', 0);

      if (error) throw error;

      if (usersWithoutVehicles && usersWithoutVehicles.length > 0) {
        report.failedChecks++;
        report.issues.push({
          type: 'users_without_vehicles',
          severity: 'medium',
          description: 'GP51 imported users found without vehicles',
          affectedRecords: usersWithoutVehicles.length,
          details: { 
            usernames: usersWithoutVehicles.slice(0, 10).map(u => u.gp51_username) 
          }
        });
      } else {
        report.passedChecks++;
      }
    } catch (error) {
      report.failedChecks++;
      report.issues.push({
        type: 'check_error',
        severity: 'medium',
        description: 'Failed to check for users without vehicles',
        affectedRecords: 0,
        details: { error: error.message }
      });
    }
  }

  private async checkDuplicateDeviceIds(report: DataConsistencyReport) {
    report.totalChecks++;
    
    try {
      const { data: duplicates, error } = await this.supabase
        .from('vehicles')
        .select('device_id, count')
        .group('device_id')
        .having('count', 'gt', 1);

      if (error) throw error;

      if (duplicates && duplicates.length > 0) {
        report.failedChecks++;
        const totalDuplicates = duplicates.reduce((sum, dup) => sum + dup.count, 0);
        report.issues.push({
          type: 'duplicate_device_ids',
          severity: 'high',
          description: 'Duplicate device IDs found',
          affectedRecords: totalDuplicates,
          details: { 
            duplicateDeviceIds: duplicates.slice(0, 10).map(d => d.device_id) 
          }
        });
      } else {
        report.passedChecks++;
      }
    } catch (error) {
      report.failedChecks++;
      report.issues.push({
        type: 'check_error',
        severity: 'medium',
        description: 'Failed to check for duplicate device IDs',
        affectedRecords: 0,
        details: { error: error.message }
      });
    }
  }

  private async checkInvalidPositions(report: DataConsistencyReport) {
    report.totalChecks++;
    
    try {
      const { data: vehicles, error } = await this.supabase
        .from('vehicles')
        .select('id, device_id, last_position')
        .not('last_position', 'is', null);

      if (error) throw error;

      let invalidPositions = 0;
      
      if (vehicles) {
        for (const vehicle of vehicles) {
          if (vehicle.last_position) {
            const pos = vehicle.last_position;
            if (typeof pos.lat !== 'number' || typeof pos.lon !== 'number' ||
                pos.lat < -90 || pos.lat > 90 || pos.lon < -180 || pos.lon > 180) {
              invalidPositions++;
            }
          }
        }
      }

      if (invalidPositions > 0) {
        report.failedChecks++;
        report.issues.push({
          type: 'invalid_positions',
          severity: 'medium',
          description: 'Vehicles with invalid position data',
          affectedRecords: invalidPositions,
          details: { totalVehiclesWithPositions: vehicles?.length || 0 }
        });
      } else {
        report.passedChecks++;
      }
    } catch (error) {
      report.failedChecks++;
      report.issues.push({
        type: 'check_error',
        severity: 'medium',
        description: 'Failed to check position data',
        affectedRecords: 0,
        details: { error: error.message }
      });
    }
  }

  private async checkMissingRequiredFields(report: DataConsistencyReport) {
    report.totalChecks++;
    
    try {
      const { data: vehiclesWithMissingFields, error } = await this.supabase
        .from('vehicles')
        .select('id, device_id, device_name, envio_user_id')
        .or('device_id.is.null,device_name.is.null,envio_user_id.is.null');

      if (error) throw error;

      if (vehiclesWithMissingFields && vehiclesWithMissingFields.length > 0) {
        report.failedChecks++;
        report.issues.push({
          type: 'missing_required_fields',
          severity: 'high',
          description: 'Vehicles with missing required fields',
          affectedRecords: vehiclesWithMissingFields.length,
          details: { 
            sampleVehicles: vehiclesWithMissingFields.slice(0, 5).map(v => ({
              id: v.id,
              device_id: v.device_id,
              hasDeviceName: !!v.device_name,
              hasEnvioUserId: !!v.envio_user_id
            }))
          }
        });
      } else {
        report.passedChecks++;
      }
    } catch (error) {
      report.failedChecks++;
      report.issues.push({
        type: 'check_error',
        severity: 'medium',
        description: 'Failed to check for missing required fields',
        affectedRecords: 0,
        details: { error: error.message }
      });
    }
  }
}
