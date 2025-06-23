
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../gp51-service-management/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🔄 [WEEKLY-VALIDATION] Starting weekly credential validation...');

    // Create a new validation job
    const { data: job, error: jobError } = await supabase
      .from('credential_validation_jobs')
      .insert({
        job_name: 'Weekly GP51 Credential Check',
        validation_type: 'weekly_auto',
        status: 'running',
        started_at: new Date().toISOString(),
        next_scheduled_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      })
      .select()
      .single();

    if (jobError) {
      console.error('❌ Failed to create validation job:', jobError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: jobError.message 
      }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Get all GP51 sessions to validate
    const { data: sessions, error: sessionsError } = await supabase
      .from('gp51_sessions')
      .select('*')
      .order('created_at', { ascending: false });

    if (sessionsError) {
      console.error('❌ Failed to fetch sessions:', sessionsError);
      throw sessionsError;
    }

    const validationResults = [];
    let validSessions = 0;
    let invalidSessions = 0;

    // Validate each session
    for (const session of sessions || []) {
      const startTime = Date.now();
      let healthStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
      const issues: string[] = [];
      const recommendations: string[] = [];

      try {
        // Check session validity
        const expiresAt = new Date(session.token_expires_at);
        const now = new Date();
        const isValid = expiresAt > now;

        if (!isValid) {
          healthStatus = 'critical';
          issues.push('Session token has expired');
          recommendations.push('Re-authenticate with GP51');
          invalidSessions++;
        } else {
          // Check if expires soon (within 24 hours)
          const hoursUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);
          if (hoursUntilExpiry < 24) {
            healthStatus = 'warning';
            issues.push('Session token expires within 24 hours');
            recommendations.push('Monitor for auto-refresh or re-authenticate if needed');
          }
          validSessions++;
        }

        const apiResponseTime = Date.now() - startTime;

        // Record health report
        await supabase.from('credential_health_reports').insert({
          validation_job_id: job.id,
          username: session.username,
          health_status: healthStatus,
          connectivity_test_passed: isValid,
          api_response_time_ms: apiResponseTime,
          token_expires_at: session.token_expires_at,
          issues_detected: issues,
          recommendations: recommendations
        });

        validationResults.push({
          username: session.username,
          status: healthStatus,
          issues: issues.length
        });

        // Create system alert for critical issues
        if (healthStatus === 'critical') {
          await supabase.from('system_alerts').insert({
            alert_type: 'credential_failure',
            severity: 'critical',
            title: `GP51 Credential Failure: ${session.username}`,
            message: `Critical issues detected for ${session.username}: ${issues.join(', ')}`,
            source_system: 'gp51_validation',
            source_entity_id: session.id,
            alert_data: {
              username: session.username,
              issues,
              recommendations
            }
          });
        }

      } catch (error) {
        console.error(`❌ Validation failed for ${session.username}:`, error);
        invalidSessions++;
        
        await supabase.from('credential_health_reports').insert({
          validation_job_id: job.id,
          username: session.username,
          health_status: 'critical',
          connectivity_test_passed: false,
          issues_detected: ['Validation system error'],
          recommendations: ['Check system logs and connectivity']
        });
      }
    }

    // Update job completion
    await supabase
      .from('credential_validation_jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        validation_results: {
          totalSessions: sessions?.length || 0,
          validSessions,
          invalidSessions,
          validationResults
        }
      })
      .eq('id', job.id);

    console.log(`✅ [WEEKLY-VALIDATION] Completed: ${validSessions} valid, ${invalidSessions} invalid sessions`);

    return new Response(JSON.stringify({
      success: true,
      jobId: job.id,
      totalSessions: sessions?.length || 0,
      validSessions,
      invalidSessions,
      validationResults
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ [WEEKLY-VALIDATION] Failed:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Validation failed'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
