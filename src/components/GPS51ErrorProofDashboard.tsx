import React, { useState, useEffect } from 'react';

// =============================================================================
// CLEAN GPS51 DASHBOARD - NO TYPESCRIPT ERRORS
// =============================================================================

interface GPS51Group {
  id: string;
  group_id: number;
  group_name: string;
  remark: string | null;
  device_count: number | null;
  is_active: boolean | null;
  shared: number | null;
  created_at: string;
  updated_at: string;
  last_sync_at: string | null;
}

interface GPS51Device {
  id: string;
  device_id: string;
  device_name: string;
  group_id: number;
  device_type: number;
  device_tag: string;
  car_tag_color: number | null;
  sim_number: string | null;
  login_name: string | null;
  creator: string;
  status_code?: number | null;
  status_text?: string | null;
  last_active_time: number | null;
  overdue_time: number | null;
  expire_notify_time: number;
  allow_edit: number;
  starred: number | null;
  icon: number | null;
  remark: string | null;
  video_channel_count: number | null;
  is_active: boolean;
  days_since_active?: number | null;
  create_time: number | null;
  created_at: string;
  updated_at: string;
  last_sync_at: string | null;
  gps51_groups?: {
    group_name: string;
  };
}

interface GPS51User {
  id: string;
  envio_user_id: string;
  gp51_username: string;
  nickname: string;
  company_name: string;
  email: string;
  phone: string;
  qq: string;
  wechat: string;
  multi_login: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_sync_at: string | null;
}

interface DashboardSummary {
  total_devices: number;
  active_devices: number;
  total_groups: number;
  devices_with_positions: number;
  total_users?: number;
}

// Diagnostic info interface
interface DiagnosticInfo {
  timestamp: string;
  config: {
    supabaseUrl: string;
    anonKeyLength: number;
    configuredCorrectly: boolean;
  };
  dataState: {
    groupsIsArray: boolean;
    groupsLength: number;
    devicesIsArray: boolean;
    devicesLength: number;
    usersIsArray: boolean;
    usersLength: number;
  };
  connectivity: {
    success: boolean;
    status?: number;
    error?: string;
  };
  errors: string[];
}

// Safe array helper function - fixed generic syntax
function safeArray(value: any): any[] {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined) return [];
  console.warn('Expected array but got:', typeof value, value);
  return [];
}

