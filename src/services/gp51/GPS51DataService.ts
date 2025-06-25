
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
  config: {
    supabaseUrl: string;
    anonKeyLength: number;
    configuredCorrectly: boolean;
  };
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
  private baseUrl: string;
  private anonKey: string;

  static getInstance(): GPS51DataService {
    if (!GPS51DataService.instance) {
      GPS51DataService.instance = new GPS51DataService();
    }
    return GPS51DataService.instance;
  }

  private constructor() {
    this.baseUrl = 'https://bjkqxmvjuewshomihjqm.supabase.co';
    this.anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqa3F4bXZqdWV3c2hvbWloam0iLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc0OTAzOTgzMSwiZXhwIjoyMDY0NjE1ODMxfQ.VbyYBsPAp_a699yZ3xHtGGzljIQPm24EnwXLaGcsJb0';
  }

  private async fetchFromSupabase(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}/rest/v1/${endpoint}`;
    
    const defaultHeaders = {
      'apikey': this.anonKey,
      'Authorization': `Bearer ${this.anonKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options.headers
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Supabase fetch error:', error);
      throw error;
    }
  }

  // Safe device transformation that handles missing fields
  private transformDevice(rawDevice: any): GPS51Device {
    // Safely handle the device data without assuming field existence
    return {
      ...rawDevice,
      // Safely add optional status fields if they don't exist
      status_code: rawDevice.status_code ?? null,
      status_text: rawDevice.status_text ?? this.getDeviceStatusText(rawDevice.status_code),
      days_since_active: rawDevice.last_active_time ? 
        Math.floor((Date.now() - rawDevice.last_active_time) / (1000 * 60 * 60 * 24)) : null,
      // Ensure starred and allow_edit are properly typed as numbers
      starred: typeof rawDevice.starred === 'number' ? rawDevice.starred : (rawDevice.starred ? 1 : 0),
      allow_edit: typeof rawDevice.allow_edit === 'number' ? rawDevice.allow_edit : 1
    };
  }

  async getDataDirectly(): Promise<GPS51DataResponse> {
    try {
      console.log('🔄 Fetching GPS51 data directly from database...');

      // Fetch all data in parallel
      const [groupsResult, devicesResult, usersResult] = await Promise.allSettled([
        this.fetchFromSupabase('gps51_groups?select=*&order=group_name'),
        this.fetchFromSupabase('gps51_devices?select=*,gps51_groups(group_name)&order=device_name&limit=500'),
        this.fetchFromSupabase('gps51_users?select=*&order=gp51_username&limit=100')
      ]);

      let groups: GPS51Group[] = [];
      let devices: GPS51Device[] = [];
      let users: GPS51User[] = [];

      // Process groups
      if (groupsResult.status === 'fulfilled' && groupsResult.value) {
        groups = groupsResult.value;
        console.log(`✅ Loaded ${groups.length} groups`);
      } else {
        console.error('❌ Failed to load groups:', groupsResult.status === 'rejected' ? groupsResult.reason : 'No data');
      }

      // Process devices with safe transformation
      if (devicesResult.status === 'fulfilled' && devicesResult.value) {
        devices = devicesResult.value.map((device: any) => this.transformDevice(device));
        console.log(`✅ Loaded ${devices.length} devices`);
      } else {
        console.error('❌ Failed to load devices:', devicesResult.status === 'rejected' ? devicesResult.reason : 'No data');
      }

      // Process users
      if (usersResult.status === 'fulfilled' && usersResult.value) {
        users = usersResult.value;
        console.log(`✅ Loaded ${users.length} users`);
      } else {
        console.error('❌ Failed to load users:', usersResult.status === 'rejected' ? usersResult.reason : 'No data');
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
        // Use HEAD request to get count without fetching data
        const response = await fetch(`${this.baseUrl}/rest/v1/${tableName}?select=*`, {
          method: 'HEAD',
          headers: {
            'apikey': this.anonKey,
            'Authorization': `Bearer ${this.anonKey}`,
            'Prefer': 'count=exact'
          }
        });
        
        let count = 0;
        const countHeader = response.headers.get('content-range');
        if (countHeader) {
          count = parseInt(countHeader.split('/')[1]) || 0;
        }
        
        tests.push({
          name: `${tableName} Table`,
          success: response.ok,
          data: count,
          error: response.ok ? undefined : `HTTP ${response.status}`
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
      config: {
        supabaseUrl: this.baseUrl,
        anonKeyLength: this.anonKey.length,
        configuredCorrectly: this.baseUrl.includes('bjkqxmvjuewshomihjqm')
      },
      connectivity: { success: false },
      tablesFound: [],
      errors: []
    };

    try {
      // Test basic connectivity
      const response = await fetch(`${this.baseUrl}/rest/v1/`, {
        headers: {
          'apikey': this.anonKey,
          'Authorization': `Bearer ${this.anonKey}`
        }
      });
      
      diagnostic.connectivity = {
        success: response.ok,
        status: response.status,
        error: response.ok ? undefined : `HTTP ${response.status}`
      };

      if (response.ok) {
        diagnostic.tablesFound.push('connection');
      }

      // Test other tables
      const tables = ['gps51_groups', 'gps51_devices', 'gps51_users', 'gps51_positions'];
      for (const table of tables) {
        try {
          const data = await this.fetchFromSupabase(`${table}?select=*&limit=1`);
          diagnostic.tablesFound.push(table);
          diagnostic[table] = {
            accessible: true,
            sampleDataCount: data.length,
            sampleRecord: data[0] || null
          };
        } catch (e) {
          diagnostic[table] = {
            accessible: false,
            error: e instanceof Error ? e.message : 'Unknown error'
          };
          diagnostic.errors.push(`${table}: ${e instanceof Error ? e.message : 'Unknown error'}`);
        }
      }

    } catch (error) {
      diagnostic.errors.push(`General: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return diagnostic;
  }

  async testConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      const response = await fetch(`${this.baseUrl}/rest/v1/`, {
        headers: {
          'apikey': this.anonKey,
          'Authorization': `Bearer ${this.anonKey}`
        }
      });
      
      if (!response.ok) {
        return {
          success: false,
          message: `Connection failed: HTTP ${response.status}`,
          details: { status: response.status, url: this.baseUrl }
        };
      }

      // Test table access
      const tables = await this.fetchFromSupabase('gps51_groups?select=group_id&limit=1');
      
      return {
        success: true,
        message: 'Connection successful',
        details: { 
          tablesAccessible: true, 
          sampleDataFound: tables.length > 0,
          url: this.baseUrl
        }
      };

    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown connection error',
        details: { url: this.baseUrl }
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
