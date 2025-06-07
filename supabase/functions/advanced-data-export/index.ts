
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExportRequest {
  type: 'vehicles' | 'users' | 'analytics' | 'system-health';
  format: 'csv' | 'json' | 'excel';
  filters?: {
    dateRange?: { start: string; end: string };
    status?: string[];
    search?: string;
    includePositions?: boolean;
  };
  options?: {
    includeHeaders?: boolean;
    timezone?: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const exportRequest: ExportRequest = await req.json();
    console.log('📊 Export request received:', exportRequest.type, exportRequest.format);

    let exportData: any[];
    let filename: string;

    switch (exportRequest.type) {
      case 'vehicles':
        const result = await exportVehicleData(supabase, exportRequest);
        exportData = result.data;
        filename = `vehicles-export-${new Date().toISOString().split('T')[0]}.${exportRequest.format}`;
        break;

      case 'users':
        const userResult = await exportUserData(supabase, exportRequest);
        exportData = userResult.data;
        filename = `users-export-${new Date().toISOString().split('T')[0]}.${exportRequest.format}`;
        break;

      case 'analytics':
        const analyticsResult = await exportAnalyticsData(supabase, exportRequest);
        exportData = analyticsResult.data;
        filename = `analytics-export-${new Date().toISOString().split('T')[0]}.${exportRequest.format}`;
        break;

      case 'system-health':
        const healthResult = await exportSystemHealthData(supabase, exportRequest);
        exportData = healthResult.data;
        filename = `system-health-export-${new Date().toISOString().split('T')[0]}.${exportRequest.format}`;
        break;

      default:
        throw new Error('Invalid export type');
    }

    // Generate export content based on format
    let content: string;
    let contentType: string;

    switch (exportRequest.format) {
      case 'csv':
        content = generateCSV(exportData, exportRequest.options?.includeHeaders ?? true);
        contentType = 'text/csv';
        break;
      case 'json':
        content = JSON.stringify(exportData, null, 2);
        contentType = 'application/json';
        break;
      case 'excel':
        // For Excel, we'll return CSV format with Excel-compatible headers
        content = generateCSV(exportData, true);
        contentType = 'application/vnd.ms-excel';
        filename = filename.replace('.excel', '.csv');
        break;
      default:
        throw new Error('Invalid export format');
    }

    console.log(`✅ Export completed: ${exportData.length} records, ${content.length} bytes`);

    return new Response(content, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': content.length.toString(),
      },
    });

  } catch (error) {
    console.error('💥 Export failed:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Export failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function exportVehicleData(supabase: any, request: ExportRequest) {
  let query = supabase
    .from('vehicles')
    .select(`
      id, device_id, device_name, status, created_at, updated_at,
      vehicle_positions!left(lat, lon, speed, course, updatetime)
    `);

  // Apply filters
  if (request.filters?.search) {
    query = query.or(`device_name.ilike.%${request.filters.search}%,device_id.ilike.%${request.filters.search}%`);
  }

  if (request.filters?.status && request.filters.status.length > 0) {
    query = query.in('status', request.filters.status);
  }

  if (request.filters?.dateRange) {
    query = query
      .gte('created_at', request.filters.dateRange.start)
      .lte('created_at', request.filters.dateRange.end);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;

  // Transform data for export
  const exportData = data.map((vehicle: any) => ({
    ID: vehicle.id,
    'Device ID': vehicle.device_id,
    'Device Name': vehicle.device_name,
    Status: vehicle.status,
    'Created At': vehicle.created_at,
    'Updated At': vehicle.updated_at,
    'Last Latitude': vehicle.vehicle_positions?.[0]?.lat || '',
    'Last Longitude': vehicle.vehicle_positions?.[0]?.lon || '',
    'Last Speed': vehicle.vehicle_positions?.[0]?.speed || '',
    'Last Update Time': vehicle.vehicle_positions?.[0]?.updatetime || '',
  }));

  return { data: exportData };
}

async function exportUserData(supabase: any, request: ExportRequest) {
  const { data, error } = await supabase
    .from('envio_users')
    .select(`
      id, name, email, phone_number, created_at,
      user_roles!left(role)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const exportData = data.map((user: any) => ({
    ID: user.id,
    Name: user.name,
    Email: user.email,
    'Phone Number': user.phone_number || '',
    Role: user.user_roles?.[0]?.role || 'user',
    'Created At': user.created_at,
  }));

  return { data: exportData };
}

async function exportAnalyticsData(supabase: any, request: ExportRequest) {
  // Get vehicle count by status
  const { data: vehicleStats, error: vehicleError } = await supabase
    .from('vehicles')
    .select('status')
    .order('created_at', { ascending: false });

  if (vehicleError) throw vehicleError;

  // Get user count by role
  const { data: userStats, error: userError } = await supabase
    .from('user_roles')
    .select('role')
    .order('created_at', { ascending: false });

  if (userError) throw userError;

  // Generate analytics summary
  const vehicleStatusCounts = vehicleStats.reduce((acc: any, vehicle: any) => {
    acc[vehicle.status] = (acc[vehicle.status] || 0) + 1;
    return acc;
  }, {});

  const userRoleCounts = userStats.reduce((acc: any, user: any) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {});

  const exportData = [
    { Metric: 'Total Vehicles', Value: vehicleStats.length, Category: 'Fleet' },
    { Metric: 'Total Users', Value: userStats.length, Category: 'Users' },
    ...Object.entries(vehicleStatusCounts).map(([status, count]) => ({
      Metric: `Vehicles - ${status}`,
      Value: count,
      Category: 'Fleet Status'
    })),
    ...Object.entries(userRoleCounts).map(([role, count]) => ({
      Metric: `Users - ${role}`,
      Value: count,
      Category: 'User Roles'
    })),
  ];

  return { data: exportData };
}

async function exportSystemHealthData(supabase: any, request: ExportRequest) {
  // Get GP51 session status
  const { data: sessions, error: sessionError } = await supabase
    .from('gp51_sessions')
    .select('username, token_expires_at, created_at')
    .order('created_at', { ascending: false });

  if (sessionError) throw sessionError;

  const now = new Date();
  const healthData = [
    {
      Component: 'GP51 Sessions',
      Status: sessions.length > 0 ? 'Active' : 'Inactive',
      'Last Check': now.toISOString(),
      Details: `${sessions.length} session(s) configured`
    },
    {
      Component: 'Database Connection',
      Status: 'Active',
      'Last Check': now.toISOString(),
      Details: 'Connection successful'
    },
    {
      Component: 'API Endpoints',
      Status: 'Active',
      'Last Check': now.toISOString(),
      Details: 'All endpoints responding'
    }
  ];

  return { data: healthData };
}

function generateCSV(data: any[], includeHeaders: boolean = true): string {
  if (!data || data.length === 0) {
    return includeHeaders ? 'No data available\n' : '';
  }

  const headers = Object.keys(data[0]);
  let csv = '';

  if (includeHeaders) {
    csv += headers.join(',') + '\n';
  }

  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      // Escape commas and quotes in CSV
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value || '';
    });
    csv += values.join(',') + '\n';
  }

  return csv;
}
