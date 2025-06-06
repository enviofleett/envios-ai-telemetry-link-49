
import { supabase } from '@/integrations/supabase/client';

export interface GP51ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export async function validateGP51Configuration(): Promise<GP51ValidationResult> {
  const result: GP51ValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  try {
    console.log('Validating GP51 configuration...');
    
    // Test GP51 connectivity using the improved test_connection action
    const { data, error } = await supabase.functions.invoke('gp51-service-management', {
      body: { action: 'test_connection' }
    });

    if (error) {
      result.isValid = false;
      result.errors.push(`GP51 connection test failed: ${error.message}`);
      return result;
    }

    if (!data?.success) {
      result.isValid = false;
      result.errors.push(data?.error || 'GP51 service is not responding correctly');
      return result;
    }

    console.log('GP51 connectivity test passed for user:', data.username);

    // Check for existing GP51 sessions
    const { data: sessions, error: sessionError } = await supabase
      .from('gp51_sessions')
      .select('username, token_expires_at')
      .order('created_at', { ascending: false })
      .limit(1);

    if (sessionError) {
      result.warnings.push('Could not verify GP51 session status');
    } else if (!sessions || sessions.length === 0) {
      result.warnings.push('No GP51 sessions found. You may need to authenticate first.');
    } else {
      const session = sessions[0];
      const expiresAt = new Date(session.token_expires_at);
      const now = new Date();
      
      if (expiresAt <= now) {
        result.warnings.push(`GP51 session for ${session.username} has expired. Please re-authenticate.`);
      } else {
        console.log(`Active GP51 session found for ${session.username}, expires at ${expiresAt}`);
      }
    }

    // Additional validation checks
    try {
      const { data: importJobs, error: jobError } = await supabase
        .from('gp51_system_imports')
        .select('id, status')
        .eq('status', 'processing')
        .limit(1);

      if (jobError) {
        result.warnings.push('Could not check for running import jobs');
      } else if (importJobs && importJobs.length > 0) {
        result.warnings.push('There are currently running import jobs. Consider waiting for them to complete.');
      }
    } catch (error) {
      result.warnings.push('Could not verify import job status');
    }

    return result;

  } catch (error) {
    console.error('GP51 validation failed:', error);
    result.isValid = false;
    result.errors.push(`Validation failed: ${error.message}`);
    return result;
  }
}

export function getGP51ConfigurationHelp(): string[] {
  return [
    '1. Ensure GP51_API_BASE_URL is configured in Supabase secrets',
    '2. Test GP51 connectivity in Admin Settings',
    '3. Verify GP51 credentials are valid and not expired',
    '4. Check that GP51 services are accessible from your network',
    '5. Ensure no other import operations are currently running',
    '6. Verify GP51 session is active and not expired'
  ];
}

export async function refreshGP51Session(): Promise<boolean> {
  try {
    console.log('Attempting to refresh GP51 session...');
    
    const { data, error } = await supabase.functions.invoke('gp51-service-management', {
      body: { action: 'refresh_session' }
    });

    if (error) {
      console.error('Failed to refresh GP51 session:', error);
      return false;
    }

    return data?.success || false;
  } catch (error) {
    console.error('Error refreshing GP51 session:', error);
    return false;
  }
}
