
// Remove the problematic crypto import since it's not used and causes issues in browser
// import crypto from 'crypto';

// Core GP51 API Types
export interface GP51AuthResult {
  status: number;
  cause: string;
  token?: string;
}

export interface GP51AuthResponse extends GP51AuthResult {
  success: boolean;
  error?: string;
  userInfo?: {
    username: string;
    usertype: number;
    permissions: string[];
  };
}

export interface GP51Device {
  deviceid: string;
  devicename: string;
  devicetype: number;
  simnum?: string;
  overduetime?: number;
  expirenotifytime?: number;
  remark?: string;
  creater: string;
  videochannelcount?: number;
  lastactivetime?: number;
  isfree: number;
  allowedit: number;
  icon: number;
  stared: number;
  loginame?: string;
  
  // Additional computed properties for compatibility
  deviceId?: string;
  deviceName?: string;
  lastActiveTime?: number;
  isActive?: boolean;
}

// Alias for backwards compatibility
export interface GP51DeviceData extends GP51Device {
  // Additional computed properties
  isOnline?: boolean;
  lastSeen?: Date;
  connectionStatus?: 'online' | 'offline' | 'moving' | 'parked';
}

export interface GP51Group {
  groupid: number;
  groupname: string;
  remark?: string;
  devices: GP51Device[];
  
  // Computed properties for compatibility
  id?: number;
  group_name?: string;
  group_id?: number;
  device_count?: number;
  last_sync_at?: Date;
}

export interface GP51DeviceTreeResponse {
  status: number;
  cause: string;
  groups: GP51Group[];
}

// Alias for backwards compatibility
export interface GP51ServiceResponse extends GP51DeviceTreeResponse {}

export interface GP51Position {
  deviceid: string;
  devicetime: number;
  arrivedtime: number;
  updatetime: number;
  validpoistiontime: number;
  callat: number; // latitude
  callon: number; // longitude
  altitude: number;
  radius: number;
  speed: number;
  course: number;
  totaldistance: number;
  status: number;
  strstatus: string;
  strstatusen: string;
  alarm: number;
  stralarm: string;
  stralarmsen: string;
  gotsrc: string;
  rxlevel: number;
  gpsvalidnum: number;
  exvoltage: number;
  voltagev: number;
  voltagepercent: number;
  moving: number;
  parklat: number;
  parklon: number;
  parktime: number;
  parkduration: number;
  temp1: number;
  temp2: number;
  temp3: number;
  temp4: number;
  iostatus: number;
  currentoverspeedstate: number;
  rotatestatus: number;
  loadstatus: number;
  weight: number;
  reportmode: number;
  
  // Computed properties for compatibility
  deviceId?: string;
  latitude?: number;
  longitude?: number;
  timestamp?: Date;
  isOnline?: boolean;
  isMoving?: boolean;
  statusText?: string;
}

export interface GP51LastPositionResponse {
  status: number;
  cause: string;
  lastquerypositiontime: number;
  records: GP51Position[];
}

export interface GP51HealthStatus {
  status: 'healthy' | 'failed' | 'warning';
  lastCheck: Date;
  responseTime?: number;
  isConnected: boolean;
  lastPingTime: Date;
  tokenValid: boolean;
  sessionValid: boolean;
  activeDevices: number;
  errorMessage?: string;
  errors?: string[];
  isHealthy: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'error';
}

export interface GP51ConnectionTestResult {
  success: boolean;
  message: string;
  error?: string;
  data?: any;
  responseTime?: number;
  timestamp?: Date;
}

export interface GP51TestResult {
  success: boolean;
  testType: string;
  message: string;
  duration: number;
  errors?: string[];
  data?: any;
}

export interface GP51PerformanceMetrics {
  totalVehicles: number;
  activeVehicles: number;
  activeDevices: number;
  lastUpdateTime: Date;
  averageResponseTime: number;
  errorRate: number;
  dataQuality: number;
  onlinePercentage: number;
  utilizationRate: number;
  
  // Additional properties needed by components
  responseTime: number;
  success: boolean;
  requestStartTime: string;
  deviceCount: number;
  groupCount: number;
  timestamp: string;
  apiCallCount: number;
  movingVehicles: number;
  stoppedVehicles: number;
}

export interface GP51ProcessedPosition {
  deviceId: string;
  deviceName: string;
  latitude: number;
  longitude: number;
  altitude: number;
  speed: number;
  heading: number;
  timestamp: Date;
  isMoving: boolean;
  status: string;
  accuracy: number;
  signal: number;
  battery?: number;
  fuel?: number;
}

export interface GP51ProcessResult {
  success: boolean;
  processed: number;
  failed: number;
  errors: string[];
  data: GP51ProcessedPosition[];
}

export interface GP51LiveVehiclesResponse {
  status: number;
  cause: string;
  vehicles: Array<{
    deviceid: string;
    name: string;
    position: GP51Position;
    isOnline: boolean;
    lastSeen: Date;
  }>;
}

