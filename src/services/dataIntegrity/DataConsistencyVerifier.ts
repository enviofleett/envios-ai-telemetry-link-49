
import { supabase } from '@/integrations/supabase/client';
import { gp51Validator } from './GP51ValidationSchemas';

export interface ConsistencyCheck {
  checkType: 'user_vehicle_link' | 'vehicle_position' | 'user_count' | 'data_integrity' | 'referential_integrity';
  status: 'passed' | 'failed' | 'warning';
  message: string;
  details?: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
  autoFixable: boolean;
}

export interface ConsistencyReport {
  timestamp: string;
  overallScore: number;
  checksPerformed: number;
  checksPassed: number;
  checksFailed: number;
  checks: ConsistencyCheck[];
  recommendations: string[];
  dataHealth: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
}

export interface InconsistencyRecord {
  id: string;
  type: string;
  description: string;
  affectedRecords: any[];
  detectedAt: string;
  severity: string;
  resolved: boolean;
  autoResolution?: string;
}

export class DataConsistencyVerifier {
  private static instance: DataConsistencyVerifier;

  static getInstance(): DataConsistencyVerifier {
    if (!DataConsistencyVerifier.instance) {
      DataConsistencyVerifier.instance = new DataConsistencyVerifier();
    }
    return DataConsistencyVerifier.instance;
  }

  async performFullConsistencyCheck(): Promise<ConsistencyReport> {
    console.log('Starting comprehensive data consistency verification...');
    const startTime = Date.now();
    const checks: ConsistencyCheck[] = [];

    try {
      // Run all consistency checks
      checks.push(...await this.checkUserVehicleConsistency());
      checks.push(...await this.checkVehicleDataIntegrity());
      checks.push(...await this.checkReferentialIntegrity());
      checks.push(...await this.checkDataFormatConsistency());
      checks.push(...await this.checkBusinessRuleConsistency());

      const report = this.generateConsistencyReport(checks, Date.now() - startTime);
      console.log(`Consistency check completed in ${Date.now() - startTime}ms`);
      
      return report;
    } catch (error) {
      console.error('Consistency check failed:', error);
      throw error;
    }
  }

  private async checkUserVehicleConsistency(): Promise<ConsistencyCheck[]> {
    const checks: ConsistencyCheck[] = [];

    try {
      // Check for orphaned vehicles (vehicles without users)
      const { data: orphanedVehicles } = await supabase
        .from('vehicles')
        .select('id, device_id, gp51_username')
        .is('envio_user_id', null);

      if (orphanedVehicles && orphanedVehicles.length > 0) {
        checks.push({
          checkType: 'user_vehicle_link',
          status: 'failed',
          message: `Found ${orphanedVehicles.length} orphaned vehicles`,
          details: { orphanedVehicles: orphanedVehicles.slice(0, 10) },
          severity: 'high',
          autoFixable: true
        });
      } else {
        checks.push({
          checkType: 'user_vehicle_link',
          status: 'passed',
          message: 'No orphaned vehicles found',
          severity: 'low',
          autoFixable: false
        });
      }

      // Check for users without vehicles
      const { data: usersWithoutVehicles } = await supabase
        .from('envio_users')
        .select(`
          id, 
          name, 
          gp51_username,
          vehicles:vehicles(count)
        `)
        .eq('is_gp51_imported', true);

      const emptyUsers = usersWithoutVehicles?.filter(user => 
        !user.vehicles || user.vehicles.length === 0
      ) || [];

      if (emptyUsers.length > 0) {
        checks.push({
          checkType: 'user_vehicle_link',
          status: 'warning',
          message: `Found ${emptyUsers.length} users without vehicles`,
          details: { emptyUsers: emptyUsers.slice(0, 10) },
          severity: 'medium',
          autoFixable: false
        });
      }

      // Check for username mismatches
      const { data: vehicleUserMismatches } = await supabase
        .from('vehicles')
        .select(`
          id,
          device_id,
          gp51_username,
          envio_user_id,
          envio_users!inner(gp51_username)
        `)
        .neq('gp51_username', 'envio_users.gp51_username');

      if (vehicleUserMismatches && vehicleUserMismatches.length > 0) {
        checks.push({
          checkType: 'user_vehicle_link',
          status: 'failed',
          message: `Found ${vehicleUserMismatches.length} username mismatches`,
          details: { mismatches: vehicleUserMismatches },
          severity: 'critical',
          autoFixable: true
        });
      }

    } catch (error) {
      checks.push({
        checkType: 'user_vehicle_link',
        status: 'failed',
        message: `Error checking user-vehicle consistency: ${error}`,
        severity: 'critical',
        autoFixable: false
      });
    }

    return checks;
  }

