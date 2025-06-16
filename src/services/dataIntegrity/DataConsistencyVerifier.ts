
import { supabase } from '@/integrations/supabase/client';
import { ConsistencyReport, ConsistencyCheck } from '@/types/dataIntegrity';

export class DataConsistencyVerifier {
  private checks: ConsistencyCheck[] = [];

  async performFullConsistencyCheck(): Promise<ConsistencyReport> {
    console.log('🔍 Starting full data consistency check...');
    
    this.checks = [];
    
    try {
      // Perform all checks
      await this.checkVehicleDataIntegrity();
      await this.checkUserDataIntegrity();
      await this.checkGP51MetadataConsistency();
      await this.checkReferentialIntegrity();
      await this.checkDataFreshness();

      // Calculate overall score
      const totalChecks = this.checks.length;
      const passedChecks = this.checks.filter(c => c.status === 'passed').length;
      const overallScore = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0;

      // Determine data health
      let dataHealth: ConsistencyReport['dataHealth'];
      if (overallScore >= 90) dataHealth = 'excellent';
      else if (overallScore >= 75) dataHealth = 'good';
      else if (overallScore >= 50) dataHealth = 'fair';
      else if (overallScore >= 25) dataHealth = 'poor';
      else dataHealth = 'critical';

      const report: ConsistencyReport = {
        timestamp: new Date().toISOString(),
        overallScore,
        checksPerformed: totalChecks,
        checksPassed: passedChecks,
        checksFailed: totalChecks - passedChecks,
        checks: this.checks,
        recommendations: this.generateRecommendations(),
        dataHealth
      };

      console.log(`✅ Consistency check completed. Score: ${overallScore}%`);
      return report;

    } catch (error) {
      console.error('❌ Consistency check failed:', error);
      throw error;
    }
  }

  private async checkVehicleDataIntegrity(): Promise<void> {
    const check: ConsistencyCheck = {
      checkType: 'vehicle_data_integrity',
      status: 'passed',
      message: 'Vehicle data integrity verified',
      severity: 'medium',
      autoFixable: false
    };

    try {
      const { data: vehicles, error } = await supabase
        .from('vehicles')
        .select(`
          id,
          gp51_device_id,
          name,
          user_id,
          created_at,
          updated_at,
          envio_users (
            id,
            gp51_username
          )
        `);

      if (error) {
        console.error('Error fetching vehicles for integrity check:', error);
        check.status = 'failed';
        check.message = `Failed to fetch vehicle data: ${error.message}`;
        check.severity = 'high';
        this.checks.push(check);
        return;
      }

      if (!vehicles || vehicles.length === 0) {
        check.status = 'warning';
        check.message = 'No vehicles found in database';
        check.severity = 'low';
        this.checks.push(check);
        return;
      }

      // Check for vehicles with missing required data
      let issues = 0;
      for (const vehicle of vehicles) {
        if (!vehicle.gp51_device_id) {
          issues++;
        }
        if (!vehicle.name) {
          issues++;
        }
      }

      if (issues > 0) {
        check.status = 'warning';
        check.message = `Found ${issues} vehicle data integrity issues`;
        check.details = { issuesFound: issues, totalVehicles: vehicles.length };
        check.severity = issues > vehicles.length * 0.1 ? 'high' : 'medium';
      }

    } catch (error) {
      check.status = 'failed';
      check.message = `Vehicle integrity check failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      check.severity = 'high';
    }

    this.checks.push(check);
  }

  private async checkUserDataIntegrity(): Promise<void> {
    const check: ConsistencyCheck = {
      checkType: 'user_data_integrity',
      status: 'passed',
      message: 'User data integrity verified',
      severity: 'medium',
      autoFixable: false
    };

    try {
      const { data: users, error } = await supabase
        .from('envio_users')
        .select('id, name, email, gp51_username');

      if (error) {
        console.error('Error fetching users for integrity check:', error);
        check.status = 'failed';
        check.message = `Failed to fetch user data: ${error.message}`;
        check.severity = 'high';
        this.checks.push(check);
        return;
      }

      if (!users || users.length === 0) {
        check.status = 'warning';
        check.message = 'No users found in database';
        check.severity = 'low';
        this.checks.push(check);
        return;
      }

      // Check for users with missing essential data
      const usersWithoutEmail = users.filter(u => !u.email);
      const usersWithoutName = users.filter(u => !u.name);

      if (usersWithoutEmail.length > 0 || usersWithoutName.length > 0) {
        check.status = 'warning';
        check.message = `Found users with missing data: ${usersWithoutEmail.length} without email, ${usersWithoutName.length} without name`;
        check.severity = 'medium';
      }

    } catch (error) {
      check.status = 'failed';
      check.message = `User integrity check failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      check.severity = 'high';
    }

    this.checks.push(check);
  }

