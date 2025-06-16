
import { supabase } from '@/integrations/supabase/client';
import { ConsistencyCheck, ConsistencyReport } from '@/types/dataIntegrity';

export class DataConsistencyVerifier {
  async performFullConsistencyCheck(): Promise<ConsistencyReport> {
    console.log('🔍 Starting comprehensive data consistency check...');
    
    const checks: ConsistencyCheck[] = [];
    let checksPerformed = 0;
    let checksPassed = 0;
    let checksFailed = 0;

    try {
      // Check 1: Vehicle data integrity
      console.log('Checking vehicle data integrity...');
      const vehicleCheck = await this.checkVehicleDataIntegrity();
      checks.push(vehicleCheck);
      checksPerformed++;
      vehicleCheck.status === 'passed' ? checksPassed++ : checksFailed++;

      // Check 2: User-vehicle relationships
      console.log('Checking user-vehicle relationships...');
      const relationshipCheck = await this.checkUserVehicleRelationships();
      checks.push(relationshipCheck);
      checksPerformed++;
      relationshipCheck.status === 'passed' ? checksPassed++ : checksFailed++;

      // Check 3: Data duplication check
      console.log('Checking for data duplication...');
      const duplicationCheck = await this.checkDataDuplication();
      checks.push(duplicationCheck);
      checksPerformed++;
      duplicationCheck.status === 'passed' ? checksPassed++ : checksFailed++;

      // Calculate overall score
      const overallScore = checksPerformed > 0 ? (checksPassed / checksPerformed) * 100 : 0;
      
      // Determine data health
      let dataHealth: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
      if (overallScore >= 90) {
        dataHealth = 'excellent';
      } else if (overallScore >= 75) {
        dataHealth = 'good';
      } else if (overallScore >= 50) {
        dataHealth = 'fair';
      } else if (overallScore >= 25) {
        dataHealth = 'poor';
      } else {
        dataHealth = 'critical';
      }

      // Generate recommendations
      const recommendations = this.generateRecommendations(checks);

      const report: ConsistencyReport = {
        timestamp: new Date().toISOString(),
        overallScore: Math.round(overallScore),
        checksPerformed,
        checksPassed,
        checksFailed,
        checks,
        recommendations,
        dataHealth
      };

      console.log(`✅ Consistency check completed. Score: ${overallScore}%, Health: ${dataHealth}`);
      return report;

    } catch (error) {
      console.error('❌ Consistency check failed:', error);
      
      return {
        timestamp: new Date().toISOString(),
        overallScore: 0,
        checksPerformed: checksPerformed,
        checksPassed: 0,
        checksFailed: checksPerformed,
        checks: checks,
        recommendations: ['System error occurred during consistency check'],
        dataHealth: 'critical'
      };
    }
  }

