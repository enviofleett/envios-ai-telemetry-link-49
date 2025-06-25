
import { supabase } from '@/integrations/supabase/client';

export class GPS51DataService {
  private static instance: GPS51DataService;

  static getInstance(): GPS51DataService {
    if (!GPS51DataService.instance) {
      GPS51DataService.instance = new GPS51DataService();
    }
    return GPS51DataService.instance;
  }

  private constructor() {}

  async callSupabaseFunction(functionName: string, params: Record<string, any> = {}) {
    console.log(`📡 Calling ${functionName} with params:`, params);
    
    try {
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: params
      });

      if (error) {
        console.error(`❌ Function ${functionName} error:`, error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error(`❌ Failed to call ${functionName}:`, error);
      throw error;
    }
  }

  async callDataAPI(type: string, params: Record<string, any> = {}) {
    const supabaseUrl = 'https://bjkqxmvjuewshomihjqm.supabase.co';
    const url = new URL(`${supabaseUrl}/functions/v1/gps51-data`);
    url.searchParams.set('type', type);
    
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.set(key, params[key].toString());
      }
    });

    const { data: session } = await supabase.auth.getSession();
    const token = session?.session?.access_token;

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ API Error:', errorData);
      throw new Error(`HTTP ${response.status}: ${errorData}`);
    }

    return response.json();
  }

  // API Methods using Edge Functions
  async getDashboardSummary() {
    return this.callDataAPI('dashboard_summary');
  }

  async getDeviceList(filters: Record<string, any> = {}) {
    return this.callDataAPI('device_list', filters);
  }

  async getGroupList(filters: Record<string, any> = {}) {
    return this.callDataAPI('group_list', filters);
  }

  async getImportStatus() {
    return this.callDataAPI('import_status');
  }

  async runDiagnostic() {
    return this.callDataAPI('diagnostic');
  }

  // Direct Supabase client methods (fallback)
  async getDataDirectly() {
    try {
      console.log('🔗 Using direct database access...');
      
      // Get groups
      const { data: groups, error: groupsError } = await supabase
        .from('gps51_groups')
        .select('*')
        .order('group_name');

      if (groupsError) throw groupsError;

      // Get devices with group info - fix column names to match database
      const { data: devices, error: devicesError } = await supabase
        .from('gps51_devices')
        .select(`
          *,
          gps51_groups!inner(group_name)
        `)
        .order('device_name')
        .limit(100);

      if (devicesError) throw devicesError;

      // Get users
      const { data: users, error: usersError } = await supabase
        .from('gps51_users')
        .select('*')
        .order('username')
        .limit(100);

      if (usersError) throw usersError;

      // Get summary stats - handle the database schema properly
      const { data: deviceStats, error: statsError } = await supabase
        .from('gps51_devices')
        .select('is_active, is_expired');

      if (statsError) throw statsError;

      // Transform the data to match TypeScript interfaces
      const transformedGroups = (groups || []).map(group => ({
        ...group,
        last_sync: group.last_sync || group.last_sync_at || new Date().toISOString()
      }));

      const transformedDevices = (devices || []).map(device => ({
        ...device,
        last_sync: device.last_sync || device.last_sync_at || new Date().toISOString(),
        is_expired: device.is_expired || false
      }));

      const transformedUsers = (users || []).map(user => ({
        ...user,
        last_sync: user.last_sync || user.last_sync_at || new Date().toISOString()
      }));

      const summary = {
        total_devices: deviceStats?.length || 0,
        active_devices: deviceStats?.filter(d => d.is_active)?.length || 0,
        expired_devices: deviceStats?.filter(d => d.is_expired)?.length || 0,
        total_groups: groups?.length || 0,
        total_users: users?.length || 0
      };

      return {
        success: true,
        data: {
          groups: transformedGroups,
          devices: transformedDevices,
          users: transformedUsers,
          summary
        }
      };

    } catch (error) {
      console.error('❌ Direct data fetch error:', error);
      throw error;
    }
  }

  // Import functions
  async startImport(importType: string = 'full', options: Record<string, any> = {}) {
    return this.callSupabaseFunction('gps51-import', { importType, options });
  }

  // Test connections
  async testConnections() {
    console.log('🧪 Testing all connection methods...');
    
    const tests = [
      {
        name: 'Direct Table Access',
        test: async () => {
          const { data, error } = await supabase
            .from('gps51_devices')
            .select('device_id')
            .limit(1);
          return { 
            success: !error, 
            data: data?.length || 0, 
            error: error?.message 
          };
        }
      },
      {
        name: 'Edge Function - gps51-data',
        test: async () => {
          try {
            const result = await this.callDataAPI('dashboard_summary');
            return { 
              success: result.success, 
              data: result.data ? 1 : 0, 
              error: result.error 
            };
          } catch (error) {
            return { 
              success: false, 
              data: 0, 
              error: error instanceof Error ? error.message : 'Unknown error'
            };
          }
        }
      },
      {
        name: 'Import Function',
        test: async () => {
          try {
            const result = await this.callSupabaseFunction('gps51-import', { 
              importType: 'test', 
              options: { dryRun: true } 
            });
            return { 
              success: result.success, 
              data: result.results ? 1 : 0, 
              error: result.error 
            };
          } catch (error) {
            return { 
              success: false, 
              data: 0, 
              error: error instanceof Error ? error.message : 'Unknown error'
            };
          }
        }
      }
    ];

    const results = [];
    for (const test of tests) {
      try {
        console.log(`Testing: ${test.name}`);
        const result = await test.test();
        console.log(`${test.name}:`, result);
        results.push({ name: test.name, ...result });
      } catch (error) {
        console.error(`${test.name} failed:`, error);
        results.push({
          name: test.name,
          success: false,
          data: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }
}

export const gps51DataService = GPS51DataService.getInstance();
