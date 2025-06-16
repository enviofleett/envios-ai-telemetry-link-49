import { supabase } from '@/integrations/supabase/client';

export interface DataConsistencyReport {
  overall_score: number;
  data_health: string;
  checks_passed: number;
  checks_failed: number;
  checks_performed: number;
  timestamp: string;
  [key: string]: any; // Add index signature for JSONB compatibility
}

export class DataConsistencyService {
  async generateDataConsistencyReport(): Promise<DataConsistencyReport> {
    console.log('🔍 Generating comprehensive data consistency report...');
    
    let checksPerformed = 0;
    let checksPassed = 0;
    let checksFailed = 0;
    const reportDetails: any = {};

    try {
      // Check 1: Vehicle data integrity
      checksPerformed++;
      const vehicleIntegrityResult = await this.checkVehicleDataIntegrity();
      if (vehicleIntegrityResult.success) {
        checksPassed++;
      } else {
        checksFailed++;
      }
      reportDetails.vehicleIntegrity = vehicleIntegrityResult;

      // Check 2: User-vehicle relationships
      checksPerformed++;
      const relationshipResult = await this.checkUserVehicleRelationships();
      if (relationshipResult.success) {
        checksPassed++;
      } else {
        checksFailed++;
      }
      reportDetails.userVehicleRelationships = relationshipResult;

      // Check 3: GP51 metadata consistency
      checksPerformed++;
      const metadataResult = await this.checkGP51MetadataConsistency();
      if (metadataResult.success) {
        checksPassed++;
      } else {
        checksFailed++;
      }
      reportDetails.gp51Metadata = metadataResult;

      // Calculate overall score
      const overallScore = checksPerformed > 0 ? (checksPassed / checksPerformed) * 100 : 0;
      
      // Determine data health
      let dataHealth: string;
      if (overallScore >= 90) {
        dataHealth = 'excellent';
      } else if (overallScore >= 75) {
        dataHealth = 'good';
      } else if (overallScore >= 50) {
        dataHealth = 'fair';
      } else {
        dataHealth = 'poor';
      }

      const report: DataConsistencyReport = {
        overall_score: Math.round(overallScore),
        data_health: dataHealth,
        checks_passed: checksPassed,
        checks_failed: checksFailed,
        checks_performed: checksPerformed,
        timestamp: new Date().toISOString(),
        details: reportDetails
      };

      // Store the report in the database
      await this.storeConsistencyReport(report);

      console.log('✅ Data consistency report generated successfully');
      return report;

    } catch (error) {
      console.error('❌ Failed to generate data consistency report:', error);
      
      return {
        overall_score: 0,
        data_health: 'error',
        checks_passed: 0,
        checks_failed: checksPerformed,
        checks_performed: checksPerformed,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async checkVehicleDataIntegrity(): Promise<{ success: boolean; issues: any[] }> {
    const issues: any[] = [];

    try {
      // Check for vehicles with missing required data
      const { data: vehicles, error } = await supabase
        .from('vehicles')
        .select('id, gp51_device_id, name, created_at, updated_at');

      if (error) {
        console.error('Error fetching vehicles for integrity check:', error);
        return { success: false, issues: [{ type: 'query_error', message: error.message }] };
      }

      if (!vehicles) {
        return { success: true, issues: [] };
      }

      vehicles.forEach(vehicle => {
        if (!vehicle.gp51_device_id) {
          issues.push({
            type: 'missing_device_id',
            vehicle_id: vehicle.id,
            message: 'Vehicle missing GP51 device ID'
          });
        }

        if (!vehicle.name) {
          issues.push({
            type: 'missing_name',
            vehicle_id: vehicle.id,
            message: 'Vehicle missing name'
          });
        }

        // Check for very old records that might be stale
        const createdAt = new Date(vehicle.created_at);
        const updatedAt = new Date(vehicle.updated_at);
        const daysSinceCreation = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
        const daysSinceUpdate = (Date.now() - updatedAt.getTime()) / (1000 * 60 * 60 * 24);

        if (daysSinceCreation > 365 && daysSinceUpdate > 90) {
          issues.push({
            type: 'stale_record',
            vehicle_id: vehicle.id,
            message: 'Vehicle record appears stale (not updated in 90+ days)',
            days_since_update: Math.round(daysSinceUpdate)
          });
        }
      });

      return { success: issues.length === 0, issues };

    } catch (error) {
      console.error('Error in vehicle integrity check:', error);
      return { 
        success: false, 
        issues: [{ type: 'exception', message: error instanceof Error ? error.message : 'Unknown error' }] 
      };
    }
  }

  private async checkUserVehicleRelationships(): Promise<{ success: boolean; issues: any[] }> {
    const issues: any[] = [];

    try {
      // Check for vehicles without users
      const { data: unassignedVehicles, error: unassignedError } = await supabase
        .from('vehicles')
        .select('id, gp51_device_id, name')
        .is('user_id', null);

      if (unassignedError) {
        console.error('Error checking unassigned vehicles:', unassignedError);
        return { success: false, issues: [{ type: 'query_error', message: unassignedError.message }] };
      }

      if (unassignedVehicles && unassignedVehicles.length > 0) {
        unassignedVehicles.forEach(vehicle => {
          issues.push({
            type: 'unassigned_vehicle',
            vehicle_id: vehicle.id,
            device_id: vehicle.gp51_device_id,
            message: 'Vehicle not assigned to any user'
          });
        });
      }

      // Check for vehicles assigned to non-existent users
      const { data: vehiclesWithUsers, error: usersError } = await supabase
        .from('vehicles')
        .select(`
          id,
          gp51_device_id,
          user_id,
          envio_users (id, name)
        `)
        .not('user_id', 'is', null);

      if (usersError) {
        console.error('Error checking vehicle-user relationships:', usersError);
        return { success: false, issues: [{ type: 'query_error', message: usersError.message }] };
      }

      if (vehiclesWithUsers) {
        vehiclesWithUsers.forEach((vehicle: any) => {
          if (!vehicle.envio_users) {
            issues.push({
              type: 'orphaned_vehicle',
              vehicle_id: vehicle.id,
              device_id: vehicle.gp51_device_id,
              user_id: vehicle.user_id,
              message: 'Vehicle assigned to non-existent user'
            });
          }
        });
      }

      return { success: issues.length === 0, issues };

    } catch (error) {
      console.error('Error in user-vehicle relationship check:', error);
      return { 
        success: false, 
        issues: [{ type: 'exception', message: error instanceof Error ? error.message : 'Unknown error' }] 
      };
    }
  }

  private async checkGP51MetadataConsistency(): Promise<{ success: boolean; issues: any[] }> {
    const issues: any[] = [];

    try {
      // Check for duplicate device IDs
      const { data: duplicateDeviceIds, error } = await supabase.rpc('find_duplicate_device_ids');

      if (error) {
        console.error('Error checking duplicate device IDs:', error);
        return { success: false, issues: [{ type: 'query_error', message: error.message }] };
      }

      if (duplicateDeviceIds && duplicateDeviceIds.length > 0) {
        duplicateDeviceIds.forEach((duplicate: any) => {
          issues.push({
            type: 'duplicate_device_id',
            device_id: duplicate.device_id,
            count: duplicate.count,
            message: `Duplicate device ID found: ${duplicate.device_id} (${duplicate.count} instances)`
          });
        });
      }

      return { success: issues.length === 0, issues };

    } catch (error) {
      console.error('Error in GP51 metadata consistency check:', error);
      return { 
        success: false, 
        issues: [{ type: 'exception', message: error instanceof Error ? error.message : 'Unknown error' }] 
      };
    }
  }

  private async storeConsistencyReport(report: DataConsistencyReport): Promise<void> {
    try {
      const { error } = await supabase
        .from('data_consistency_logs')
        .insert({
          checks_performed: report.checks_performed,
          checks_passed: report.checks_passed,
          checks_failed: report.checks_failed,
          overall_score: report.overall_score,
          data_health: report.data_health,
          report_data: report
        });

      if (error) {
        console.error('Failed to store consistency report:', error);
      }
    } catch (error) {
      console.error('Exception storing consistency report:', error);
    }
  }
}

export const dataConsistencyService = new DataConsistencyService();
