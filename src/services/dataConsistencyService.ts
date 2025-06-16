
import { supabase } from '@/integrations/supabase/client';

export interface DataConsistencyReport {
  overall_score: number;
  checks_performed: number;
  checks_passed: number;
  checks_failed: number;
  data_health: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  issues: {
    category: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    affected_records: number;
    recommendation: string;
  }[];
  recommendations: string[];
  last_check: string;
}

export interface ConsistencyCheckResult {
  check_name: string;
  passed: boolean;
  affected_records: number;
  details: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

class DataConsistencyService {
  private static instance: DataConsistencyService;

  static getInstance(): DataConsistencyService {
    if (!DataConsistencyService.instance) {
      DataConsistencyService.instance = new DataConsistencyService();
    }
    return DataConsistencyService.instance;
  }

  async runFullConsistencyCheck(): Promise<DataConsistencyReport> {
    console.log('🔍 Starting full data consistency check...');
    
    const checks: ConsistencyCheckResult[] = [];
    
    try {
      // Check 1: Orphaned sessions
      const orphanedSessionsCheck = await this.checkOrphanedSessions();
      checks.push(orphanedSessionsCheck);

      // Check 2: Vehicles without users
      const orphanedVehiclesCheck = await this.checkOrphanedVehicles();
      checks.push(orphanedVehiclesCheck);

      // Check 3: Duplicate device IDs
      const duplicateDevicesCheck = await this.checkDuplicateDeviceIds();
      checks.push(duplicateDevicesCheck);

      // Check 4: Invalid device IDs
      const invalidDeviceIdsCheck = await this.checkInvalidDeviceIds();
      checks.push(invalidDeviceIdsCheck);

      // Check 5: Users without profiles
      const usersWithoutProfilesCheck = await this.checkUsersWithoutProfiles();
      checks.push(usersWithoutProfilesCheck);

      // Check 6: Consistency between envio_users and vehicles
      const userVehicleConsistencyCheck = await this.checkUserVehicleConsistency();
      checks.push(userVehicleConsistencyCheck);

    } catch (error) {
      console.error('❌ Error during consistency checks:', error);
      // Return a default report in case of error
      return this.generateEmptyReport();
    }

    return this.generateReport(checks);
  }

  private async checkOrphanedSessions(): Promise<ConsistencyCheckResult> {
    try {
      const { data: sessions, error } = await supabase
        .from('gp51_sessions')
        .select('id, user_id')
        .not('user_id', 'is', null);

      if (error) {
        console.error('Error checking orphaned sessions:', error);
        return {
          check_name: 'Orphaned Sessions Check',
          passed: false,
          affected_records: 0,
          details: `Error: ${error.message}`,
          severity: 'medium'
        };
      }

      const orphanedCount = sessions?.length || 0;

      return {
        check_name: 'Orphaned Sessions Check',
        passed: orphanedCount === 0,
        affected_records: orphanedCount,
        details: orphanedCount > 0 ? `Found ${orphanedCount} sessions that may need cleanup` : 'No orphaned sessions found',
        severity: orphanedCount > 10 ? 'high' : orphanedCount > 0 ? 'medium' : 'low'
      };
    } catch (error) {
      console.error('Error in checkOrphanedSessions:', error);
      return {
        check_name: 'Orphaned Sessions Check',
        passed: false,
        affected_records: 0,
        details: 'Check failed due to error',
        severity: 'medium'
      };
    }
  }

  private async checkOrphanedVehicles(): Promise<ConsistencyCheckResult> {
    try {
      const { data: vehicles, error } = await supabase
        .from('vehicles')
        .select('id, gp51_device_id, name, user_id')
        .is('user_id', null);

      if (error) {
        console.error('Error checking orphaned vehicles:', error);
        return {
          check_name: 'Orphaned Vehicles Check',
          passed: false,
          affected_records: 0,
          details: `Error: ${error.message}`,
          severity: 'medium'
        };
      }

      const orphanedCount = vehicles?.length || 0;
      const affectedDevices = vehicles?.map(v => v.gp51_device_id).join(', ') || '';

      return {
        check_name: 'Orphaned Vehicles Check',
        passed: orphanedCount === 0,
        affected_records: orphanedCount,
        details: orphanedCount > 0 ? `Found ${orphanedCount} vehicles without assigned users: ${affectedDevices}` : 'All vehicles have assigned users',
        severity: orphanedCount > 5 ? 'high' : orphanedCount > 0 ? 'medium' : 'low'
      };
    } catch (error) {
      console.error('Error in checkOrphanedVehicles:', error);
      return {
        check_name: 'Orphaned Vehicles Check',
        passed: false,
        affected_records: 0,
        details: 'Check failed due to error',
        severity: 'medium'
      };
    }
  }

