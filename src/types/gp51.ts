
// Core GP51 Types
export interface GP51AuthResponse {
  status: number;
  cause: string;
  token?: string;
  expires_at?: string;
  success?: boolean;  // Add for compatibility
  error?: string;     // Add for compatibility
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
  status?: number;              // Add for compatibility
  connectionDetails?: string;   // Add for compatibility
}

export interface GP51Session {
  username: string;
  token: string;
  isConnected: boolean;
  expiresAt: Date;
  lastActivity: Date;
}

export interface GP51MonitorListResponse {
  status: number;
  cause: string;
  groups: GP51Group[];
  success?: boolean;  // Add for compatibility
  error?: string;     // Add for compatibility
  data?: {           // Add for compatibility
    groups: GP51Group[];
    users: GP51User[];
    devices: GP51Device[];
    summary: GP51DashboardSummary;
  };
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
}

export interface GP51Group {
  groupid: number;
  groupname: string;
  devices: GP51Device[];
  remark?: string;
  creater?: string;
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
}

export interface GP51Position {
  deviceid: string;
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
}

export interface GP51ProcessedPosition {
  deviceId: string;
  deviceName: string;  // Add this property
  latitude: number;
  longitude: number;
  speed: number;
  course: number;
  timestamp: Date;
  status: number;
  statusText: string;
  isMoving: boolean;
  address?: string;
  altitude?: number;
}

// Export additional types that may be needed
export interface GP51Config {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  defaultTimezone: number;
}

export interface GP51SyncResult {
  success: boolean;
  processed: number;
  errors: string[];
  timestamp: Date;
}

// Extended Types for Dashboard and Components
export interface GP51DashboardSummary {
  totalUsers: number;
  totalDevices: number;
  activeDevices: number;
  offlineDevices: number;
  totalGroups: number;
  lastUpdateTime: Date;
  connectionStatus: 'connected' | 'disconnected' | 'error';
  apiResponseTime: number;
}

export interface GP51DeviceData extends GP51Device {
  lastPosition?: GP51Position;
  isOnline: boolean;
  batteryLevel?: number;
  signalStrength?: number;
  lastUpdate: Date;
}

export interface GP51ProcessResult {
  success: boolean;
  processed: number;
  errors: number;
  skipped: number;
  details: string[];
  timestamp: Date;
}

export interface GP51TestResult {
  success: boolean;
  message: string;
  responseTime: number;
  timestamp: Date;
  details?: any;
  error?: string;
}

export interface GP51DataResponse<T = any> {
  status: number;
  cause: string;
  data?: T;
  success: boolean;
  error?: string;
  timestamp: Date;
}

export interface GP51LiveVehiclesResponse {
  vehicles: GP51DeviceData[];
  lastUpdate: Date;
  totalCount: number;
  activeCount: number;
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

export interface VehicleGP51Metadata {
  gp51DeviceId: string;
  lastSyncTime: Date;
  syncStatus: 'pending' | 'synced' | 'error';
  gp51Data: GP51DeviceData;
  positionHistory: GP51ProcessedPosition[];
}

// Unified Response Interface
export interface UnifiedGP51Response<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: Date;
}

// Service Interface
export interface UnifiedGP51Service {
  // Authentication
  authenticate(username: string, password: string): Promise<GP51AuthResponse>;
  authenticateAdmin(username: string, password: string): Promise<GP51AuthResponse>;
  logout(): Promise<void>;
  disconnect(): Promise<void>;
  
  // Properties
  readonly isConnected: boolean;
  readonly session: GP51Session | null;
  readonly isAuthenticated: boolean;
  readonly currentUsername: string | null;
  
  // Health and Connection
  getConnectionHealth(): Promise<GP51HealthStatus>;
  getHealthStatus(): Promise<GP51HealthStatus>; // Alias for compatibility
  
  // Data Operations
  queryMonitorList(username?: string): Promise<GP51MonitorListResponse>;
  getLastPositions(deviceIds?: string[]): Promise<GP51Position[]>;
  addUser(userData: any): Promise<GP51AuthResponse>;
  addDevice(deviceData: any): Promise<GP51AuthResponse>;
  sendCommand(deviceid: string, command: string, params: any[]): Promise<any>;
  
  // Session Management
  loadExistingSession(): Promise<boolean>;
}

// Export legacy aliases for backward compatibility
export type GPS51Device = GP51Device;
export type GPS51Group = GP51Group;
export type GPS51User = GP51User;
export type GPS51Position = GP51Position;
export type GPS51DashboardSummary = GP51DashboardSummary;
export type GPS51TestResult = GP51TestResult;
export type GPS51DataResponse<T = any> = GP51DataResponse<T>;
