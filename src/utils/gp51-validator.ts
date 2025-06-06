
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
    // Test GP51 connectivity
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
      result.errors.push('GP51 service is not responding correctly');
      return result;
    }

    // Check for existing GP51 sessions
    const { data: sessions, error: sessionError } = await supabase
      .from('gp51_sessions')
      .select('count')
      .limit(1);

    if (sessionError) {
      result.warnings.push('Could not verify GP51 session status');
    } else if (!sessions || sessions.length === 0) {
      result.warnings.push('No active GP51 sessions found. You may need to authenticate first.');
    }

    return result;

  } catch (error) {
    result.isValid = false;
    result.errors.push(`Validation failed: ${error.message}`);
    return result;
  }
}

export function getGP51ConfigurationHelp(): string[] {
  return [
    '1. Ensure GP51_API_BASE_URL is configured in Supabase secrets',
    '2. Test GP51 connectivity in Admin Settings',
    '3. Verify GP51 credentials are valid',
    '4. Check that GP51 services are accessible from your network'
  ];
}
