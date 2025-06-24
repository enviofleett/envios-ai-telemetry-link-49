
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { gp51ApiClient } from '../_shared/gp51_api_client_unified.ts';
import { sanitizeInput, checkRateLimit } from '../_shared/crypto_utils.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ImportJob {
  id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  created_at: string;
  progress?: number;
  error?: string;
}

async function getGP51Session() {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const { data: sessions, error } = await supabase
    .from('gp51_sessions')
    .select('*')
    .gt('token_expires_at', new Date().toISOString())
    .order('last_validated_at', { ascending: false })
    .limit(1);

  if (error || !sessions || sessions.length === 0) {
    throw new Error('No valid GP51 session found');
  }

  return sessions[0];
}

async function fetchAvailableData() {
  console.log('🔍 Fetching GP51 import preview...');
  
  const session = await getGP51Session();
  
  // Create import job record
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const importJob: ImportJob = {
    id: crypto.randomUUID(),
    status: 'pending',
    created_at: new Date().toISOString()
  };

  console.log(`📝 Created import job: ${importJob.id}`);

  try {
    // Use the correct GP51 API action: 'querymonitorlist' instead of 'getmonitorlist'
    console.log('📡 Fetching data from GP51 using querymonitorlist action...');
    
    gp51ApiClient.setToken(session.gp51_token);
    const result = await gp51ApiClient.queryMonitorList(session.gp51_token, session.username);
    
    if (!result || result.status !== 0) {
      throw new Error(`GP51 API error: ${result?.cause || 'Unknown error'}`);
    }

    // Process the response data
    const devices = [];
    if (result.groups && Array.isArray(result.groups)) {
      for (const group of result.groups) {
        if (group.devices && Array.isArray(group.devices)) {
          devices.push(...group.devices);
        }
      }
    }

    console.log(`✅ Successfully fetched ${devices.length} devices from GP51`);

    return {
      success: true,
      data: {
        summary: {
          users: 0, // GP51 monitor list doesn't include users
          vehicles: devices.length
        },
        devices: devices.slice(0, 10), // Preview first 10 devices
        totalDevices: devices.length
      },
      connectionStatus: {
        connected: true,
        username: session.username
      }
    };

  } catch (error) {
    console.error('❌ Data fetch error:', error);
    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  
  // Rate limiting
  if (!checkRateLimit(clientIP, 10, 60 * 1000)) { // 10 requests per minute
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Too many requests. Please try again later.' 
    }), {
      status: 429,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    console.log('🚀 Enhanced Bulk Import: POST', req.url);
    
    const body = await req.json();
    const { action } = body;
    
    console.log(`📋 Processing action: ${action}`);

    switch (action) {
      case 'fetch_available_data':
        const data = await fetchAvailableData();
        return new Response(JSON.stringify(data), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      default:
        return new Response(JSON.stringify({
          success: false,
          error: `Unknown action: ${action}`
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

  } catch (error) {
    console.error('❌ Enhanced bulk import error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Import operation failed'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
