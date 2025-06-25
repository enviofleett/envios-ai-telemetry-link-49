
import { supabase } from '@/integrations/supabase/client';
import type { 
  GPS51Group, 
  GPS51Device, 
  GPS51User, 
  GPS51DashboardSummary, 
  GPS51DataResponse,
  GPS51TestResult 
} from '@/types/gp51';

export interface DiagnosticInfo {
  timestamp: string;
  connectivity: {
    success: boolean;
    status?: number;
    error?: string;
  };
  tablesFound: string[];
  errors: string[];
  [key: string]: any;
}

export class GPS51DataService {
  private static instance: GPS51DataService;

  static getInstance(): GPS51DataService {
    if (!GPS51DataService.instance) {
      GPS51DataService.instance = new GPS51DataService();
    }
    return GPS51DataService.instance;
  }

  private constructor() {}

  async getDataDirectly(): Promise<GPS51DataResponse> {
    try {
      console.log('🔄 Fetching GPS51 data directly from database...');

      // Fetch all data in parallel
      const [groupsResult, devicesResult, usersResult] = await Promise.allSettled([
        supabase.from('gps51_groups').select('*').order('group_name'),
        supabase.from('gps51_devices').select(`
          *,
          gps51_groups!inner(group_name)
        `).order('device_name').limit(500),
        supabase.from('gps51_users').select('*').order('gp51_username').limit(100)
      ]);

      let groups: GPS51Group[] = [];
      let devices: GPS51Device[] = [];
      let users: GPS51User[] = [];

      // Process groups
      if (groupsResult.status === 'fulfilled' && groupsResult.value.data) {
        groups = groupsResult.value.data;
        console.log(`✅ Loaded ${groups.length} groups`);
      } else {
        console.error('❌ Failed to load groups:', groupsResult.status === 'rejected' ? groupsResult.reason : groupsResult.value.error);
      }

      // Process devices with safe transformation
      if (devicesResult.status === 'fulfilled' && devicesResult.value.data) {
        devices = devicesResult.value.data.map(device => ({
          ...device,
          // Safely handle optional fields
          status_code: device.status_code ?? null,
          status_text: device.status_text ?? this.getDeviceStatusText(device.status_code),
          days_since_active: device.last_active_time ? 
            Math.floor((Date.now() - device.last_active_time) / (1000 * 60 * 60 * 24)) : null,
          // Ensure starred and allow_edit are properly typed as numbers
          starred: typeof device.starred === 'number' ? device.starred : (device.starred ? 1 : 0),
          allow_edit: typeof device.allow_edit === 'number' ? device.allow_edit : 1
        }));
        console.log(`✅ Loaded ${devices.length} devices`);
      } else {
        console.error('❌ Failed to load devices:', devicesResult.status === 'rejected' ? devicesResult.reason : devicesResult.value.error);
      }

      // Process users
      if (usersResult.status === 'fulfilled' && usersResult.value.data) {
        users = usersResult.value.data;
        console.log(`✅ Loaded ${users.length} users`);
      } else {
        console.error('❌ Failed to load users:', usersResult.status === 'rejected' ? usersResult.reason : usersResult.value.error);
      }

      // Calculate summary
      const summary: GPS51DashboardSummary = {
        total_devices: devices.length,
        active_devices: devices.filter(d => d.is_active === true).length,
        total_groups: groups.length,
        devices_with_positions: 0, // Will be calculated separately if needed
        total_users: users.length
      };

      return {
        success: true,
        data: {
          groups,
          devices,
          users,
          summary
        }
      };

    } catch (error) {
      console.error('❌ GPS51DataService error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async testConnections(): Promise<GPS51TestResult[]> {
    const tests: GPS51TestResult[] = [];
    
    const tablesToTest = ['gps51_groups', 'gps51_devices', 'gps51_users', 'gps51_positions'];
    
    for (const tableName of tablesToTest) {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });
        
        tests.push({
          name: `${tableName} Table`,
          success: !error,
          data: count || 0,
          error: error?.message
        });
      } catch (error) {
        tests.push({
          name: `${tableName} Table`,
          success: false,
          data: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    return tests;
  }

  async runDiagnostic(): Promise<DiagnosticInfo> {
    const diagnostic: DiagnosticInfo = {
      timestamp: new Date().toISOString(),
      connectivity: { success: false },
      tablesFound: [],
      errors: []
    };

    try {
      // Test basic connectivity
      const { data, error } = await supabase.from('gps51_groups').select('*').limit(1);
      diagnostic.connectivity = {
        success: !error,
        error: error?.message
      };

      if (!error) {
        diagnostic.tablesFound.push('gps51_groups');
      }

      // Test other tables
      const tables = ['gps51_devices', 'gps51_users', 'gps51_positions'];
      for (const table of tables) {
        try {
          const { data, error } = await supabase.from(table).select('*').limit(1);
          if (!error) {
            diagnostic.tablesFound.push(table);
          } else {
            diagnostic.errors.push(`${table}: ${error.message}`);
          }
        } catch (e) {
          diagnostic.errors.push(`${table}: ${e instanceof Error ? e.message : 'Unknown error'}`);
        }
      }

    } catch (error) {
      diagnostic.errors.push(`General: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return diagnostic;
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const { data, error } = await supabase.from('gps51_groups').select('count').limit(1);
      
      if (error) {
        return {
          success: false,
          message: `Connection failed: ${error.message}`
        };
      }

      return {
        success: true,
        message: 'Connection successful'
      };
    } catch (error) {
      return {
        success: false,
        message: `Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private getDeviceStatusText(statusCode: number | null | undefined): string {
    if (!statusCode) return 'Unknown';
    
    const statusMap: Record<number, string> = {
      1: 'Normal',
      2: 'Trial', 
      3: 'Disabled',
      4: 'Service Fee Overdue',
      5: 'Time Expired'
    };
    return statusMap[statusCode] || `Status ${statusCode}`;
  }
}

// Export the singleton instance
export const gps51DataService = GPS51DataService.getInstance();

// Default export for class-based usage
export default GPS51DataService;
