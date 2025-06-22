
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { authStrategies } from './gp51-auth-strategies.ts';
import { md5_for_gp51_only } from '../_shared/crypto_utils.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  console.log(`🚀 [enhanced-bulk-import] ${req.method} ${req.url}`);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    const { action, username, password } = await req.json();
    console.log(`🔧 [enhanced-bulk-import] Action: ${action}`);

    switch (action) {
      case 'test_connection':
        return await handleConnectionTest(username, password);
      
      case 'start_import':
        return await handleStartImport();
      
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('❌ [enhanced-bulk-import] Error:', error);
    
    // Enhanced error handling - always return 200 with error details for better client handling
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        errorType: 'internal_error',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200,  // Changed from 500 to 200 for better client error handling
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function handleConnectionTest(username: string, password: string) {
  console.log(`🧪 [enhanced-bulk-import] Testing GP51 connection for: ${username}`);
  
  if (!username || !password) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Username and password are required',
        errorType: 'validation_error'
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  const baseUrl = Deno.env.get('GP51_API_BASE_URL') || 'https://www.gps51.com';
  const globalToken = Deno.env.get('GP51_GLOBAL_API_TOKEN');
  
  console.log(`🌐 [enhanced-bulk-import] Using base URL: ${baseUrl}`);
  console.log(`🔑 [enhanced-bulk-import] Global token: ${globalToken ? 'Available' : 'Not set'}`);

  try {
    // Generate MD5 hash for password
    const hashedPassword = await md5_for_gp51_only(password);
    console.log(`🔐 [enhanced-bulk-import] Password hashed successfully`);

    let lastError = null;
    let lastDetails = null;

    // Try each authentication strategy in order of preference
    for (const strategy of authStrategies) {
      console.log(`🔄 [enhanced-bulk-import] Trying strategy: ${strategy.name}`);
      
      try {
        const result = await strategy.execute(username, hashedPassword, baseUrl, globalToken);
        
        if (result.success) {
          console.log(`✅ [enhanced-bulk-import] Authentication successful with ${strategy.name}`);
          return new Response(
            JSON.stringify({
              success: true,
              authMethod: strategy.name,
              tokenValid: true,
              message: `Successfully authenticated with GP51 using ${strategy.name}`,
              diagnostics: {
                strategy: strategy.name,
                baseUrl,
                hasGlobalToken: !!globalToken,
                details: result.details,
                timestamp: new Date().toISOString()
              }
            }),
            { 
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        } else {
          console.warn(`⚠️ [enhanced-bulk-import] Strategy ${strategy.name} failed: ${result.error}`);
          lastError = result.error;
          lastDetails = result.details;
        }
      } catch (error) {
        console.error(`❌ [enhanced-bulk-import] Strategy ${strategy.name} error:`, error);
        lastError = error instanceof Error ? error.message : 'Unknown error';
        lastDetails = { error: lastError };
      }
    }

    // All strategies failed - return detailed error response
    console.error(`❌ [enhanced-bulk-import] All authentication strategies failed`);
    return new Response(
      JSON.stringify({
        success: false,
        error: lastError || 'All authentication strategies failed',
        errorType: 'authentication_failed',
        message: 'Unable to authenticate with GP51 API using any available method',
        diagnostics: {
          strategiesTried: authStrategies.map(s => s.name),
          baseUrl,
          hasGlobalToken: !!globalToken,
          lastError,
          lastDetails,
          timestamp: new Date().toISOString(),
          suggestions: [
            'Verify GP51 credentials are correct',
            'Check GP51 API status and connectivity',
            'Ensure GP51_GLOBAL_API_TOKEN is valid if required'
          ]
        }
      }),
      { 
        status: 200,  // Return 200 with error details instead of 401
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error(`❌ [enhanced-bulk-import] Critical error during connection test:`, error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Critical system error',
        errorType: 'system_error',
        message: 'A critical error occurred during GP51 connection testing',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

async function handleStartImport() {
  console.log(`🚀 [enhanced-bulk-import] Starting bulk import (placeholder)`);
  
  // Placeholder for actual import logic
  return new Response(
    JSON.stringify({
      success: true,
      message: 'Import functionality will be implemented in Phase 2',
      phase: 'Phase 1 Complete - Authentication Fixed',
      timestamp: new Date().toISOString()
    }),
    { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}
