
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  console.log(`📊 [gps51-data] Processing data request...`);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const type = url.searchParams.get('type') || 'dashboard_summary';
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    
    console.log(`🔍 Query type: ${type}, limit: ${limit}, offset: ${offset}`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    switch (type) {
      case 'dashboard_summary':
        return await handleDashboardSummary(supabase);
        
      case 'device_list':
        return await handleDeviceList(supabase, limit, offset, url.searchParams);
        
      case 'group_list':
        return await handleGroupList(supabase, limit, offset);
        
      case 'import_status':
        return await handleImportStatus(supabase);
        
      case 'diagnostic':
        return await handleDiagnostic(supabase);
        
      default:
        return new Response(JSON.stringify({
          success: false,
          error: `Unknown query type: ${type}`
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

  } catch (error) {
    console.error('❌ GPS51 data error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function handleDashboardSummary(supabase: any) {
  try {
    console.log('📈 Generating dashboard summary...');
    
    // Get device statistics
    const { data: devices, error: devicesError } = await supabase
      .from('gps51_devices')
      .select('is_active, is_expired');

    if (devicesError) throw devicesError;

    // Get group count
    const { count: groupCount, error: groupError } = await supabase
      .from('gps51_groups')
      .select('*', { count: 'exact', head: true });

    if (groupError) throw groupError;

    // Get latest import status
    const { data: latestImport, error: importError } = await supabase
      .from('gps51_import_logs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Calculate statistics
    const totalDevices = devices?.length || 0;
    const activeDevices = devices?.filter(d => d.is_active)?.length || 0;
    const expiredDevices = devices?.filter(d => d.is_expired)?.length || 0;

    const summary = {
      total_devices: totalDevices,
      active_devices: activeDevices,
      expired_devices: expiredDevices,
      inactive_devices: totalDevices - activeDevices,
      total_groups: groupCount || 0,
      last_import: latestImport ? {
        status: latestImport.status,
        started_at: latestImport.started_at,
        completed_at: latestImport.completed_at,
        total_imported: latestImport.total_imported || 0,
        total_errors: latestImport.total_errors || 0
      } : null
    };

    return new Response(JSON.stringify({
      success: true,
      data: summary
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Dashboard summary error:', error);
    throw error;
  }
}

async function handleDeviceList(supabase: any, limit: number, offset: number, params: URLSearchParams) {
  try {
    console.log(`🚗 Fetching device list (limit: ${limit}, offset: ${offset})...`);
    
    let query = supabase
      .from('gps51_devices')
      .select(`
        *,
        gps51_groups(group_name)
      `)
      .order('device_name')
      .range(offset, offset + limit - 1);

    // Apply filters
    const groupId = params.get('group_id');
    const isActive = params.get('is_active');
    
    if (groupId) {
      query = query.eq('group_id', groupId);
    }
    
    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    }

    const { data: devices, error } = await query;

    if (error) throw error;

    return new Response(JSON.stringify({
      success: true,
      data: devices || [],
      pagination: {
        limit,
        offset,
        total: devices?.length || 0
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Device list error:', error);
    throw error;
  }
}

async function handleGroupList(supabase: any, limit: number, offset: number) {
  try {
    console.log(`📦 Fetching group list (limit: ${limit}, offset: ${offset})...`);
    
    const { data: groups, error } = await supabase
      .from('gps51_groups')
      .select('*')
      .order('group_name')
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return new Response(JSON.stringify({
      success: true,
      data: groups || [],
      pagination: {
        limit,
        offset,
        total: groups?.length || 0
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Group list error:', error);
    throw error;
  }
}

async function handleImportStatus(supabase: any) {
  try {
    console.log('📊 Fetching import status...');
    
    const { data: imports, error } = await supabase
      .from('gps51_import_logs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    return new Response(JSON.stringify({
      success: true,
      data: imports || []
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Import status error:', error);
    throw error;
  }
}

async function handleDiagnostic(supabase: any) {
  try {
    console.log('🔍 Running diagnostic checks...');
    
    // Check table existence and row counts
    const tableChecks = [];
    const tables = ['gps51_groups', 'gps51_devices', 'gps51_positions', 'gps51_users'];
    
    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        tableChecks.push({
          table,
          exists: !error,
          count: count || 0,
          error: error?.message
        });
      } catch (e) {
        tableChecks.push({
          table,
          exists: false,
          count: 0,
          error: e.message
        });
      }
    }

    // Get recent import logs
    const { data: recentImports, error: importError } = await supabase
      .from('gps51_import_logs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(5);

    const diagnostic = {
      timestamp: new Date().toISOString(),
      tables: tableChecks,
      recentImports: recentImports || [],
      importError: importError?.message,
      summary: {
        totalTables: tables.length,
        existingTables: tableChecks.filter(t => t.exists).length,
        totalRecords: tableChecks.reduce((sum, t) => sum + (t.count || 0), 0)
      }
    };

    return new Response(JSON.stringify({
      success: true,
      data: diagnostic
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Diagnostic error:', error);
    throw error;
  }
}
