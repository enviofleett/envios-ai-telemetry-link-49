export interface GP51AuthResponse {
  status: number;
  cause: string;
  success: boolean;
  token?: string;
  username?: string;
  error?: string;
}

export interface GP51ProcessResult {
  created: number;
  updated: number;
  deleted: number;
  errors: number;
  message?: string;
  success: boolean;
}

export interface GP51LiveVehiclesResponse {
  success: boolean;
  vehicles?: GP51Device[];
  error?: string;
}

export interface GP51DeviceTreeResponse {
  success: boolean;
  data?: GP51Device[];
  groups?: GP51Group[];
  error?: string;
}

export interface GP51TelemetryData {
  speed: number;
  latitude: number;
  longitude: number;
  timestamp: string;
}

export interface GP51ProcessedPosition {
  deviceid: string;
  latitude: number;
  longitude: number;
  speed: number;
  course: number;
  timestamp: string;
}

export interface GP51PerformanceMetrics {
  responseTime: number;
  successRate: number;
  requestsPerMinute: number;
  errorRate: number;
  lastUpdate: Date;
  uptime: number;
}

export interface GP51FleetDataOptions {
  includePositions?: boolean;
  groupFilter?: string[];
  forceRefresh?: boolean;
}

export interface GP51LiveData {
  positions: GP51Position[];
  lastUpdate: Date;
  filter(predicate: (item: GP51Position) => boolean): GP51Position[];
  length: number;
}

export interface GP51PositionRPCResponse {
  device_id: string;
  latitude: number;
  longitude: number;
  speed: number;
  course: number;
  altitude: number;
  device_time: string;
  server_time: string;
  status: number;
  moving: boolean;
  gps_source: number;
  battery: number;
  signal: number;
  satellites: number;
  raw_data: string;
}

export interface RealAnalyticsData {
  totalUsers: number;
  activeUsers: number;
  totalVehicles: number;
  activeVehicles: number;
  recentActivity: any[];
  vehicleStatus: {
    total: number;
    online: number;
    offline: number;
    moving: number;
    parked: number;
  };
  fleetUtilization: {
    activeVehicles: number;
    totalVehicles: number;
    utilizationRate: number;
  };
  systemHealth: {
    apiStatus: string;
    lastUpdate: Date;
    responseTime: number;
  };
  performance: {
    averageSpeed: number;
    totalDistance: number;
    alertCount: number;
  };
  growth: {
    newUsers: number;
    newVehicles: number;
    period: string;
    percentageChange: number;
  };
  sync: {
    importedUsers: number;
    importedVehicles: number;
    lastSync: Date;
    status: string;
  };
}

// Updated GP51TestResult with missing properties
export interface GP51TestResult {
  name: string;
  success: boolean;
  testType: 'connection' | 'authentication' | 'data' | 'performance';
  message: string;
  duration: number;
  responseTime: number;
  timestamp: Date;
  data?: any;
  error?: string;
}

// Updated GP51Group with all required properties for UI compatibility
export interface GP51Group {
  groupid: number;
  groupname: string;
  parentgroupid?: number;
  level?: number;
  devicecount?: number;
  children?: GP51Group[];
  remark?: string;
  devices?: GP51Device[];
  
  // UI compatibility properties
  id?: number;
  group_name?: string;
  group_id?: number;
  device_count?: number;
  last_sync_at?: string;
}

// Updated GP51Device with all required properties
export interface GP51Device {
  deviceid: string;
  devicename: string;
  devicetype: string | number;
  groupid?: string | number;
  groupname?: string;
  imei?: string;
  simcardno?: string;
  status?: number;
  createtime?: string;
  lastactivetime?: string | number;
  isOnline?: boolean;
  vehicleInfo?: any;
  isActive?: boolean;
  
  // Additional properties for compatibility
  simnum?: string;
  overduetime?: number;
  expirenotifytime?: number;
  remark?: string;
  creater?: string;
  videochannelcount?: number;
  isfree?: number;
  allowedit?: number;
  icon?: number;
  stared?: number;
  loginame?: string;
}