  private async checkGP51MetadataConsistency(): Promise<void> {
    const check: ConsistencyCheck = {
      checkType: 'gp51_metadata_consistency',
      status: 'passed',
      message: 'GP51 metadata consistency verified',
      severity: 'medium',
      autoFixable: true
    };

    try {
      const { data: vehicles, error } = await supabase
        .from('vehicles')
        .select('id, gp51_device_id, name');

      if (error) {
        console.error('Error fetching vehicles for metadata check:', error);
        check.status = 'failed';
        check.message = `Failed to fetch vehicle data: ${error.message}`;
        check.severity = 'high';
        this.checks.push(check);
        return;
      }

      if (!vehicles) {
        check.status = 'warning';
        check.message = 'No vehicles found for metadata check';
        check.severity = 'low';
        this.checks.push(check);
        return;
      }

      // Check for duplicate device IDs
      const deviceIds = vehicles.map(v => v.gp51_device_id).filter(Boolean);
      const duplicates = deviceIds.filter((id, index) => deviceIds.indexOf(id) !== index);

      if (duplicates.length > 0) {
        check.status = 'failed';
        check.message = `Found ${duplicates.length} duplicate device IDs`;
        check.details = { duplicateDeviceIds: duplicates };
        check.severity = 'high';
        check.autoFixable = false;
      }

    } catch (error) {
      check.status = 'failed';
      check.message = `GP51 metadata check failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      check.severity = 'high';
    }

    this.checks.push(check);
  }

  private async checkReferentialIntegrity(): Promise<void> {
    const check: ConsistencyCheck = {
      checkType: 'referential_integrity',
      status: 'passed',
      message: 'Referential integrity verified',
      severity: 'high',
      autoFixable: true
    };

    try {
      // Check for vehicles assigned to non-existent users
      const { data: orphanedVehicles, error } = await supabase
        .from('vehicles')
        .select(`
          id,
          gp51_device_id,
          user_id,
          envio_users (id)
        `)
        .not('user_id', 'is', null);

      if (error) {
        console.error('Error checking referential integrity:', error);
        check.status = 'failed';
        check.message = `Failed to check referential integrity: ${error.message}`;
        check.severity = 'high';
        this.checks.push(check);
        return;
      }

      if (orphanedVehicles) {
        const orphaned = orphanedVehicles.filter(v => !v.envio_users);
        if (orphaned.length > 0) {
          check.status = 'failed';
          check.message = `Found ${orphaned.length} vehicles assigned to non-existent users`;
          check.details = { orphanedVehicles: orphaned.length };
          check.severity = 'high';
        }
      }

    } catch (error) {
      check.status = 'failed';
      check.message = `Referential integrity check failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      check.severity = 'high';
    }

    this.checks.push(check);
  }

  private async checkDataFreshness(): Promise<void> {
    const check: ConsistencyCheck = {
      checkType: 'data_freshness',
      status: 'passed',
      message: 'Data freshness verified',
      severity: 'low',
      autoFixable: false
    };

    try {
      const { data: vehicles, error } = await supabase
        .from('vehicles')
        .select('updated_at')
        .order('updated_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error checking data freshness:', error);
        check.status = 'failed';
        check.message = `Failed to check data freshness: ${error.message}`;
        check.severity = 'medium';
        this.checks.push(check);
        return;
      }

      if (vehicles && vehicles.length > 0) {
        const lastUpdate = new Date(vehicles[0].updated_at);
        const hoursSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceUpdate > 24) {
          check.status = 'warning';
          check.message = `Data hasn't been updated in ${Math.round(hoursSinceUpdate)} hours`;
          check.severity = hoursSinceUpdate > 72 ? 'medium' : 'low';
        }
      }

    } catch (error) {
      check.status = 'failed';
      check.message = `Data freshness check failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      check.severity = 'medium';
    }

    this.checks.push(check);
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    
    for (const check of this.checks) {
      if (check.status === 'failed') {
        switch (check.checkType) {
          case 'vehicle_data_integrity':
            recommendations.push('Review and update vehicle records with missing required data');
            break;
          case 'user_data_integrity':
            recommendations.push('Complete user profiles with missing essential information');
            break;
          case 'gp51_metadata_consistency':
            recommendations.push('Resolve duplicate device IDs and metadata inconsistencies');
            break;
          case 'referential_integrity':
            recommendations.push('Fix orphaned vehicle assignments and broken references');
            break;
          case 'data_freshness':
            recommendations.push('Update stale data and verify data synchronization processes');
            break;
        }
      }
    }

    if (recommendations.length === 0) {
      recommendations.push('All consistency checks passed. No immediate actions required.');
    }

    return recommendations;
  }
}

export const dataConsistencyVerifier = new DataConsistencyVerifier();

// Export types for use in other files
export { ConsistencyReport, ConsistencyCheck };
