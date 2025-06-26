// Core GP51 API Types with enhanced compatibility
export interface GP51AuthResponse {
  status: number;
  cause: string;
  token?: string;
  expires_at?: string;
  success?: boolean;
  error?: string;
}

export interface GP51User {
  username: string;
  usertype: number;
  showname: string;
  companyname?: string;
  email?: string;
  phone?: string;
  wechat?: string;
  qq?: string;
  creater?: string;
  
  // Component compatibility properties
  id?: string;
  company_name?: string;
  gp51_username?: string;
  nickname?: string;
  is_active?: boolean;
}

export interface GP51Device {
  // GP51 API properties (original)
  deviceid: string;
  devicename: string;
  devicetype: number;
  status: string;
  lastactivetime: number;
  simnum?: string;
  groupid?: number;
  
  // Component compatibility properties (aliases)
  device_id?: string;          // Alias for deviceid
  device_name?: string;        // Alias for devicename
  device_type?: number;        // Alias for devicetype
  sim_number?: string;         // Alias for simnum
  last_active_time?: number;   // Alias for lastactivetime
  
  // Additional component properties
  id?: string;                 // For component keys
  is_active?: boolean;         // Component status
  starred?: boolean;           // UI feature
  gps51_groups?: string;       // Group display name
  owner?: string;              // Device owner
}

export interface GP51Group {
  // GP51 API properties (original)
  groupid: number;
  groupname: string;
  devices: GP51Device[];
  remark?: string;
  creater?: string;
  
  // Component compatibility properties (aliases)
  id?: string;                 // For component keys
  group_id?: number;           // Alias for groupid
  group_name?: string;         // Alias for groupname
  device_count?: number;       // Count of devices
  last_sync_at?: Date | string; // Last sync time - can be Date or string
}

export interface GP51Position {
  // GP51 API properties (original)
  deviceid?: string;
  callat?: number;             // Calculated latitude
  callon?: number;             // Calculated longitude
  lat?: number;                // Raw latitude
  lon?: number;                // Raw longitude
  speed?: number;
  course?: number;
  altitude?: number;
  timestamp?: number;
  updatetime?: number;
  arrivedtime?: number;
  status?: number;
  strstatus?: string;
  alarm?: number;
  stralarm?: string;
  gotsrc?: string;
  rxlevel?: number;
  gpsvalidnum?: number;
  moving?: number;
  totaldistance?: number;
  reportmode?: number;
  
  // Component compatibility properties (aliases)
  device_id?: string;          // Alias for deviceid
  latitude?: number;           // Standardized latitude
  longitude?: number;          // Standardized longitude
  update_time?: number;        // Alias for updatetime
  address?: string;            // Reverse geocoded address
}

export interface GP51DashboardSummary {
  // Standard properties
  totalUsers: number;
  totalDevices: number;
  activeDevices: number;
  offlineDevices: number;
  totalGroups: number;
  lastUpdateTime: Date;
  connectionStatus: 'connected' | 'disconnected' | 'error';
  apiResponseTime: number;
  
  // Component compatibility aliases
  total_users?: number;        // Alias for totalUsers
  total_devices?: number;      // Alias for totalDevices
  active_devices?: number;     // Alias for activeDevices
  offline_devices?: number;    // Alias for offlineDevices
  total_groups?: number;       // Alias for totalGroups
}

export interface GP51TestResult {
  success: boolean;
  message?: string;          // Made optional
  responseTime?: number;     // Made optional
  timestamp?: Date;          // Made optional
  name?: string;
  data?: any;
  error?: string;
  details?: any;
}

export interface GP51ProcessResult {
  success: boolean;          // Added as required
  processed: number;
  errors: number;
  skipped: number;
  details: string[];
  timestamp: Date;
  created?: number;          // Made optional
  errorDetails?: Array<{itemId: string; message: string}>; // Made optional and more specific
}

export interface GP51MonitorListResponse {
  status: number;
  cause: string;
  groups: GP51Group[];
  success?: boolean;           // Component compatibility
  error?: string;              // Error message alias
  data?: {                     // Structured data
    groups: GP51Group[];
    users: GP51User[];
    devices: GP51Device[];
    summary: GP51DashboardSummary;
  };
}

export interface GP51HealthStatus {
  isConnected: boolean;
  lastPingTime: Date;
  responseTime: number;
  tokenValid: boolean;
  sessionValid: boolean;
  activeDevices: number;
  errors: string[];
  lastCheck: Date;
  errorMessage?: string;
  status?: number;
  connectionDetails?: string;
}

export interface GP51Session {
  username: string;
  token: string;
  isConnected: boolean;
  expiresAt: Date;
  lastActivity: Date;
}

export interface GP51DeviceData {
  // GP51 API properties (original)
  deviceid: string;
  devicename: string;
  devicetype: number;
  status: string;
  lastactivetime: number;
  simnum?: string;
  
  // Component compatibility properties
  deviceId?: string;           // Alias for deviceid
  deviceName?: string;         // Alias for devicename
  deviceType?: number;         // Alias for devicetype
  device_id?: string;          // Alternative alias
  device_name?: string;        // Alternative alias
  