  private async checkVehicleDataIntegrity(): Promise<ConsistencyCheck> {
    try {
      const { data: vehicles, error } = await supabase
        .from('vehicles')
        .select('id, gp51_device_id, name, user_id, created_at, updated_at');

      if (error) {
        console.error('Error fetching vehicles for integrity check:', error);
        return {
          checkType: 'vehicle_data_integrity',
          status: 'failed',
          message: `Database query failed: ${error.message}`,
          severity: 'high',
          autoFixable: false
        };
      }

      if (!vehicles) {
        return {
          checkType: 'vehicle_data_integrity',
          status: 'passed',
          message: 'No vehicles found to check',
          severity: 'low',
          autoFixable: false
        };
      }

      const issues = [];
      let validVehicles = 0;

      for (const vehicle of vehicles) {
        if (!vehicle.gp51_device_id) {
          issues.push(`Vehicle ${vehicle.id} missing device ID`);
        } else if (!vehicle.name) {
          issues.push(`Vehicle ${vehicle.gp51_device_id} missing name`);
        } else {
          validVehicles++;
        }
      }

      const status = issues.length === 0 ? 'passed' : (issues.length < vehicles.length / 2 ? 'warning' : 'failed');
      
      return {
        checkType: 'vehicle_data_integrity',
        status,
        message: issues.length === 0 
          ? `All ${validVehicles} vehicles have valid data`
          : `Found ${issues.length} integrity issues in ${vehicles.length} vehicles`,
        details: issues.length > 0 ? { issues: issues.slice(0, 10) } : undefined,
        severity: issues.length === 0 ? 'low' : (issues.length < 5 ? 'medium' : 'high'),
        autoFixable: issues.length > 0 && issues.length < 10
      };

    } catch (error) {
      return {
        checkType: 'vehicle_data_integrity',
        status: 'failed',
        message: `Exception during vehicle integrity check: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'high',
        autoFixable: false
      };
    }
  }

  private async checkUserVehicleRelationships(): Promise<ConsistencyCheck> {
    try {
      const { data: vehicles, error } = await supabase
        .from('vehicles')
        .select(`
          id,
          gp51_device_id,
          user_id,
          envio_users (
            id,
            name
          )
        `);

      if (error) {
        console.error('Error checking vehicle relationships:', error);
        return {
          checkType: 'user_vehicle_relationships',
          status: 'failed',
          message: `Database query failed: ${error.message}`,
          severity: 'high',
          autoFixable: false
        };
      }

      if (!vehicles) {
        return {
          checkType: 'user_vehicle_relationships',
          status: 'passed',
          message: 'No vehicles found to check relationships',
          severity: 'low',
          autoFixable: false
        };
      }

      const issues = [];
      let validRelationships = 0;

      for (const vehicle of vehicles) {
        if (vehicle.user_id && !vehicle.envio_users) {
          issues.push(`Vehicle ${vehicle.gp51_device_id} assigned to non-existent user ${vehicle.user_id}`);
        } else {
          validRelationships++;
        }
      }

      const status = issues.length === 0 ? 'passed' : (issues.length < vehicles.length / 2 ? 'warning' : 'failed');
      
      return {
        checkType: 'user_vehicle_relationships',
        status,
        message: issues.length === 0 
          ? `All ${validRelationships} vehicle relationships are valid`
          : `Found ${issues.length} orphaned vehicle assignments`,
        details: issues.length > 0 ? { issues: issues.slice(0, 10) } : undefined,
        severity: issues.length === 0 ? 'low' : 'medium',
        autoFixable: true
      };

    } catch (error) {
      return {
        checkType: 'user_vehicle_relationships',
        status: 'failed',
        message: `Exception during relationship check: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'high',
        autoFixable: false
      };
    }
  }

  private async checkDataDuplication(): Promise<ConsistencyCheck> {
    try {
      const { data: duplicates, error } = await supabase.rpc('find_duplicate_device_ids');

      if (error) {
        console.error('Error checking for duplicates:', error);
        return {
          checkType: 'data_duplication',
          status: 'failed',
          message: `Database query failed: ${error.message}`,
          severity: 'medium',
          autoFixable: false
        };
      }

      if (!duplicates || duplicates.length === 0) {
        return {
          checkType: 'data_duplication',
          status: 'passed',
          message: 'No duplicate device IDs found',
          severity: 'low',
          autoFixable: false
        };
      }

      return {
        checkType: 'data_duplication',
        status: 'failed',
        message: `Found ${duplicates.length} duplicate device IDs`,
        details: { duplicates: duplicates.slice(0, 5) },
        severity: 'high',
        autoFixable: false
      };

    } catch (error) {
      return {
        checkType: 'data_duplication',
        status: 'failed',
        message: `Exception during duplication check: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'medium',
        autoFixable: false
      };
    }
  }

  private generateRecommendations(checks: ConsistencyCheck[]): string[] {
    const recommendations: string[] = [];

    const failedChecks = checks.filter(check => check.status === 'failed');
    const warningChecks = checks.filter(check => check.status === 'warning');

    if (failedChecks.length > 0) {
      recommendations.push('Immediate attention required: Critical data consistency issues detected');
      
      failedChecks.forEach(check => {
        if (check.autoFixable) {
          recommendations.push(`Run auto-reconciliation for ${check.checkType}`);
        } else {
          recommendations.push(`Manual review required for ${check.checkType}`);
        }
      });
    }

    if (warningChecks.length > 0) {
      recommendations.push('Monitor and schedule maintenance for warning-level issues');
    }

    if (failedChecks.length === 0 && warningChecks.length === 0) {
      recommendations.push('Data consistency is good. Schedule regular checks to maintain quality');
    }

    return recommendations;
  }
}

export const dataConsistencyVerifier = new DataConsistencyVerifier();

// Export types for backward compatibility
export type { ConsistencyReport, ConsistencyCheck } from '@/types/dataIntegrity';