  private async checkDuplicateDeviceIds(): Promise<ConsistencyCheckResult> {
    try {
      const { data: duplicates, error } = await supabase
        .rpc('find_duplicate_device_ids');

      if (error) {
        console.error('Error checking duplicate device IDs:', error);
        return {
          check_name: 'Duplicate Device IDs Check',
          passed: false,
          affected_records: 0,
          details: `Error: ${error.message}`,
          severity: 'high'
        };
      }

      const duplicateCount = duplicates?.length || 0;
      const duplicateIds = duplicates?.map((d: any) => `${d.device_id} (${d.count} instances)`).join(', ') || '';

      return {
        check_name: 'Duplicate Device IDs Check',
        passed: duplicateCount === 0,
        affected_records: duplicateCount,
        details: duplicateCount > 0 ? `Found duplicate device IDs: ${duplicateIds}` : 'No duplicate device IDs found',
        severity: duplicateCount > 0 ? 'critical' : 'low'
      };
    } catch (error) {
      console.error('Error in checkDuplicateDeviceIds:', error);
      return {
        check_name: 'Duplicate Device IDs Check',
        passed: false,
        affected_records: 0,
        details: 'Check failed due to error',
        severity: 'high'
      };
    }
  }

  private async checkInvalidDeviceIds(): Promise<ConsistencyCheckResult> {
    try {
      const { data: vehicles, error } = await supabase
        .from('vehicles')
        .select('id, gp51_device_id, name, created_at, updated_at');

      if (error) {
        console.error('Error checking invalid device IDs:', error);
        return {
          check_name: 'Invalid Device IDs Check',
          passed: false,
          affected_records: 0,
          details: `Error: ${error.message}`,
          severity: 'medium'
        };
      }

      const invalidVehicles = vehicles?.filter(v => {
        const deviceId = v.gp51_device_id;
        return !deviceId || deviceId.length < 3 || deviceId.length > 50;
      }) || [];

      const invalidCount = invalidVehicles.length;
      const invalidIds = invalidVehicles.map(v => v.gp51_device_id).join(', ');

      return {
        check_name: 'Invalid Device IDs Check',
        passed: invalidCount === 0,
        affected_records: invalidCount,
        details: invalidCount > 0 ? `Found ${invalidCount} vehicles with invalid device IDs: ${invalidIds}` : 'All device IDs are valid',
        severity: invalidCount > 3 ? 'high' : invalidCount > 0 ? 'medium' : 'low'
      };
    } catch (error) {
      console.error('Error in checkInvalidDeviceIds:', error);
      return {
        check_name: 'Invalid Device IDs Check',
        passed: false,
        affected_records: 0,
        details: 'Check failed due to error',
        severity: 'medium'
      };
    }
  }

  private async checkUsersWithoutProfiles(): Promise<ConsistencyCheckResult> {
    try {
      const { data: users, error: usersError } = await supabase
        .from('envio_users')
        .select('id, name, email');

      if (usersError) {
        console.error('Error fetching users:', usersError);
        return {
          check_name: 'Users Without Profiles Check',
          passed: false,
          affected_records: 0,
          details: `Error fetching users: ${usersError.message}`,
          severity: 'medium'
        };
      }

      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id');

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        return {
          check_name: 'Users Without Profiles Check',
          passed: false,
          affected_records: 0,
          details: `Error fetching profiles: ${profilesError.message}`,
          severity: 'medium'
        };
      }

      const profileIds = new Set(profiles?.map(p => p.id) || []);
      const usersWithoutProfiles = users?.filter(u => !profileIds.has(u.id)) || [];
      const missingCount = usersWithoutProfiles.length;

      return {
        check_name: 'Users Without Profiles Check',
        passed: missingCount === 0,
        affected_records: missingCount,
        details: missingCount > 0 ? `Found ${missingCount} users without profiles` : 'All users have profiles',
        severity: missingCount > 5 ? 'high' : missingCount > 0 ? 'medium' : 'low'
      };
    } catch (error) {
      console.error('Error in checkUsersWithoutProfiles:', error);
      return {
        check_name: 'Users Without Profiles Check',
        passed: false,
        affected_records: 0,
        details: 'Check failed due to error',
        severity: 'medium'
      };
    }
  }

  private async checkUserVehicleConsistency(): Promise<ConsistencyCheckResult> {
    try {
      const { data: vehicles, error } = await supabase
        .from('vehicles')
        .select('id, gp51_device_id, user_id')
        .not('user_id', 'is', null);

      if (error) {
        console.error('Error checking user-vehicle consistency:', error);
        return {
          check_name: 'User-Vehicle Consistency Check',
          passed: false,
          affected_records: 0,
          details: `Error: ${error.message}`,
          severity: 'medium'
        };
      }

      // Check if referenced users exist
      const userIds = [...new Set(vehicles?.map(v => v.user_id).filter(Boolean) || [])];
      const { data: existingUsers, error: usersError } = await supabase
        .from('envio_users')
        .select('id')
        .in('id', userIds);

      if (usersError) {
        console.error('Error fetching users for consistency check:', usersError);
        return {
          check_name: 'User-Vehicle Consistency Check',
          passed: false,
          affected_records: 0,
          details: `Error fetching users: ${usersError.message}`,
          severity: 'medium'
        };
      }

      const existingUserIds = new Set(existingUsers?.map(u => u.id) || []);
      const orphanedVehicles = vehicles?.filter(v => v.user_id && !existingUserIds.has(v.user_id)) || [];
      const inconsistentCount = orphanedVehicles.length;

      return {
        check_name: 'User-Vehicle Consistency Check',
        passed: inconsistentCount === 0,
        affected_records: inconsistentCount,
        details: inconsistentCount > 0 ? `Found ${inconsistentCount} vehicles referencing non-existent users` : 'All vehicle-user references are valid',
        severity: inconsistentCount > 0 ? 'high' : 'low'
      };
    } catch (error) {
      console.error('Error in checkUserVehicleConsistency:', error);
      return {
        check_name: 'User-Vehicle Consistency Check',
        passed: false,
        affected_records: 0,
        details: 'Check failed due to error',
        severity: 'medium'
      };
    }
  }

