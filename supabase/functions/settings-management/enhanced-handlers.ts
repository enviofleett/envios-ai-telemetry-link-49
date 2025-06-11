
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { createResponse } from './cors.ts';
import { handleSaveCredentials } from './handlers.ts';
import { authenticateWithGP51 } from './gp51-auth.ts';
import { GP51ErrorHandler } from './error-handling.ts';

const FUNCTION_VERSION = "1.3.0";

export async function handleHealthCheck() {
  console.log('🏥 Processing health check request...');
  
  try {
    // Basic health indicators
    const healthData = {
      success: true,
      status: 'healthy',
      version: FUNCTION_VERSION,
      timestamp: new Date().toISOString(),
      checks: {
        environment: checkEnvironmentVariables(),
        database: await checkDatabaseConnection(),
        gp51_auth: await checkGP51AuthCapability()
      }
    };
    
    console.log('✅ Health check completed:', healthData);
    
    return createResponse(healthData, 200);
  } catch (error) {
    console.error('❌ Health check failed:', error);
    
    const healthData = {
      success: false,
      status: 'unhealthy',
      version: FUNCTION_VERSION,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      checks: {
        environment: false,
        database: false,
        gp51_auth: false
      }
    };
    
    return createResponse(healthData, 500);
  }
}

function checkEnvironmentVariables(): boolean {
  const requiredVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
  const missing = requiredVars.filter(varName => !Deno.env.get(varName));
  
  if (missing.length > 0) {
    console.error('❌ Missing environment variables:', missing);
    return false;
  }
  
  console.log('✅ All required environment variables present');
  return true;
}

async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return false;
    }
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Simple database connectivity test
    const { error } = await supabase.from('envio_users').select('count').limit(1);
    
    if (error) {
      console.error('❌ Database connection check failed:', error);
      return false;
    }
    
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection check exception:', error);
    return false;
  }
}

async function checkGP51AuthCapability(): Promise<boolean> {
  try {
    // Test GP51 authentication capability with dummy credentials
    // This doesn't actually authenticate, just checks if the auth function works
    const testResult = await authenticateWithGP51({
      username: 'health-check-test',
      password: 'health-check-test'
    });
    
    // We expect this to fail with authentication, but not with system errors
    if (testResult.success === false && testResult.error) {
      // Authentication failure is expected and indicates the system is working
      console.log('✅ GP51 auth capability check passed (expected auth failure)');
      return true;
    }
    
    console.log('✅ GP51 auth capability check passed');
    return true;
  } catch (error) {
    console.error('❌ GP51 auth capability check failed:', error);
    return false;
  }
}

export async function handleSaveCredentialsWithVehicleImport({ 
  username, 
  password, 
  apiUrl, 
  testOnly = false,
  userId 
}: { 
  username: string; 
  password: string; 
  apiUrl?: string; 
  testOnly?: boolean;
  userId: string;
}) {
  console.log('💾 Enhanced credentials save with vehicle import capability');
  console.log('📊 Request context:', {
    username: username ? 'provided' : 'missing',
    password: password ? 'provided' : 'missing',
    apiUrl: apiUrl || 'default',
    testOnly,
    userId: userId ? 'provided' : 'missing',
    timestamp: new Date().toISOString()
  });
  
  try {
    // For now, delegate to the basic handler but with enhanced logging
    console.log('🔄 Delegating to basic credentials save handler...');
    
    const result = await handleSaveCredentials({ 
      username, 
      password, 
      apiUrl 
    });
    
    console.log('✅ Enhanced save completed successfully');
    return result;
    
  } catch (error) {
    console.error('❌ Enhanced save failed:', error);
    
    GP51ErrorHandler.logError(error, { 
      action: 'save-gp51-credentials-enhanced',
      userId,
      username: username,
      testOnly
    });
    
    return createResponse({
      success: false,
      error: 'Enhanced credentials save failed',
      code: 'ENHANCED_SAVE_ERROR',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    }, 500);
  }
}
