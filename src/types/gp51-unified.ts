
export interface GP51HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded' | 'connected' | 'disconnected' | 'error' | 'testing';
  isHealthy: boolean;
  connectionStatus: string;
  isConnected: boolean;
  lastPingTime: Date;
  responseTime: number;
  tokenValid: boolean;
  sessionValid: boolean;
  activeDevices: number;
  errorMessage?: string;
  lastCheck: Date;
  // Additional properties for compatibility
  connectionQuality?: 'excellent' | 'good' | 'poor';
  errorCount?: number;
  lastError?: string;
  md5TestPassed?: boolean;
  success?: boolean;
  error?: string;
  message?: string; // Added for compatibility
}

export interface GP51Device {
  deviceid: string;
  devicename: string;
  devicetype: string;
  groupid: string;
  groupname: string;
  imei: string;
  simcardno: string;
  status: number;
  createtime: string;
  lastactivetime: string;
  isOnline: boolean;
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

export interface GP51Position {
  deviceid: string;
  callat: number;
  callon: number;
  speed: number;
  course: number;
  altitude: number;
  devicetime: string;
  servertime: string;
  status: number;
  moving: boolean;
  gotsrc: number;
  battery: number;
  signal: number;
  satellites: number;
  totaldistance: number;
  strstatus: string;
  strstatusen: string;
  alarm: number;
  alarmtype: string;
  alarmtypeen: string;
  address: string;
  addressen: string;
  geoaddr: string;
  geoaddrfrom: string;
  accuracyvalue: number;
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
  // Additional properties for compatibility
  latitude?: number;
  longitude?: number;
  updatetime?: string;
}

export interface GP51Group {
  groupid: string;
  groupname: string;
  parentgroupid: string;
  level: number;
  devicecount: number;
  children: any[];
  // Additional properties for compatibility
  remark?: string;
  devices?: GP51Device[];
}

export interface GP51AuthResponse {
  status: number;
  cause: string;
  success: boolean;
  token?: string;
  expiresAt?: string;
  sessionId?: string;
  username?: string;
  loginTime?: string;
  error?: string; // Added for compatibility
}

export interface GP51Session {
  id: string;
  user_id: string;
  gp51_token: string;
  gp51_username: string;
  created_at: string;
  expires_at: string;
  is_active: boolean;
}

export interface GP51SessionRPCResponse {
  id: string;
  user_id: string;
  gp51_token: string;
  gp51_username: string;
  created_at: string;
  expires_at: string;
  is_active: boolean;
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
  raw_data: any;
}

export interface GP51DeviceTreeResponse {
  status: number;
  cause: string;
  groups: any[];
}

export interface GP51ProcessResult {
  success: boolean;
  message?: string;
  data?: any;
}

export interface GP51TestResult {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
  name?: string; // Added for compatibility
  responseTime?: number; // Added for compatibility
  timestamp: Date; // Added for compatibility
}

export interface GP51LiveVehiclesResponse {
  success: boolean;
  data?: any[];
  groups?: any;
  error?: string;
}

export interface GP51TelemetryData {
  timestamp: Date;
  deviceId: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  altitude: number;
  batteryLevel: number;
  signalStrength: number;
}

export interface GP51ProcessedPosition {
  deviceId: string;
  position: {
    latitude: number;
    longitude: number;
  };
  speed: number;
  course: number;
  lastUpdate: Date;
  // Additional properties for compatibility
  isOnline?: boolean;
  isMoving?: boolean;
  timestamp?: Date;
  latitude?: number;
  longitude?: number;
  deviceName?: string;
}

export interface GP51PerformanceMetrics {
  responseTime: number;
  successRate: number;
  requestsPerMinute: number;
  errorRate: number;
  lastUpdate: Date;
  uptime: number;
  // Additional properties for compatibility
  averageResponseTime?: number;
  dataQuality?: number;
  onlinePercentage?: number;
  totalVehicles?: number;
  activeVehicles?: number;
  activeDevices?: number;
  utilizationRate?: number;
  deviceCount?: number;
  movingVehicles?: number;
  lastUpdateTime?: Date;
}

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
    options?: any;
    fetchTime: Date;
  };
}

export interface GP51FleetDataOptions {
  groupFilter?: (string | number)[];
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
  includeInactive?: boolean;
  includePositions?: boolean; // Added for compatibility
}

export interface GP51LiveData {
  positions: GP51Position[];
  lastUpdate: Date;
  filter(predicate: (item: GP51Position) => boolean): GP51Position[];
  readonly length: number;
}

export interface RealAnalyticsData {
  totalUsers: number;
  activeUsers: number;
  totalVehicles: number;
  activeVehicles: number;
  recentActivity: {
    type: "vehicle_online" | "alert";
    message: string;
    timestamp: Date;
    vehicleId?: string;
    percentageChange?: number;
  }[];
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
    apiStatus: "healthy" | "down";
    lastUpdate: Date;
    responseTime: number;
  };
  performance: {
    averageSpeed: number;
    totalDistance: number;
    fuelEfficiency?: number;
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
    status: "success" | "error";
  };
}

export interface GP51ConnectionTestResult {
  success: boolean;
  message: string;
  error?: string;
  data?: GP51HealthStatus;
  timestamp: Date;
}

// Additional interfaces for compatibility
export interface GP51ConnectionTesterProps {
  onTestComplete?: (result: GP51ConnectionTestResult) => void;
}

export interface GP51DeviceData {
  deviceid: string;
  devicename: string;
  status: string;
  lastUpdate: Date;
}

export interface AnalyticsHookReturn {
  data: RealAnalyticsData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export class GP51PropertyMapper {
  static enhancePosition(position: GP51Position): GP51ProcessedPosition {
    return {
      deviceId: position.deviceid,
      position: {
        latitude: position.callat,
        longitude: position.callon
      },
      speed: position.speed,
      course: position.course,
      lastUpdate: new Date(position.updatetime || position.servertime || Date.now()),
      isOnline: position.moving,
      isMoving: position.moving,
      timestamp: new Date(position.updatetime || position.servertime || Date.now()),
      latitude: position.callat,
      longitude: position.callon,
      deviceName: position.deviceid
    };
  }

  static enhanceGroup(group: GP51Group): GP51Group {
    return {
      ...group,
      devices: group.devices || [],
      remark: group.remark || ''
    };
  }

  static mapPosition(position: GP51Position): GP51ProcessedPosition {
    return this.enhancePosition(position);
  }
}
