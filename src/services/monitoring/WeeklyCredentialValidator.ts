
import { supabase } from '@/integrations/supabase/client';
import { gp51SessionValidator } from '@/services/vehiclePosition/sessionValidator';

export interface CredentialValidationResult {
  success: boolean;
  healthStatus: 'healthy' | 'warning' | 'critical';
  issues: string[];
  recommendations: string[];
  apiResponseTime?: number;
  tokenExpiresAt?: Date;
}

export class WeeklyCredentialValidator {
  private static instance: WeeklyCredentialValidator;

  static getInstance(): WeeklyCredentialValidator {
    if (!WeeklyCredentialValidator.instance) {
      WeeklyCredentialValidator.instance = new WeeklyCredentialValidator();
    }
    return WeeklyCredentialValidator.instance;
  }

  async scheduleWeeklyValidation(): Promise<void> {
    console.log('📅 [WEEKLY-VALIDATOR] Scheduling weekly validation job');
    
    const nextScheduled = new Date();
    nextScheduled.setDate(nextScheduled.getDate() + 7); // Weekly
    
    const { error } = await supabase
      .from('credential_validation_jobs')
      .insert({
        job_name: 'Weekly GP51 Credential Check',
        validation_type: 'weekly_auto',
        next_scheduled_at: nextScheduled.toISOString()
      });

    if (error) {
      console.error('❌ [WEEKLY-VALIDATOR] Failed to schedule job:', error);
      throw error;
    }
  }

  async validateCredentials(): Promise<CredentialValidationResult> {
    console.log('🔍 [WEEKLY-VALIDATOR] Starting credential validation...');
    
    const startTime = Date.now();
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    try {
      // Test session connectivity
      const sessionResult = await gp51SessionValidator.testConnection();
      const apiResponseTime = Date.now() - startTime;
      
      if (!sessionResult.success) {
        issues.push('GP51 session validation failed');
        recommendations.push('Check GP51 credentials and re-authenticate');
      }
      
      if (!sessionResult.valid) {
        issues.push('GP51 session is invalid or expired');
        recommendations.push('Refresh GP51 authentication token');
      }

      // Check token expiration
      if (sessionResult.expiresAt) {
        const expiresIn = sessionResult.expiresAt.getTime() - Date.now();
        const hoursUntilExpiry = expiresIn / (1000 * 60 * 60);
        
        if (hoursUntilExpiry < 24) {
          issues.push('GP51 token expires within 24 hours');
          recommendations.push('Token will auto-refresh, monitor for any failures');
        }
      }

      // Check API response time
      if (apiResponseTime > 5000) {
        issues.push('Slow API response time detected');
        recommendations.push('Monitor GP51 API performance');
      }

      // Determine health status
      let healthStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
      if (issues.length > 0) {
        healthStatus = issues.some(issue => 
          issue.includes('failed') || issue.includes('invalid')
        ) ? 'critical' : 'warning';
      }

      return {
        success: sessionResult.success,
        healthStatus,
        issues,
        recommendations,
        apiResponseTime,
        tokenExpiresAt: sessionResult.expiresAt
      };

    } catch (error) {
      console.error('❌ [WEEKLY-VALIDATOR] Validation failed:', error);
      
      return {
        success: false,
        healthStatus: 'critical',
        issues: ['Credential validation system error'],
        recommendations: ['Check system logs and GP51 connectivity'],
        apiResponseTime: Date.now() - startTime
      };
    }
  }

  async recordValidationResult(
    jobId: string,
    username: string,
    result: CredentialValidationResult
  ): Promise<void> {
    console.log('📝 [WEEKLY-VALIDATOR] Recording validation result');

    const { error } = await supabase
      .from('credential_health_reports')
      .insert({
        validation_job_id: jobId,
        username,
        health_status: result.healthStatus,
        connectivity_test_passed: result.success,
        api_response_time_ms: result.apiResponseTime,
        token_expires_at: result.tokenExpiresAt?.toISOString(),
        issues_detected: result.issues,
        recommendations: result.recommendations
      });

    if (error) {
      console.error('❌ [WEEKLY-VALIDATOR] Failed to record result:', error);
      throw error;
    }

    // Create system alert if critical issues found
    if (result.healthStatus === 'critical') {
      await this.createSystemAlert(result);
    }
  }

  private async createSystemAlert(result: CredentialValidationResult): Promise<void> {
    const { error } = await supabase
      .from('system_alerts')
      .insert({
        alert_type: 'credential_failure',
        severity: 'critical',
        title: 'GP51 Credential Validation Failed',
        message: `Critical issues detected: ${result.issues.join(', ')}`,
        source_system: 'gp51_validation',
        alert_data: {
          issues: result.issues,
          recommendations: result.recommendations,
          apiResponseTime: result.apiResponseTime
        }
      });

    if (error) {
      console.error('❌ [WEEKLY-VALIDATOR] Failed to create alert:', error);
    }
  }
}

export const weeklyCredentialValidator = WeeklyCredentialValidator.getInstance();