  private async checkVehicleDataIntegrity(): Promise<ConsistencyCheck[]> {
    const checks: ConsistencyCheck[] = [];

    try {
      // Check for invalid coordinates
      const { data: invalidCoordinates } = await supabase
        .from('vehicles')
        .select('id, device_id, gp51_metadata')
        .or('gp51_metadata->>latitude.eq.0,gp51_metadata->>longitude.eq.0')
        .not('gp51_metadata->>latitude', 'is', null)
        .not('gp51_metadata->>longitude', 'is', null);

      if (invalidCoordinates && invalidCoordinates.length > 0) {
        checks.push({
          checkType: 'vehicle_position',
          status: 'warning',
          message: `Found ${invalidCoordinates.length} vehicles with invalid coordinates`,
          details: { invalidCoordinates: invalidCoordinates.slice(0, 5) },
          severity: 'medium',
          autoFixable: false
        });
      }

      // Check for duplicate device IDs
      const { data: duplicateDevices } = await supabase
        .rpc('find_duplicate_device_ids');

      if (duplicateDevices && duplicateDevices.length > 0) {
        checks.push({
          checkType: 'data_integrity',
          status: 'failed',
          message: `Found ${duplicateDevices.length} duplicate device IDs`,
          details: { duplicates: duplicateDevices },
          severity: 'critical',
          autoFixable: false
        });
      }

      // Check for vehicles with missing metadata
      const { data: missingMetadata } = await supabase
        .from('vehicles')
        .select('id, device_id')
        .or('gp51_metadata.is.null,gp51_metadata.eq.{}');

      if (missingMetadata && missingMetadata.length > 0) {
        checks.push({
          checkType: 'data_integrity',
          status: 'warning',
          message: `Found ${missingMetadata.length} vehicles with missing metadata`,
          details: { missingMetadata: missingMetadata.slice(0, 10) },
          severity: 'medium',
          autoFixable: true
        });
      }

    } catch (error) {
      checks.push({
        checkType: 'vehicle_position',
        status: 'failed',
        message: `Error checking vehicle data integrity: ${error}`,
        severity: 'critical',
        autoFixable: false
      });
    }

    return checks;
  }

  private async checkReferentialIntegrity(): Promise<ConsistencyCheck[]> {
    const checks: ConsistencyCheck[] = [];

    try {
      // Check foreign key relationships
      const referentialChecks = [
        {
          table: 'vehicles',
          column: 'envio_user_id',
          referencedTable: 'envio_users',
          referencedColumn: 'id'
        }
      ];

      for (const check of referentialChecks) {
        const { data: violations } = await supabase
          .rpc('check_referential_integrity', {
            source_table: check.table,
            source_column: check.column,
            target_table: check.referencedTable,
            target_column: check.referencedColumn
          });

        if (violations && violations.length > 0) {
          checks.push({
            checkType: 'referential_integrity',
            status: 'failed',
            message: `Referential integrity violation in ${check.table}.${check.column}`,
            details: { violations },
            severity: 'critical',
            autoFixable: true
          });
        }
      }

    } catch (error) {
      checks.push({
        checkType: 'referential_integrity',
        status: 'failed',
        message: `Error checking referential integrity: ${error}`,
        severity: 'critical',
        autoFixable: false
      });
    }

    return checks;
  }

  private async checkDataFormatConsistency(): Promise<ConsistencyCheck[]> {
    const checks: ConsistencyCheck[] = [];

    try {
      // Check GP51 metadata format consistency
      const { data: vehicles } = await supabase
        .from('vehicles')
        .select('id, device_id, gp51_metadata')
        .not('gp51_metadata', 'is', null);

      let invalidFormat = 0;
      const invalidVehicles: any[] = [];

      vehicles?.forEach(vehicle => {
        if (vehicle.gp51_metadata) {
          const validation = gp51Validator.validateVehicle(vehicle.gp51_metadata);
          if (!validation.success) {
            invalidFormat++;
            if (invalidVehicles.length < 5) {
              invalidVehicles.push({
                id: vehicle.id,
                device_id: vehicle.device_id,
                errors: validation.errors
              });
            }
          }
        }
      });

      if (invalidFormat > 0) {
        checks.push({
          checkType: 'data_integrity',
          status: 'warning',
          message: `Found ${invalidFormat} vehicles with invalid metadata format`,
          details: { invalidVehicles },
          severity: 'medium',
          autoFixable: true
        });
      } else {
        checks.push({
          checkType: 'data_integrity',
          status: 'passed',
          message: 'All vehicle metadata formats are valid',
          severity: 'low',
          autoFixable: false
        });
      }

    } catch (error) {
      checks.push({
        checkType: 'data_integrity',
        status: 'failed',
        message: `Error checking data format consistency: ${error}`,
        severity: 'high',
        autoFixable: false
      });
    }

    return checks;
  }

