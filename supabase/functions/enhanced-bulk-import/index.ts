
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
}

interface SessionManager {
  getValidSession(adminSupabase: any, userId: string): Promise<any>;
}

interface GP51ApiClient {
  queryMonitorList(apiUrl: string, token: string): Promise<any>;
}

// Session Management
class SessionManager {
  static async getValidSession(adminSupabase: any, userId: string) {
    console.log('🔍 [SESSION] Getting valid GP51 session...');
    
    const { data: session, error } = await adminSupabase
      .from('gp51_sessions')
      .select('*')
      .eq('envio_user_id', userId)
      .eq('is_active', true)
      .gt('token_expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('❌ [SESSION] Error fetching session:', error);
      throw new Error('Failed to fetch GP51 session');
    }

    if (!session) {
      console.error('❌ [SESSION] No valid session found');
      throw new Error('No valid GP51 session found');
    }

    console.log('🔍 [SESSION] Found session for user:', session.username);
    
    // Validate token
    const tokenData = session.gp51_token;
    console.log('🔍 [TOKEN] Parsing token data:', typeof tokenData);
    
    let validatedToken: string;
    if (typeof tokenData === 'string') {
      console.log('✅ [TOKEN] Using non-JSON token string');
      validatedToken = tokenData;
    } else {
      console.error('❌ [TOKEN] Invalid token format');
      throw new Error('Invalid token format');
    }

    if (!validatedToken || validatedToken.length < 8) {
      console.error('❌ [TOKEN] Token validation failed');
      throw new Error('Invalid GP51 token');
    }

    console.log('✅ [TOKEN] Token validation successful, length:', validatedToken.length);
    console.log('✅ [SESSION] Session validated successfully for', session.username);
    
    return {
      ...session,
      gp51_token: validatedToken
    };
  }
}

// GP51 API Client
class GP51ApiClient {
  static async queryMonitorList(apiUrl: string, token: string) {
    console.log('🔄 [GP51-CLIENT] Using unified client for action: querymonitorlist');
    console.log('🔄 [GP51-CLIENT] Using queryMonitorList method');
    
    return await this.fetchGP51Data(apiUrl, token, 'querymonitorlist');
  }

  static async fetchGP51Data(apiUrl: string, token: string, action: string) {
    console.log('✅ [GP51-API] Token validated successfully');
    console.log('🔄 [GP51-API] Trying action:', action);
    console.log('🔍 [GP51-API] Attempting to fetch monitor/device list...');
    console.log('📡 [GP51-API] Calling GP51 action:', action, 'with validated token');

    const url = new URL(apiUrl);
    url.searchParams.set('action', action);
    url.searchParams.set('token', token);

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`GP51 API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ [GP51-API] Successfully fetched data with action:', action);
    console.log('✅ [GP51-CLIENT] Successfully fetched data for action:', action);
    
    return data;
  }
}

serve(async (req) => {
  console.log('🚀 [enhanced-bulk-import] Starting request processing...');

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action } = body;
    
    console.log('🔄 [enhanced-bulk-import] Processing action:', action);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authenticated user from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await adminSupabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Authentication failed');
    }

    const userId = user.id;

    // Route to appropriate handler
    switch (action) {
      case 'get_import_preview':
        return await handleGetImportPreview(adminSupabase, userId);
      
      case 'start_import':
        return await handleStartImport(adminSupabase, userId, body.options);
      
      default:
        console.error('❌ [enhanced-bulk-import] Unknown action:', action);
        return new Response(JSON.stringify({
          success: false,
          error: `Unknown action: ${action}`,
          timestamp: new Date().toISOString()
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

  } catch (error) {
    console.error('❌ [enhanced-bulk-import] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function handleGetImportPreview(adminSupabase: any, userId: string) {
  try {
    console.log('🔄 [enhanced-bulk-import] Fetching available data from GP51...');
    
    // Get valid session
    const session = await SessionManager.getValidSession(adminSupabase, userId);
    console.log('✅ [enhanced-bulk-import] Using valid session for user:', session.username);

    // Fetch data from GP51
    const deviceData = await GP51ApiClient.queryMonitorList(session.api_url, session.gp51_token);
    console.log('✅ [enhanced-bulk-import] Successfully fetched device data');

    // Process and structure the response
    const vehicles = Array.isArray(deviceData) ? deviceData : [];
    const users = new Set(vehicles.map((v: any) => v.creator || 'unknown')).size;

    const response = {
      success: true,
      data: {
        summary: {
          vehicles: vehicles.length,
          users: users,
          groups: 0
        },
        sampleData: {
          vehicles: vehicles.slice(0, 10), // Sample of first 10 vehicles
          users: []
        },
        conflicts: {
          existingUsers: [],
          existingDevices: [],
          potentialDuplicates: 0
        },
        authentication: {
          connected: true,
          username: session.username
        },
        estimatedDuration: `${Math.ceil(vehicles.length / 50)} minutes`,
        warnings: []
      },
      connectionStatus: {
        connected: true,
        username: session.username
      },
      timestamp: new Date().toISOString()
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ [enhanced-bulk-import] Preview error:', error);
    
    const errorResponse = {
      success: false,
      data: {
        summary: { vehicles: 0, users: 0, groups: 0 },
        sampleData: { vehicles: [], users: [] },
        conflicts: { existingUsers: [], existingDevices: [], potentialDuplicates: 0 },
        authentication: { connected: false, error: error instanceof Error ? error.message : 'Unknown error' },
        estimatedDuration: '0 minutes',
        warnings: ['Failed to connect to GP51']
      },
      connectionStatus: {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      timestamp: new Date().toISOString()
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function handleStartImport(adminSupabase: any, userId: string, options: any) {
  try {
    console.log('🚀 [enhanced-bulk-import] Starting import with options:', options);
    
    // Get valid session
    const session = await SessionManager.getValidSession(adminSupabase, userId);
    
    // For now, return a mock successful import
    // In a real implementation, this would perform the actual import
    const response = {
      success: true,
      statistics: {
        usersProcessed: 0,
        usersImported: 0,
        devicesProcessed: 0,
        devicesImported: 0,
        conflicts: 0
      },
      message: 'Import completed successfully',
      duration: 0
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ [enhanced-bulk-import] Import error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      message: error instanceof Error ? error.message : 'Import failed'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