// GP51DeviceData interface for import operations
export interface GP51DeviceData {
  deviceid: string;
  devicename: string;
  devicetype: number;
  isfree?: number;
  lastactivetime?: number;
  lastUpdate: string;
  simnum?: string;
  groupid?: number;
  groupname?: string;
  status?: string;
  online?: boolean;
}

// Updated GP51Position with all required properties
export interface GP51Position {
  deviceid: string;
  callat: number;
  callon: number;
  speed?: number;
  course?: number;
  altitude?: number;
  devicetime?: string;
  servertime?: string;
  status?: number;
  moving?: boolean;
  gotsrc?: number;
  battery?: number;
  signal?: number;
  satellites?: number;
  totaldistance?: number;
  strstatus?: string;
  strstatusen?: string;
  alarm?: number;
  alarmtype?: string;
  alarmtypeen?: string;
  address?: string;
  addressen?: string;
  geoaddr?: string;
  geoaddrfrom?: string;
  accuracyvalue?: number;
  location?: any;
  temperature?: number;
  humidity?: number;
  pressure?: number;
  fuel?: number;
  engine?: any;
  door?: any;
  air_condition?: any;
  custom_data?: any;
  raw_data?: any;
  latitude?: number;
  longitude?: number;
  updatetime?: string;
}

// Updated GP51HealthStatus with all required properties
export interface GP51HealthStatus {
  status: 'healthy' | 'unhealthy' | 'connected' | 'disconnected' | 'error' | 'testing';
  isHealthy: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'testing';
  isConnected: boolean;
  lastPingTime: Date;
  responseTime: number;
  tokenValid: boolean;
  sessionValid: boolean;
  activeDevices: number;
  errorMessage?: string;
  lastCheck: Date;
  connectionQuality: 'excellent' | 'good' | 'poor';
  errorCount: number;
  lastError?: string;
  md5TestPassed: boolean;
  success: boolean;
  error?: string;
}

// GP51FleetData interface with success properties
export interface GP51FleetData {
  devices: GP51Device[];
  positions: GP51Position[];
  groups: GP51Group[];
  summary: {
    totalDevices: number;
    activeDevices: number;
    totalGroups: number;
  };
  lastUpdate: Date;
  metadata: {
    requestId: string;
    responseTime: number;
    dataVersion: string;
    source: string;
    options?: GP51FleetDataOptions;
    fetchTime: Date;
  };
}

// GP51FleetDataResponse for service methods
export interface GP51FleetDataResponse {
  success: boolean;
  data?: GP51FleetData;
  error?: string;
}

// GP51ConnectionTestResult interface
export interface GP51ConnectionTestResult {
  success: boolean;
  message: string;
  timestamp: Date;
  error?: string;
  data?: any;
}

// GP51ConnectionTesterProps interface
export interface GP51ConnectionTesterProps {
  onStatusChange?: (status: GP51ConnectionTestResult) => void;
}

// AnalyticsHookReturn interface
export interface AnalyticsHookReturn {
  data: RealAnalyticsData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  
  // Additional properties for compatibility
  analyticsData?: RealAnalyticsData | null;
  loading?: boolean;
  lastUpdated?: string;
  refreshData?: () => void;
}

export interface VehicleData {
  id: string;
  device_id: string;
  gp51_device_id: string;
  device_name: string;
  name: string;
  user_id: string;
  sim_number: string;
  created_at: string;
  updated_at: string;
  vin?: string;
  license_plate?: string;
  is_active: boolean;
  last_position?: {
    latitude: number;
    longitude: number;
    speed: number;
    course: number;
    timestamp: string;
  };
  status: string;
  isOnline: boolean;
  isMoving: boolean;
  alerts: any[];
  lastUpdate: Date;
}

export class GP51PropertyMapper {
  static enhanceGroup(group: GP51Group): any {
    return {
      ...group,
      id: group.id || group.groupid,
      group_name: group.group_name || group.groupname,
      group_id: group.group_id || group.groupid,
      device_count: group.device_count || group.devicecount || (group.devices?.length || 0),
      last_sync_at: group.last_sync_at || new Date().toISOString()
    };
  }
}