export interface GP51TelemetryData {
  deviceId: string;
  timestamp: Date;
  position: {
    latitude: number;
    longitude: number;
    altitude: number;
    accuracy: number;
  };
  motion: {
    speed: number;
    heading: number;
    isMoving: boolean;
  };
  vehicle: {
    odometer: number;
    fuel?: number;
    engine?: boolean;
    ignition?: boolean;
  };
  sensors: {
    temperature?: number[];
    voltage: number;
    signal: number;
  };
  status: {
    alarms: string[];
    errors: string[];
    warnings: string[];
  };
}

// Analytics Types
export interface RealAnalyticsData {
  totalUsers: number;
  activeUsers: number;
  totalVehicles: number;
  activeVehicles: number;
  gp51Status: GP51HealthStatus;
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
    apiStatus: 'healthy' | 'degraded' | 'down';
    lastUpdate: Date;
    responseTime: number;
  };
  recentActivity: Array<{
    type: 'vehicle_online' | 'vehicle_offline' | 'alert' | 'maintenance';
    message: string;
    timestamp: Date;
    vehicleId?: string;
    percentageChange?: number;
  }>;
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
    status: 'success' | 'pending' | 'error';
  };
}

// Enhanced Fleet Data Types
export interface EnhancedVehicleData {
  deviceid: string;
  devicename: string;
  devicetype: number;
  status: 'active' | 'inactive' | 'expired' | 'overdue';
  connectionStatus: 'online' | 'offline' | 'moving' | 'parked';
  lastSeen: Date;
  position?: {
    latitude: number;
    longitude: number;
    speed: number;
    heading: number;
    altitude: number;
    accuracy: number;
    address?: string;
  };
  stats?: {
    totalDistance: number;
    fuelLevel?: number;
    temperature?: number[];
    voltage: number;
    signalStrength: number;
  };
  alerts?: string[];
}

export interface FleetGroup {
  groupid: number;
  groupname: string;
  remark?: string;
  deviceCount: number;
  activeCount: number;
  onlineCount: number;
  devices: EnhancedVehicleData[];
}

export interface FleetSummary {
  totalDevices: number;
  activeDevices: number;
  onlineDevices: number;
  movingDevices: number;
  parkedDevices: number;
  groups: number;
}

export interface CompleteFleetData {
  summary: FleetSummary;
  groups: FleetGroup[];
  lastUpdate: Date;
}

// Backwards compatibility aliases
export interface GPS51Device extends GP51Device {}
export interface GPS51TestResult extends GP51TestResult {}

// Property mapping utilities
export class GP51PropertyMapper {
  static mapPosition(position: GP51Position): GP51ProcessedPosition {
    return {
      deviceId: position.deviceid,
      deviceName: '',
      latitude: position.callat,
      longitude: position.callon,
      altitude: position.altitude,
      speed: position.speed,
      heading: position.course,
      timestamp: new Date(position.updatetime),
      isMoving: position.moving === 1,
      status: position.strstatusen || position.strstatus,
      accuracy: position.radius,
      signal: position.rxlevel,
      battery: position.voltagepercent > 0 ? position.voltagepercent : undefined
    };
  }

  static enhancePosition(position: GP51Position): GP51Position & {
    deviceId: string;
    latitude: number;
    longitude: number;
    timestamp: Date;
    isOnline: boolean;
    isMoving: boolean;
    statusText: string;
  } {
    const now = Date.now();
    const lastUpdate = position.updatetime || 0;
    const minutesAgo = (now - lastUpdate) / (1000 * 60);
    
    return {
      ...position,
      deviceId: position.deviceid,
      latitude: position.callat,
      longitude: position.callon,
      timestamp: new Date(position.updatetime),
      isOnline: minutesAgo <= 60,
      isMoving: position.moving === 1,
      statusText: position.strstatusen || position.strstatus || 'Unknown'
    };
  }

  static enhanceGroup(group: GP51Group): GP51Group & {
    id: number;
    group_name: string;
    group_id: number;
    device_count: number;
    last_sync_at: Date;
  } {
    return {
      ...group,
      id: group.groupid,
      group_name: group.groupname,
      group_id: group.groupid,
      device_count: group.devices.length,
      last_sync_at: new Date()
    };
  }

  static enhanceDevice(device: GP51Device, position?: GP51Position): GP51DeviceData {
    const isOnline = position ? this.enhancePosition(position).isOnline : false;
    
    return {
      ...device,
      deviceId: device.deviceid,
      deviceName: device.devicename,
      lastActiveTime: device.lastactivetime,
      isActive: device.isfree === 1 || device.isfree === 2,
      isOnline,
      lastSeen: position ? new Date(position.updatetime) : new Date(device.lastactivetime || 0),
      connectionStatus: position && isOnline 
        ? (position.moving === 1 ? 'moving' : 'parked')
        : 'offline'
    };
  }
}
