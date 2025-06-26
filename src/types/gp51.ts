
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
  deviceid: string;
  devicename: string;
  devicetype: number;
  status: string;
  lastactivetime: number;
  simnum?: string;
  groupid?: number;
  owner?: string;
  
  // Component compatibility properties
  device_id?: string;
  device_name?: string;
  device_type?: number;
  sim_number?: string;
  last_active_time?: number;
  id?: string;
  is_active?: boolean;
  starred?: boolean;
  gps51_groups?: string;
}

export interface GP51Group {
  groupid: number;
  groupname: string;
  devices: GP51Device[];
  remark?: string;
  creater?: string;
  
  // Component compatibility properties
  id?: string;
  group_id?: number;
  group_name?: string;
  device_count?: number;
  last_sync_at?: Date;
}

export interface GP51Position {
  deviceid?: string;
  callat?: number;
  callon?: number;
  lat?: number;
  lon?: number;
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
  
  // Component compatibility properties
  device_id?: string;
  latitude?: number;
  longitude?: number;
  update_time?: number;
  address?: string;
}

export interface GP51DashboardSummary {
  totalUsers: number;
  totalDevices: number;
  activeDevices: number;
  offlineDevices: number;
  totalGroups: number;
  lastUpdateTime: Date;
  connectionStatus: 'connected' | 'disconnected' | 'error';
  apiResponseTime: number;
  
  // Component compatibility aliases
  total_users?: number;
  total_devices?: number;
  active_devices?: number;
  offline_devices?: number;
  total_groups?: number;
  devices_with_positions?: number;
}

export interface GP51TestResult {
  success: boolean;
  message: string;        // REQUIRED
  responseTime: number;   // REQUIRED
  timestamp: Date;        // REQUIRED
  name?: string;
  data?: any;
  error?: string;
  details?: any;
}

export interface GP51ProcessResult {
  success: boolean;
  processed: number;
  errors: number;
  skipped: number;
  details: string[];
  timestamp: Date;
  created?: number;
  errorDetails?: string[];
}

export interface GP51MonitorListResponse {
  status: number;
  cause: string;
  groups: GP51Group[];
  success?: boolean;
  error?: string;
  data?: {
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
  deviceid: string;
  devicename: string;
  devicetype: number;
  status: string;
  lastactivetime: number;
  simnum?: string;
  
  // Component compatibility
  deviceId?: string;
  deviceName?: string;
  deviceType?: number;
  device_id?: string;
  device_name?: string;
  
  // Extended properties
  lastPosition?: GP51Position;
  isOnline?: boolean;
  isActive?: boolean;
  batteryLevel?: number;
  signalStrength?: number;
  lastUpdate?: Date;
  owner?: string;
}

export interface GP51LiveVehiclesResponse {
  vehicles: GP51DeviceData[];
  lastUpdate: Date;
  totalCount: number;
  activeCount: number;
  success?: boolean;
  error?: string;
  data?: GP51DeviceData[];
  devices?: GP51DeviceData[];
}

export interface GP51TelemetryData {
  deviceId: string;
  timestamp: Date;
  position: GP51Position;
  sensors: {
    temperature?: number;
    humidity?: number;
    fuel?: number;
    battery?: number;
  };
  status: {
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
  statusText?: string;
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
  // Authentication
  authenticate: (username: string, password: string) => Promise<GP51AuthResponse>;
  authenticateAdmin: (username: string, password: string) => Promise<GP51AuthResponse>;
  logout: () => Promise<void>;
  disconnect: () => Promise<void>;

  // State
  isAuthenticated: boolean;
  isConnected: boolean;
  currentUser: GP51User | null;
  session: GP51Session | null;
  isLoading: boolean;
  error: string | null;

  // Data
  users: GP51User[];
  devices: GP51Device[];
  groups: GP51Group[];
  summary: GP51DashboardSummary | null;

  // Health monitoring
  healthStatus: GP51HealthStatus | null;
  getConnectionHealth: () => Promise<GP51HealthStatus>;
  testConnection: () => Promise<GP51TestResult>;

  // Data operations
  fetchData: () => Promise<void>;
  fetchUsers: () => Promise<void>;
  fetchDevices: () => Promise<void>;
  getPositions: (deviceIds?: string[]) => Promise<GP51Position[]>;

  // Utilities
  clearError: () => void;
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
