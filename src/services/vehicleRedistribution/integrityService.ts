
import { supabase } from '@/integrations/supabase/client';

export class IntegrityService {
  async analyzeDataIntegrity(): Promise<{ 
    healthyAssignments: number;
    orphanedVehicles: number;
    invalidUserAssignments: number;
    duplicateAssignments: number;
    issues: any[];
  }> {
    console.log('Analyzing data integrity...');

    const issues: any[] = [];

    // Check for vehicles without valid user assignments
    const { data: orphanedVehicles, error: orphanedError } = await supabase
      .from('vehicles')
      .select('gp51_device_id, user_id')
      .is('user_id', null);

    if (orphanedError) {
      console.error('Error checking orphaned vehicles:', orphanedError);
      issues.push({
        type: 'query_error',
        message: 'Failed to check orphaned vehicles',
        error: orphanedError
      });
    }

    // Check for vehicles assigned to non-existent users
    const { data: vehiclesWithUsers, error: usersError } = await supabase
      .from('vehicles')
      .select(`
        gp51_device_id,
        user_id,
        envio_users (
          id,
          name
        )
      `)
      .not('user_id', 'is', null);

    if (usersError) {
      console.error('Error checking vehicle-user assignments:', usersError);
      issues.push({
        type: 'query_error',
        message: 'Failed to check vehicle-user assignments',
        error: usersError
      });
    }

    const invalidUserAssignments = vehiclesWithUsers?.filter(v => !v.envio_users) || [];
    
    // Check for duplicate device assignments
    const { data: allVehicles, error: duplicateError } = await supabase
      .from('vehicles')
      .select('gp51_device_id');

    if (duplicateError) {
      console.error('Error checking duplicates:', duplicateError);
      issues.push({
        type: 'query_error',
        message: 'Failed to check duplicate assignments',
        error: duplicateError
      });
    }

    const deviceCounts = allVehicles?.reduce((acc, vehicle) => {
      acc[vehicle.gp51_device_id] = (acc[vehicle.gp51_device_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    const duplicateAssignments = Object.values(deviceCounts).filter(count => count > 1).length;

    const totalVehicles = allVehicles?.length || 0;
    const orphanedCount = orphanedVehicles?.length || 0;
    const invalidCount = invalidUserAssignments.length;
    const healthyAssignments = totalVehicles - orphanedCount - invalidCount - duplicateAssignments;

    console.log(`Integrity analysis: ${healthyAssignments} healthy, ${orphanedCount} orphaned, ${invalidCount} invalid assignments`);

    return {
      healthyAssignments,
      orphanedVehicles: orphanedCount,
      invalidUserAssignments: invalidCount,
      duplicateAssignments,
      issues
    };
  }

  async validateGp51DataIntegrity(): Promise<{
    isValid: boolean;
    errors: string[];
    recommendations: string[];
  }> {
    console.log('Validating GP51 data integrity...');
    
    const errors: string[] = [];
    const recommendations: string[] = [];
    
    try {
      const analysis = await this.analyzeDataIntegrity();
      
      if (analysis.orphanedVehicles > 0) {
        errors.push(`Found ${analysis.orphanedVehicles} vehicles without user assignments`);
        recommendations.push('Assign orphaned vehicles to appropriate users');
      }
      
      if (analysis.invalidUserAssignments > 0) {
        errors.push(`Found ${analysis.invalidUserAssignments} vehicles assigned to non-existent users`);
        recommendations.push('Clean up invalid user assignments');
      }
      
      if (analysis.duplicateAssignments > 0) {
        errors.push(`Found ${analysis.duplicateAssignments} duplicate device assignments`);
        recommendations.push('Remove duplicate device entries');
      }
      
      return {
        isValid: errors.length === 0,
        errors,
        recommendations
      };
    } catch (error) {
      console.error('Error validating GP51 data integrity:', error);
      return {
        isValid: false,
        errors: ['Failed to validate data integrity'],
        recommendations: ['Check database connectivity and permissions']
      };
    }
  }
}
