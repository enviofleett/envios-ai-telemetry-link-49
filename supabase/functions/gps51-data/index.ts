
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

interface DataRequest {
  action: 'analytics' | 'devices' | 'groups' | 'positions' | 'users' | 'export';
  filters?: {
    dateRange?: {
      start: string;
      end: string;
    };
    deviceIds?: string[];
    groupIds?: number[];
    activeOnly?: boolean;
    limit?: number;
    offset?: number;
  };
  exportFormat?: 'json' | 'csv';
}

serve(async (req) => {
  console.log(`📊 [gps51-data] Starting request processing...`);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody: DataRequest = await req.json();
    const { action, filters = {}, exportFormat = 'json' } = requestBody;
    
    console.log(`🔄 [gps51-data] Processing action: ${action}`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let result;
    switch (action) {
      case 'analytics':
        result = await getAnalytics(supabase, filters);
        break;
      case 'devices':
        result = await getDevices(supabase, filters);
        break;
      case 'groups':
        result = await getGroups(supabase, filters);
        break;
      case 'positions':
        result = await getPositions(supabase, filters);
        break;
      case 'users':
        result = await getUsers(supabase, filters);
        break;
      case 'export':
        result = await exportData(supabase, filters, exportFormat);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify({
      success: true,
      data: result,
      message: `${action} data retrieved successfully`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ [gps51-data] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function getAnalytics(supabase: any, filters: any) {
  console.log(`📈 [gps51-data] Fetching analytics...`);

  // Get current counts
  const [devicesCount, groupsCount, usersCount] = await Promise.all([
    supabase.from('gps51_devices').select('*', { count: 'exact', head: true }),
    supabase.from('gps51_groups').select('*', { count: 'exact', head: true }),
    supabase.from('gps51_users').select('*', { count: 'exact', head: true })
  ]);

  // Get active devices count
  const { count: activeDevicesCount } = await supabase
    .from('gps51_devices')
    .select('*', { count: 'exact', head: true })
    .eq('is_free', 0);

  // Get recent positions count
  const dateFilter = filters.dateRange?.start || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count: recentPositionsCount } = await supabase
    .from('gps51_positions')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', dateFilter);

  // Get historical analytics
  const { data: historicalAnalytics } = await supabase
    .from('gps51_analytics')
    .select('*')
    .eq('metric_type', 'daily_summary')
    .order('metric_date', { ascending: false })
    .limit(30);

  // Get import logs summary
  const { data: importLogs } = await supabase
    .from('gps51_import_logs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(10);

  return {
    summary: {
      totalDevices: devicesCount.count || 0,
      activeDevices: activeDevicesCount || 0,
      totalGroups: groupsCount.count || 0,
      totalUsers: usersCount.count || 0,
      recentPositions: recentPositionsCount || 0
    },
    historical: historicalAnalytics || [],
    recentImports: importLogs || []
  };
}

async function getDevices(supabase: any, filters: any) {
  console.log(`📱 [gps51-data] Fetching devices...`);

  let query = supabase
    .from('gps51_devices')
    .select(`
      *,
      gps51_groups (
        group_name,
        remark
      )
    `);

  if (filters.activeOnly) {
    query = query.eq('is_free', 0);
  }

  if (filters.groupIds && filters.groupIds.length > 0) {
    query = query.in('group_id', filters.groupIds);
  }

  if (filters.deviceIds && filters.deviceIds.length > 0) {
    query = query.in('device_id', filters.deviceIds);
  }

  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  if (filters.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
  }

  const { data, error } = await query.order('device_name');

  if (error) {
    throw new Error(`Failed to fetch devices: ${error.message}`);
  }

  return data;
}

async function getGroups(supabase: any, filters: any) {
  console.log(`📁 [gps51-data] Fetching groups...`);

  let query = supabase
    .from('gps51_groups')
    .select(`
      *,
      devices:gps51_devices(count)
    `);

  if (filters.groupIds && filters.groupIds.length > 0) {
    query = query.in('group_id', filters.groupIds);
  }

  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query.order('group_name');

  if (error) {
    throw new Error(`Failed to fetch groups: ${error.message}`);
  }

  return data;
}

async function getPositions(supabase: any, filters: any) {
  console.log(`📍 [gps51-data] Fetching positions...`);

  let query = supabase
    .from('gps51_positions')
    .select(`
      *,
      gps51_devices (
        device_name,
        device_type,
        group_id
      )
    `);

  if (filters.deviceIds && filters.deviceIds.length > 0) {
    query = query.in('device_id', filters.deviceIds);
  }

  if (filters.dateRange) {
    if (filters.dateRange.start) {
      query = query.gte('created_at', filters.dateRange.start);
    }
    if (filters.dateRange.end) {
      query = query.lte('created_at', filters.dateRange.end);
    }
  }

  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  if (filters.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 100) - 1);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch positions: ${error.message}`);
  }

  return data;
}

async function getUsers(supabase: any, filters: any) {
  console.log(`👥 [gps51-data] Fetching users...`);

  let query = supabase
    .from('gps51_users')
    .select(`
      *,
      envio_users (
        name,
        email
      )
    `);

  if (filters.activeOnly) {
    query = query.eq('is_active', true);
  }

  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query.order('gp51_username');

  if (error) {
    throw new Error(`Failed to fetch users: ${error.message}`);
  }

  return data;
}

async function exportData(supabase: any, filters: any, format: string) {
  console.log(`📤 [gps51-data] Exporting data in ${format} format...`);

  const [devices, groups, positions, users] = await Promise.all([
    getDevices(supabase, { ...filters, limit: null }),
    getGroups(supabase, { ...filters, limit: null }),
    getPositions(supabase, { ...filters, limit: filters.limit || 1000 }),
    getUsers(supabase, { ...filters, limit: null })
  ]);

  const exportData = {
    devices,
    groups,
    positions,
    users,
    exportTimestamp: new Date().toISOString(),
    summary: {
      totalDevices: devices.length,
      totalGroups: groups.length,
      totalPositions: positions.length,
      totalUsers: users.length
    }
  };

  if (format === 'csv') {
    // Convert to CSV format
    const csvData = {
      devices: convertToCSV(devices),
      groups: convertToCSV(groups),
      positions: convertToCSV(positions),
      users: convertToCSV(users)
    };
    return csvData;
  }

  return exportData;
}

function convertToCSV(data: any[]): string {
  if (!data || data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        if (value === null || value === undefined) return '';
        if (typeof value === 'object') return JSON.stringify(value);
        return `"${String(value).replace(/"/g, '""')}"`;
      }).join(',')
    )
  ];
  
  return csvRows.join('\n');
}
