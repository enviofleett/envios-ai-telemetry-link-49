
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { getGP51ApiUrl } from '../_shared/constants.ts';
import { md5_for_gp51_only, sanitizeInput } from '../_shared/crypto_utils.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GP51AuthResponse {
  status: number;
  token?: string;
  cause?: string;
}

/**
 * Builds a GP51 API URL with proper query parameters
 */
function buildGP51ActionUrl(baseUrl: string, action: string, additionalParams: Record<string, string> = {}): string {
  const url = new URL(getGP51ApiUrl(baseUrl));
  url.searchParams.set('action', action);
  
  Object.entries(additionalParams).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  
  return url.toString();
}

/**
 * Authenticate with GP51 using proper URL structure
 */
async function authenticateWithGP51(username: string, password: string): Promise<{ success: boolean; token?: string; error?: string }> {
  try {
    console.log('🔐 Authenticating with GP51...');
    
    const gp51BaseUrl = Deno.env.get('GP51_BASE_URL') || 'https://www.gps51.com';
    const hashedPassword = await md5_for_gp51_only(password);
    
    // Build the correct URL with action as query parameter
    const loginUrl = buildGP51ActionUrl(gp51BaseUrl, 'login');
    
    console.log(`📡 Making login request to: ${loginUrl}`);
    
    const requestBody = {
      username: sanitizeInput(username),
      password: hashedPassword,
      from: 'WEB',
      type: 'USER'
    };
    
    const response = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'EnhancedBulkImport/1.0'
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(15000)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ GP51 auth failed: ${response.status} ${errorText}`);
      throw new Error(`GP51 authentication failed: ${response.status} - ${errorText}`);
    }
    
    const responseText = await response.text();
    console.log(`📊 GP51 auth response length: ${responseText.length}`);
    
    if (!responseText || responseText.trim().length === 0) {
      throw new Error('Empty response from GP51 authentication');
    }
    
    let authResult: GP51AuthResponse;
    try {
      authResult = JSON.parse(responseText);
    } catch (parseError) {
      // Handle plain text token response
      const token = responseText.trim();
      if (token && !token.includes('error') && !token.includes('fail')) {
        console.log('✅ GP51 authentication successful (plain text token)');
        return { success: true, token };
      } else {
        throw new Error(`Invalid authentication response: ${token}`);
      }
    }
    
    if (authResult.status === 0 && authResult.token) {
      console.log('✅ GP51 authentication successful (JSON response)');
      return { success: true, token: authResult.token };
    } else {
      const errorMsg = authResult.cause || `Authentication failed with status ${authResult.status}`;
      console.error(`❌ GP51 auth failed: ${errorMsg}`);
      return { success: false, error: errorMsg };
    }
    
  } catch (error) {
    console.error('❌ GP51 authentication exception:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Authentication failed'
    };
  }
}

/**
 * Fetch available data from GP51 for preview
 */
async function fetchAvailableData(token: string): Promise<any> {
  try {
    const gp51BaseUrl = Deno.env.get('GP51_BASE_URL') || 'https://www.gps51.com';
    
    // Build URL with proper query parameters
    const dataUrl = buildGP51ActionUrl(gp51BaseUrl, 'getmonitorlist', { token });
    
    console.log(`📡 Fetching data from: ${dataUrl}`);
    
    const response = await fetch(dataUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'EnhancedBulkImport/1.0'
      },
      signal: AbortSignal.timeout(30000)
    });
    
    if (!response.ok) {
      throw new Error(`Data fetch failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.status !== 0) {
      throw new Error(`GP51 API error: ${data.cause || 'Unknown error'}`);
    }
    
    return data;
    
  } catch (error) {
    console.error('❌ Data fetch error:', error);
    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🚀 Enhanced Bulk Import:', req.method, req.url);

    const { action } = await req.json();

    if (action === 'fetch_available_data') {
      console.log('📋 Processing action: fetch_available_data');
      
      // Create import job
      console.log('🔍 Fetching GP51 import preview...');
      const { data: jobData, error: jobError } = await supabase
        .from('gp51_system_imports')
        .insert({
          import_type: 'gp51_preview',
          status: 'running',
          current_phase: 'Fetching Data'
        })
        .select()
        .single();

      if (jobError) {
        console.error('❌ Failed to create import job:', jobError);
        throw new Error('Failed to create import job');
      }

      console.log('📝 Created import job:', jobData.id);

      // Get admin credentials
      const username = Deno.env.get('GP51_ADMIN_USERNAME');
      const password = Deno.env.get('GP51_ADMIN_PASSWORD');
      
      if (!username || !password) {
        throw new Error('GP51 admin credentials not configured');
      }

      // Authenticate with GP51
      const authResult = await authenticateWithGP51(username, password);
      
      if (!authResult.success) {
        await supabase
          .from('gp51_system_imports')
          .update({
            status: 'failed',
            error_log: [{ error: authResult.error, timestamp: new Date().toISOString() }]
          })
          .eq('id', jobData.id);
          
        throw new Error(authResult.error || 'GP51 authentication failed');
      }

      // Fetch available data
      const availableData = await fetchAvailableData(authResult.token!);
      
      // Process the data structure
      let totalUsers = 0;
      let totalDevices = 0;
      
      if (availableData.groups && Array.isArray(availableData.groups)) {
        for (const group of availableData.groups) {
          if (group.devices && Array.isArray(group.devices)) {
            totalDevices += group.devices.length;
          }
        }
      }

      // Update job with results
      await supabase
        .from('gp51_system_imports')
        .update({
          status: 'completed',
          total_users: totalUsers,
          total_devices: totalDevices,
          import_results: {
            preview: true,
            groups: availableData.groups?.length || 0,
            devices: totalDevices,
            users: totalUsers
          },
          completed_at: new Date().toISOString()
        })
        .eq('id', jobData.id);

      return new Response(JSON.stringify({
        success: true,
        job_id: jobData.id,
        preview: {
          users: totalUsers,
          devices: totalDevices,
          groups: availableData.groups?.length || 0
        },
        data: availableData
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: false,
      error: 'Unknown action'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Enhanced bulk import error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