  // Extended properties
  lastPosition?: GP51Position;
  isOnline?: boolean;
  isActive?: boolean;          // Component status
  batteryLevel?: number;
  signalStrength?: number;
  lastUpdate?: Date;
  owner?: string;
  groupId?: string;
  groupName?: string;
}

export interface GP51LiveVehiclesResponse {
  vehicles: GP51DeviceData[];
  lastUpdate: Date;
  totalCount: number;
  activeCount: number;
  
  // Component compatibility
  success?: boolean;           // Success indicator
  error?: string;              // Error message
  data?: GP51DeviceData[];     // Data alias
  metadata?: {                 // Added metadata support
    totalDevices: number;
    activeDevices: number;
    lastSync: string;
  };
}

export interface GP51TelemetryData {
  deviceId: string;
  timestamp: Date;
  position?: GP51Position;     // Made optional
  sensors?: {                  // Made optional
    temperature?: number;
    humidity?: number;
    fuel?: number;
    battery?: number;
  };
  status?: {                   // Made optional
    engine: boolean;
    doors: boolean[];
    alarms: string[];
  };
}

export interface GP51ProcessedPosition {
  deviceId: string;
  deviceName: string;
  latitude: number;
  longitude: number;
  speed: number;
  timestamp: Date;
  status: string;
  isMoving: boolean;
  course?: number;
  altitude?: number;
  statusText?: string;        // Added for compatibility
  // Removed isOnline as it doesn't exist in this interface
}

export interface LivePositionData {
  device_id: string;
  position_data: any;
  latitude: number;
  longitude: number;
  speed: number;
  course: number;
  position_timestamp: string;
  server_timestamp: string;
  status_code: number;
  status_description: string;
  is_moving: boolean;
  location_source: string;
}

export interface VehicleGP51Metadata {
  gp51DeviceId: string;
  lastSyncTime: Date;
  syncStatus: 'pending' | 'synced' | 'error';
  gp51Data: GP51DeviceData;
  positionHistory: GP51ProcessedPosition[];
}

export interface UnifiedGP51Response {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
  timestamp: Date;
}

export interface UnifiedGP51Service {
  authenticate(username: string, password: string): Promise<GP51AuthResponse>;
  authenticateAdmin(username: string, password: string): Promise<GP51AuthResponse>;
  logout(): Promise<void>;
  disconnect(): Promise<void>;
  
  readonly isConnected: boolean;
  readonly session: GP51Session | null;
  readonly isAuthenticated: boolean;
  readonly currentUsername: string | null;
  
  getConnectionHealth(): Promise<GP51HealthStatus>;
  getHealthStatus(): Promise<GP51HealthStatus>;
  
  queryMonitorList(username?: string): Promise<GP51MonitorListResponse>;
  getLastPositions(deviceIds?: string[]): Promise<GP51Position[]>;
  addUser(userData: any): Promise<GP51AuthResponse>;
  addDevice(deviceData: any): Promise<GP51AuthResponse>;
  sendCommand(deviceid: string, command: string, params: any[]): Promise<any>;
  
  loadExistingSession(): Promise<boolean>;
}

export interface UseUnifiedGP51ServiceReturn {
  // Authentication methods
  authenticate: (username: string, password: string) => Promise<GP51AuthResponse>;
  authenticateAdmin: (username: string, password: string) => Promise<GP51AuthResponse>;
  logout: () => Promise<void>;
  disconnect: () => Promise<void>;

  // State properties that components expect
  isAuthenticated: boolean;
  isConnected: boolean;        // REQUIRED by components
  currentUser: GP51User | null;
  session: GP51Session | null;
  isLoading: boolean;
  error: string | null;

  // Data properties
  users: GP51User[];
  devices: GP51Device[];
  groups: GP51Group[];
  summary: GP51DashboardSummary | null;

  // Health monitoring
  healthStatus: GP51HealthStatus | null;
  getConnectionHealth: () => Promise<GP51HealthStatus>;
  testConnection?: () => Promise<GP51TestResult>;

  // Data operations that components expect
  fetchData: () => Promise<void>;
  fetchUsers: () => Promise<void>;     // REQUIRED by UnifiedGP51Dashboard
  fetchDevices: () => Promise<void>;   // REQUIRED by UnifiedGP51Dashboard
  getPositions: (deviceIds?: string[]) => Promise<GP51Position[]>;

  // Utility methods
  clearError: () => void;              // REQUIRED by UnifiedGP51Dashboard
}

// Legacy aliases for backward compatibility
export type GPS51Device = GP51Device;
export type GPS51Group = GP51Group;
export type GPS51User = GP51User;
export type GPS51Position = GP51Position;
export type GPS51DashboardSummary = GP51DashboardSummary;
export type GPS51TestResult = GP51TestResult;
export type GPS51DataResponse<T = any> = GP51MonitorListResponse;
export type GP51DataResponse<T = any> = GP51MonitorListResponse;