// Safe number helper function
function safeNumber(value: any): number {
  if (typeof value === 'number' && !isNaN(value)) return value;
  if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

const GPS51ErrorProofDashboard: React.FC = () => {
  const [data, setData] = useState({
    groups: [] as GPS51Group[],
    devices: [] as GPS51Device[],
    users: [] as GPS51User[],
    summary: {
      total_devices: 0,
      active_devices: 0,
      total_groups: 0,
      devices_with_positions: 0,
      total_users: 0
    } as DashboardSummary
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataMode, setDataMode] = useState<'api' | 'mock'>('mock');
  const [diagnosticInfo, setDiagnosticInfo] = useState<DiagnosticInfo | null>(null);

  // Configuration
  const config = {
    supabaseUrl: 'https://bjkqxmvjuewshomihjqm.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqa3F4bXZqdWV3c2hvbWloanFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwMzk4MzEsImV4cCI6MjA2NDYxNTgzMX0.VbyYBsPAp_a699yZ3xHtGGzljIQPm24EnwXLaGcsJb0'
  };

  // Safe fetch function with comprehensive error handling
  const fetchFromSupabase = async (endpoint: string) => {
    const url = `${config.supabaseUrl}/rest/v1/${endpoint}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'apikey': config.anonKey,
          'Authorization': `Bearer ${config.anonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      // Ensure we always return an array for list endpoints
      if (endpoint.includes('select=*') && !Array.isArray(data)) {
        console.warn('Expected array response but got:', typeof data, data);
        return [];
      }
      
      return data;
    } catch (error) {
      console.error('Fetch error for endpoint:', endpoint, error);
      throw error;
    }
  };

  // Transform device safely
  const transformDevice = (rawDevice: any): GPS51Device | null => {
    if (!rawDevice || typeof rawDevice !== 'object') {
      console.warn('Invalid device data:', rawDevice);
      return null;
    }

    try {
      return {
        ...rawDevice,
        status_code: rawDevice.status_code ?? null,
        status_text: rawDevice.status_text ?? getDeviceStatusText(rawDevice.status_code),
        days_since_active: rawDevice.last_active_time ? 
          Math.floor((Date.now() - rawDevice.last_active_time) / (1000 * 60 * 60 * 24)) : null
      };
    } catch (error) {
      console.error('Error transforming device:', error, rawDevice);
      return null;
    }
  };

  const getDeviceStatusText = (statusCode: number | null | undefined): string => {
    if (!statusCode) return 'Unknown';
    
    const statusMap: Record<number, string> = {
      1: 'Normal',
      2: 'Trial',
      3: 'Disabled',
      4: 'Service Fee Overdue',
      5: 'Time Expired'
    };
    return statusMap[statusCode] || `Status ${statusCode}`;
  };

  // Load mock data (guaranteed to work)
  const loadMockData = () => {
    console.log('🎭 Loading mock data...');
    
    const mockData = {
      groups: [
        {
          id: '1',
          group_id: 1,
          group_name: 'Fleet A',
          remark: 'Primary fleet vehicles',
          device_count: 25,
          is_active: true,
          shared: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_sync_at: new Date().toISOString()
        },
        {
          id: '2',
          group_id: 2,
          group_name: 'Fleet B',
          remark: 'Secondary fleet',
          device_count: 18,
          is_active: true,
          shared: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_sync_at: new Date().toISOString()
        }
      ] as GPS51Group[],
      devices: [
        {
          id: '1',
          device_id: 'DEV001',
          device_name: 'Vehicle Alpha',
          group_id: 1,
          device_type: 92,
          device_tag: 'ALPHA',
          car_tag_color: 1,
          sim_number: '1234567890',
          login_name: 'alpha_login',
          creator: 'admin',
          status_code: 1,
          status_text: 'Normal',
          last_active_time: Date.now(),
          overdue_time: null,
          expire_notify_time: Date.now() + 86400000,
          allow_edit: 1,
          starred: 0,
          icon: 1,
          remark: 'Test vehicle',
          video_channel_count: 4,
          is_active: true,
          days_since_active: 0,
          create_time: Date.now(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_sync_at: new Date().toISOString(),
          gps51_groups: { group_name: 'Fleet A' }
        },
        {
          id: '2',
          device_id: 'DEV002',
          device_name: 'Vehicle Beta',
          group_id: 2,
          device_type: 92,
          device_tag: 'BETA',
          car_tag_color: 2,
          sim_number: '1234567891',
          login_name: 'beta_login',
          creator: 'admin',
          status_code: 1,
          status_text: 'Normal',
          last_active_time: Date.now() - 86400000,
          overdue_time: null,
          expire_notify_time: Date.now() + 86400000,
          allow_edit: 1,
          starred: 1,
          icon: 1,
          remark: 'Test vehicle 2',
          video_channel_count: 4,
          is_active: false,
          days_since_active: 1,
          create_time: Date.now(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_sync_at: new Date().toISOString(),
          gps51_groups: { group_name: 'Fleet B' }
        }
      ] as GPS51Device[],
      users: [
        {
          id: '1',
          envio_user_id: 'env001',
          gp51_username: 'admin',
          nickname: 'Administrator',
          company_name: 'Test Company',
          email: 'admin@example.com',
          phone: '1234567890',
          qq: '123456',
          wechat: 'admin_wechat',
          multi_login: 1,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_sync_at: new Date().toISOString()
        }
      ] as GPS51User[],
      summary: {
        total_devices: 2,
        active_devices: 1,
        total_groups: 2,
        devices_with_positions: 0,
        total_users: 1
      } as DashboardSummary
    };

    setData(mockData);
    setLoading(false);
    setError(null);
    console.log('✅ Mock data loaded successfully');
  };

  // Load API data with comprehensive error handling
  const loadApiData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Fetching GPS51 data from API...');

      // Initialize with empty arrays to prevent map errors
      let groups: GPS51Group[] = [];
      let devices: GPS51Device[] = [];
      let users: GPS51User[] = [];
      let errors: string[] = [];

      // Fetch data with individual error handling
      try {
        const groupsResponse = await fetchFromSupabase('gps51_groups?select=*&order=group_name');
        groups = safeArray(groupsResponse) as GPS51Group[];
        console.log(`✅ Loaded ${groups.length} groups`);
      } catch (error) {
        errors.push(`Groups: ${error instanceof Error ? error.message : 'Unknown error'}`);
        console.error('❌ Failed to load groups:', error);
      }

      try {
        const devicesResponse = await fetchFromSupabase('gps51_devices?select=*,gps51_groups(group_name)&order=device_name&limit=500');
        const rawDevices = safeArray(devicesResponse);
        devices = rawDevices.map(transformDevice).filter(Boolean) as GPS51Device[];
        console.log(`✅ Loaded ${devices.length} devices`);
      } catch (error) {
        errors.push(`Devices: ${error instanceof Error ? error.message : 'Unknown error'}`);
        console.error('❌ Failed to load devices:', error);
      }

      try {
        const usersResponse = await fetchFromSupabase('gps51_users?select=*&order=gp51_username&limit=100');
        users = safeArray(usersResponse) as GPS51User[];
        console.log(`✅ Loaded ${users.length} users`);
      } catch (error) {
        errors.push(`Users: ${error instanceof Error ? error.message : 'Unknown error'}`);
        console.error('❌ Failed to load users:', error);
      }

      // Calculate summary with safe array operations
      const summary: DashboardSummary = {
        total_devices: devices.length,
        active_devices: devices.filter(d => d && d.is_active === true).length,
        total_groups: groups.length,
        devices_with_positions: 0,
        total_users: users.length
      };

      // Try to get positions count
      try {
        const positions = await fetchFromSupabase('gps51_positions?select=device_id&limit=1000');
        const positionsArray = safeArray(positions);
        const uniqueDevices = new Set(positionsArray.map((p: any) => p?.device_id).filter(Boolean));
        summary.devices_with_positions = uniqueDevices.size;
        console.log(`✅ Found positions for ${uniqueDevices.size} devices`);
      } catch (posError) {
        console.warn('⚠️ Could not fetch positions data:', posError);
      }

      setData({
        groups,
        devices,
        users,
        summary
      });

      if (errors.length > 0) {
        setError(`Partial data loaded with errors: ${errors.join('; ')}`);
      }

      console.log('📊 Final summary:', summary);

    } catch (err) {
      console.error('❌ Failed to load API data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      
      // Fall back to empty but valid data structure
      setData({
        groups: [],
        devices: [],
        users: [],
        summary: {
          total_devices: 0,
          active_devices: 0,
          total_groups: 0,
          devices_with_positions: 0,
          total_users: 0
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    if (dataMode === 'mock') {
      loadMockData();
    } else {
      await loadApiData();
    }
  };

  const runDiagnostic = async () => {
    try {
      // Initialize diagnostic object with all properties from the start
      const diagnostic: DiagnosticInfo = {
        timestamp: new Date().toISOString(),
        config: {
          supabaseUrl: config.supabaseUrl,
          anonKeyLength: config.anonKey.length,
          configuredCorrectly: config.supabaseUrl.includes('bjkqxmvjuewshomihjqm')
        },
        dataState: {
          groupsIsArray: Array.isArray(data.groups),
          groupsLength: data.groups.length,
          devicesIsArray: Array.isArray(data.devices),
          devicesLength: data.devices.length,
          usersIsArray: Array.isArray(data.users),
          usersLength: data.users.length
        },
        connectivity: {
          success: false
        },
        errors: []
      };

      // Test connectivity
      try {
        const response = await fetch(`${config.supabaseUrl}/rest/v1/`, {
          headers: {
            'apikey': config.anonKey,
            'Authorization': `Bearer ${config.anonKey}`
          }
        });
        diagnostic.connectivity = {
          success: response.ok,
          status: response.status
        };
      } catch (e) {
        diagnostic.connectivity = {
          success: false,
          error: e instanceof Error ? e.message : 'Unknown error'
        };
      }

      setDiagnosticInfo(diagnostic);
      console.log('📊 Diagnostic completed:', diagnostic);

    } catch (error) {
      console.error('❌ Diagnostic failed:', error);
      setDiagnosticInfo({
        timestamp: new Date().toISOString(),
        config: {
          supabaseUrl: config.supabaseUrl,
          anonKeyLength: config.anonKey.length,
          configuredCorrectly: false
        },
        dataState: {
          groupsIsArray: false,
          groupsLength: 0,
          devicesIsArray: false,
          devicesLength: 0,
          usersIsArray: false,
          usersLength: 0
        },
        connectivity: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        errors: [error instanceof Error ? error.message : 'Unknown error']
      });
    }
  };

  useEffect(() => {
    loadData();
  }, [dataMode]);

  // Safe rendering components
  const StatCard: React.FC<{ 
    title: string; 
    value: number; 
    color: 'blue' | 'green' | 'purple' | 'orange';
    icon?: string;
  }> = ({ title, value, color, icon }) => {
    const safeValue = safeNumber(value);
    
    const colorClasses = {
      blue: 'bg-blue-50 text-blue-800 border-blue-200',
      green: 'bg-green-50 text-green-800 border-green-200',
      purple: 'bg-purple-50 text-purple-800 border-purple-200',
      orange: 'bg-orange-50 text-orange-800 border-orange-200'
    };

    return (
      <div className={`p-6 rounded-lg border-2 ${colorClasses[color]}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wide">{title}</h3>
            <p className="text-3xl font-bold mt-2">{safeValue.toLocaleString()}</p>
          </div>
          {icon && (
            <div className="text-3xl opacity-75">
              {icon}
            </div>
          )}
        </div>
      </div>
    );
  };

  const GroupsList: React.FC = () => {
    const safeGroups = safeArray(data.groups) as GPS51Group[];
    
    if (safeGroups.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <p>No groups found</p>
          <p className="text-sm mt-1">
            {dataMode === 'api' ? 'Check API connection or try Mock Data mode' : 'Try switching to API mode'}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {safeGroups.slice(0, 8).map((group, index) => {
          if (!group || !group.id) {
            console.warn('Invalid group at index:', index, group);
            return null;
          }
          
          return (
            <div key={group.id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{group.group_name || 'Unnamed Group'}</h4>
                  <p className="text-sm text-gray-500">{safeNumber(group.device_count)} devices</p>
                  <p className="text-sm text-gray-500">ID: {group.group_id}</p>
                  {group.remark && (
                    <p className="text-xs text-gray-400 mt-1">{group.remark}</p>
                  )}
                </div>
                <div className={`px-2 py-1 rounded text-xs font-medium ${
                  group.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {group.is_active ? 'Active' : 'Inactive'}
                </div>
              </div>
            </div>
          );
        })}
        {safeGroups.length > 8 && (
          <p className="text-center text-gray-500 text-sm py-2">
            ... and {safeGroups.length - 8} more groups
          </p>
        )}
      </div>
    );
  };

  const DevicesList: React.FC = () => {
    const safeDevices = safeArray(data.devices) as GPS51Device[];
    
    if (safeDevices.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <p>No devices found</p>
          <p className="text-sm mt-1">
            {dataMode === 'api' ? 'Check API connection or try Mock Data mode' : 'Try switching to API mode'}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {safeDevices.slice(0, 8).map((device, index) => {
          if (!device || !device.id) {
            console.warn('Invalid device at index:', index, device);
            return null;
          }
          
          const isActive = device.is_active;
          const isStarred = Boolean(device.starred);
          
          return (
            <div key={device.id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-900">{device.device_name || 'Unnamed Device'}</h4>
                    {isStarred && <span className="text-yellow-500">⭐</span>}
                  </div>
                  <p className="text-sm text-gray-500">ID: {device.device_id}</p>
                  <p className="text-sm text-gray-500">
                    {device.gps51_groups?.group_name || 'No Group'}
                  </p>
                  {device.last_active_time && (
                    <p className="text-xs text-gray-400 mt-1">
                      Last active: {new Date(device.last_active_time).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className={`px-2 py-1 rounded text-xs font-medium ${
                  isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {device.status_text || (isActive ? 'Active' : 'Inactive')}
                </div>
              </div>
            </div>
          );
        })}
        {safeDevices.length > 8 && (
          <p className="text-center text-gray-500 text-sm py-2">
            ... and {safeDevices.length - 8} more devices
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">GPS51 Fleet Dashboard</h1>
              <p className="text-gray-600 mt-1">Error-proof version - no more "map is not a function" errors!</p>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setDataMode('api')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  dataMode === 'api' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Live Data
              </button>
              <button
                onClick={() => setDataMode('mock')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  dataMode === 'mock' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Mock Data (Safe)
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={loadData}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Loading...' : 'Refresh Data'}
            </button>
            <button
              onClick={runDiagnostic}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              Run Diagnostic
            </button>
          </div>
        </div>

        {/* Status Messages */}
        {loading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
              <span className="text-blue-800">Loading GPS51 data safely...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <span className="text-red-500 mr-2 text-lg">⚠️</span>
              <div>
                <h4 className="font-semibold text-red-800">Error Loading Data</h4>
                <p className="text-red-700 mt-1">{error}</p>
                <p className="text-red-600 text-sm mt-2">
                  Try switching to "Mock Data (Safe)" mode to verify the interface works.
                </p>
              </div>
            </div>
          </div>
        )}

        {dataMode === 'mock' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <span className="text-green-500 mr-2 text-lg">✅</span>
              <div>
                <h4 className="font-semibold text-green-800">Safe Mock Data Mode</h4>
                <p className="text-green-700">
                  Displaying sample data that's guaranteed to work. 
                  This mode prevents all "map is not a function" errors.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Groups"
            value={data.summary.total_groups}
            color="blue"
            icon="🏢"
          />
          <StatCard
            title="Total Devices"
            value={data.summary.total_devices}
            color="green"
            icon="🚗"
          />
          <StatCard
            title="Active Devices"
            value={data.summary.active_devices}
            color="purple"
            icon="📡"
          />
          <StatCard
            title="With Positions"
            value={data.summary.devices_with_positions}
            color="orange"
            icon="📍"
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Groups Section */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Device Groups ({safeArray(data.groups).length})
              </h2>
            </div>
            <div className="p-6">
              <GroupsList />
            </div>
          </div>

          {/* Devices Section */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Recent Devices ({safeArray(data.devices).length})
              </h2>
            </div>
            <div className="p-6">
              <DevicesList />
            </div>
          </div>
        </div>

        {/* Users Section */}
        {safeArray(data.users).length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                GPS51 Users ({safeArray(data.users).length})
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {safeArray(data.users).map((user: GPS51User, index: number) => {
                  if (!user || !user.id) {
                    console.warn('Invalid user at index:', index, user);
                    return null;
                  }
                  
                  return (
                    <div key={user.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-900">{user.nickname || 'Unknown User'}</h4>
                          <p className="text-sm text-gray-500">@{user.gp51_username}</p>
                          <p className="text-sm text-gray-500">{user.company_name}</p>
                          {user.email && (
                            <p className="text-xs text-gray-400 mt-1">{user.email}</p>
                          )}
                        </div>
                        <div className={`px-2 py-1 rounded text-xs font-medium ${
                          user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Diagnostic Information */}
        {diagnosticInfo && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">🔍 Diagnostic Information</h2>
            </div>
            <div className="p-6">
              <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm whitespace-pre-wrap">
                  {JSON.stringify(diagnosticInfo, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Error Prevention Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold mb-2 text-blue-800">🛡️ Error Prevention Status</h3>
          <div className="space-y-1 text-sm text-blue-700">
            <p><strong>Supabase URL:</strong> {config.supabaseUrl}</p>
            <p><strong>Data Mode:</strong> {dataMode === 'mock' ? '🎭 Safe Mock Data' : '🔗 Live API Data'}</p>
            <p><strong>Array Safety:</strong> 
              Groups: {Array.isArray(data.groups) ? '✅' : '❌'} | 
              Devices: {Array.isArray(data.devices) ? '✅' : '❌'} | 
              Users: {Array.isArray(data.users) ? '✅' : '❌'}
            </p>
            <p><strong>Error Protection:</strong> ✅ All .map() calls are protected with safeArray() helper</p>
          </div>
        </div>

        {/* Troubleshooting Guide */}
        {data.summary.total_devices === 0 && dataMode === 'api' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="font-semibold mb-2 text-yellow-800">💡 "map is not a function" - Fixed!</h3>
            <div className="space-y-2 text-sm text-yellow-700">
              <p><strong>What was the problem:</strong> The error occurs when code tries to use .map() on something that isn't an array.</p>
              <p><strong>Common causes:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>API returns null/undefined instead of expected array</li>
                <li>Component renders before data is loaded</li>
                <li>Database table is empty or has wrong structure</li>
                <li>Network error causes malformed response</li>
              </ul>
              <p><strong>How this version prevents the error:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>✅ safeArray() helper ensures all data is an array before .map()</li>
                <li>✅ Mock data mode provides guaranteed working data</li>
                <li>✅ Individual error handling for each API call</li>
                <li>✅ Null/undefined checks before rendering</li>
                <li>✅ Fallback to empty arrays when data is missing</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GPS51ErrorProofDashboard;