  private generateReport(checks: ConsistencyCheckResult[]): DataConsistencyReport {
    const checksPerformed = checks.length;
    const checksPassed = checks.filter(c => c.passed).length;
    const checksFailed = checksPerformed - checksPassed;
    
    const overallScore = checksPerformed > 0 ? Math.round((checksPassed / checksPerformed) * 100) : 0;
    
    // Determine data health based on score and critical issues
    let dataHealth: DataConsistencyReport['data_health'] = 'excellent';
    const criticalIssues = checks.filter(c => !c.passed && c.severity === 'critical').length;
    const highIssues = checks.filter(c => !c.passed && c.severity === 'high').length;
    
    if (criticalIssues > 0) {
      dataHealth = 'critical';
    } else if (highIssues > 0) {
      dataHealth = 'poor';
    } else if (overallScore < 50) {
      dataHealth = 'poor';
    } else if (overallScore < 75) {
      dataHealth = 'fair';
    } else if (overallScore < 90) {
      dataHealth = 'good';
    }

    // Generate issues and recommendations
    const issues = checks
      .filter(c => !c.passed)
      .map(c => ({
        category: c.check_name,
        severity: c.severity,
        description: c.details,
        affected_records: c.affected_records,
        recommendation: this.getRecommendationForCheck(c.check_name, c.severity)
      }));

    const recommendations = this.generateRecommendations(checks);

    return {
      overall_score: overallScore,
      checks_performed: checksPerformed,
      checks_passed: checksPassed,
      checks_failed: checksFailed,
      data_health: dataHealth,
      issues,
      recommendations,
      last_check: new Date().toISOString()
    };
  }

  private generateEmptyReport(): DataConsistencyReport {
    return {
      overall_score: 0,
      checks_performed: 0,
      checks_passed: 0,
      checks_failed: 0,
      data_health: 'critical',
      issues: [{
        category: 'System Error',
        severity: 'critical',
        description: 'Failed to perform consistency checks',
        affected_records: 0,
        recommendation: 'Check system logs and database connectivity'
      }],
      recommendations: ['Investigate system errors', 'Check database connectivity'],
      last_check: new Date().toISOString()
    };
  }

  private getRecommendationForCheck(checkName: string, severity: string): string {
    const recommendations: Record<string, string> = {
      'Orphaned Sessions Check': 'Clean up orphaned sessions to improve security',
      'Orphaned Vehicles Check': 'Assign vehicles to users or remove if no longer needed',
      'Duplicate Device IDs Check': 'Remove duplicate entries and ensure unique device IDs',
      'Invalid Device IDs Check': 'Update invalid device IDs to meet format requirements',
      'Users Without Profiles Check': 'Create missing user profiles or clean up orphaned users',
      'User-Vehicle Consistency Check': 'Fix vehicle assignments to reference valid users'
    };

    return recommendations[checkName] || 'Review and fix the identified issues';
  }

  private generateRecommendations(checks: ConsistencyCheckResult[]): string[] {
    const recommendations: string[] = [];
    
    const failedChecks = checks.filter(c => !c.passed);
    
    if (failedChecks.length === 0) {
      recommendations.push('Data consistency is excellent. Continue regular monitoring.');
    } else {
      recommendations.push('Schedule regular data consistency checks');
      
      if (failedChecks.some(c => c.severity === 'critical')) {
        recommendations.push('Address critical issues immediately to prevent data corruption');
      }
      
      if (failedChecks.some(c => c.check_name.includes('Duplicate'))) {
        recommendations.push('Implement unique constraints to prevent duplicates');
      }
      
      if (failedChecks.some(c => c.check_name.includes('Orphaned'))) {
        recommendations.push('Set up automated cleanup processes for orphaned records');
      }
    }

    return recommendations;
  }

  async logConsistencyCheck(report: DataConsistencyReport): Promise<void> {
    try {
      const { error } = await supabase
        .from('data_consistency_logs')
        .insert({
          overall_score: report.overall_score,
          checks_performed: report.checks_performed,
          checks_passed: report.checks_passed,
          checks_failed: report.checks_failed,
          data_health: report.data_health,
          report_data: report
        });

      if (error) {
        console.error('Error logging consistency check:', error);
      }
    } catch (error) {
      console.error('Error logging consistency check:', error);
    }
  }
}

export const dataConsistencyService = DataConsistencyService.getInstance();
export default dataConsistencyService;