  private async checkBusinessRuleConsistency(): Promise<ConsistencyCheck[]> {
    const checks: ConsistencyCheck[] = [];

    try {
      // Check for inactive vehicles with recent activity
      const { data: inactiveWithActivity } = await supabase
        .from('vehicles')
        .select('id, device_id, is_active, gp51_metadata')
        .eq('is_active', false)
        .gte('gp51_metadata->>lastupdate', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (inactiveWithActivity && inactiveWithActivity.length > 0) {
        checks.push({
          checkType: 'data_integrity',
          status: 'warning',
          message: `Found ${inactiveWithActivity.length} inactive vehicles with recent activity`,
          details: { vehicles: inactiveWithActivity.slice(0, 5) },
          severity: 'medium',
          autoFixable: true
        });
      }

      // Check for users with excessive vehicle counts
      const { data: usersWithManyVehicles } = await supabase
        .from('envio_users')
        .select(`
          id,
          name,
          gp51_username,
          vehicles:vehicles(count)
        `)
        .gt('vehicles.count', 100); // Configurable threshold

      if (usersWithManyVehicles && usersWithManyVehicles.length > 0) {
        checks.push({
          checkType: 'data_integrity',
          status: 'warning',
          message: `Found ${usersWithManyVehicles.length} users with >100 vehicles`,
          details: { users: usersWithManyVehicles },
          severity: 'low',
          autoFixable: false
        });
      }

    } catch (error) {
      checks.push({
        checkType: 'data_integrity',
        status: 'failed',
        message: `Error checking business rule consistency: ${error}`,
        severity: 'high',
        autoFixable: false
      });
    }

    return checks;
  }

  private generateConsistencyReport(checks: ConsistencyCheck[], duration: number): ConsistencyReport {
    const checksPassed = checks.filter(c => c.status === 'passed').length;
    const checksFailed = checks.filter(c => c.status === 'failed').length;
    const checksWarning = checks.filter(c => c.status === 'warning').length;
    
    const overallScore = checks.length > 0 ? 
      Math.round(((checksPassed + (checksWarning * 0.5)) / checks.length) * 100) : 100;

    const dataHealth = this.calculateDataHealth(overallScore, checks);
    const recommendations = this.generateRecommendations(checks);

    return {
      timestamp: new Date().toISOString(),
      overallScore,
      checksPerformed: checks.length,
      checksPassed,
      checksFailed,
      checks,
      recommendations,
      dataHealth
    };
  }

  private calculateDataHealth(score: number, checks: ConsistencyCheck[]): 'excellent' | 'good' | 'fair' | 'poor' | 'critical' {
    const criticalIssues = checks.filter(c => c.severity === 'critical' && c.status === 'failed').length;
    
    if (criticalIssues > 0) return 'critical';
    if (score >= 95) return 'excellent';
    if (score >= 85) return 'good';
    if (score >= 70) return 'fair';
    return 'poor';
  }

  private generateRecommendations(checks: ConsistencyCheck[]): string[] {
    const recommendations: string[] = [];
    
    const criticalIssues = checks.filter(c => c.severity === 'critical' && c.status === 'failed');
    const autoFixableIssues = checks.filter(c => c.autoFixable && c.status !== 'passed');
    
    if (criticalIssues.length > 0) {
      recommendations.push(`Immediately address ${criticalIssues.length} critical data integrity issues`);
    }
    
    if (autoFixableIssues.length > 0) {
      recommendations.push(`Run automated data reconciliation for ${autoFixableIssues.length} fixable issues`);
    }
    
    const userVehicleIssues = checks.filter(c => 
      c.checkType === 'user_vehicle_link' && c.status !== 'passed'
    );
    
    if (userVehicleIssues.length > 0) {
      recommendations.push('Review and fix user-vehicle relationship inconsistencies');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Data integrity looks good! Continue regular monitoring.');
    }
    
    return recommendations;
  }

  // Real-time consistency monitoring
  async startRealtimeMonitoring(intervalMs: number = 300000): Promise<void> {
    console.log(`Starting real-time consistency monitoring (interval: ${intervalMs}ms)`);
    
    setInterval(async () => {
      try {
        const report = await this.performFullConsistencyCheck();
        
        if (report.dataHealth === 'critical' || report.dataHealth === 'poor') {
          console.error('Critical data consistency issues detected:', report);
          // Trigger alerts here
        }
        
        // Store consistency metrics
        await this.storeConsistencyMetrics(report);
        
      } catch (error) {
        console.error('Real-time consistency check failed:', error);
      }
    }, intervalMs);
  }

  private async storeConsistencyMetrics(report: ConsistencyReport): Promise<void> {
    try {
      await supabase
        .from('data_consistency_logs')
        .insert({
          timestamp: report.timestamp,
          overall_score: report.overallScore,
          checks_performed: report.checksPerformed,
          checks_passed: report.checksPassed,
          checks_failed: report.checksFailed,
          data_health: report.dataHealth,
          report_data: report
        });
    } catch (error) {
      console.error('Failed to store consistency metrics:', error);
    }
  }
}

export const dataConsistencyVerifier = DataConsistencyVerifier.getInstance();
