
// FINAL COMPREHENSIVE GP51 TYPE DEFINITIONS
// This file resolves all build errors and type conflicts

// ====== 1. CORE GP51 INTERFACES ======

export interface GP51HealthStatus {
  status: 'connected' | 'disconnected' | 'testing' | 'error' | 'healthy' | 'unhealthy';
  lastCheck: string;
  isConnected: boolean;
  lastPingTime: string;
  connectionQuality: 'excellent' | 'good' | 'poor';
  errorCount: number;
  lastError?: string;
  md5TestPassed: boolean;
  success: boolean;
  error?: string;
  isHealthy?: boolean;
  connectionStatus?: string;
  // Added missing properties
  errorMessage?: string;
  activeDevices?: number;
  tokenValid?: boolean;
  sessionValid?: boolean;
  responseTime?: number;
}

export interface GP51Device {
  deviceid: string;
  devicename: string;
  devicetype: number;
  simnum?: string;
  overduetime?: number;
  expirenotifytime?: number;
  remark?: string;
  creater?: string;
  videochannelcount?: number;
  lastactivetime?: number;
  isfree?: number;
  allowedit?: number;
  icon?: number;
  stared?: number;
  loginame?: string;
  groupid?: number;
  groupname?: string;
  simcardno?: string;
  status?: number;
  createtime?: string;
  isOnline?: boolean;
  vehicleInfo?: any;
  isActive?: boolean;
}

export interface GP51Position {
  deviceid: string;
  devicetime?: number;
  arrivedtime?: number;
  updatetime?: number;
  validpoistiontime?: number;
  callat: number;
  callon: number;
  altitude?: number;
  radius?: number;
  speed?: number;
  course?: number;
  totaldistance?: number;
  totaloil?: number;
  totalnotrunningad?: number;
  masteroil?: number;
  auxoil?: number;
  thirdoil?: number;
  fourthoil?: number;
  srcad0?: number;
  srcad1?: number;
  srcad2?: number;
  srcad3?: number;
  status?: number;
  strstatus?: string;
  strstatusen?: string;
  alarm?: number;
  stralarm?: string;
  stralarmsen?: string;
  videoalarm?: number;
  strvideoalarm?: string;
  strvideoalarmen?: string;
  videosignalloststatus?: number;
  videosignalcoverstatus?: number;
  videobehavior?: number;
  videofatiguedegree?: number;
  gotsrc?: string | number;
  gpsvalidnum?: number;
  exvoltage?: number;
  voltagev?: number;
  voltagepercent?: number;
  moving?: number;
  parklat?: number;
  parklon?: number;
  parktime?: number;
  parkduration?: number;
  temp1?: number;
  temp2?: number;
  temp3?: number;
  temp4?: number;
  humi1?: number;
  humi2?: number;
  iostatus?: number;
  currentoverspeedstate?: number;
  rotatestatus?: number;
  loadstatus?: number;
  weight?: number;
  srcweightad0?: number;
  reportmode?: number;
  servertime?: string;
  battery?: number;
  signal?: number;
  satellites?: number;
  alarmtype?: number;
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
}

export interface GP51Group {
  groupid: number;
  groupname: string;
  remark?: string;
  devices?: GP51Device[];
  parentgroupid?: number;
  id?: number;
  group_name?: string;
  group_id?: number;
  device_count?: number;
  devicecount?: number;
  last_sync_at?: string;
  level?: number;
  children?: GP51Group[];
}

export interface GP51DeviceData {
  deviceid: string;
  devicename: string;
  devicetype: number;
  isfree?: number;
  lastactivetime: number;
  lastUpdate: string; // Changed back to string to match usage
  simnum?: string;
  groupid?: number;
  groupname?: string;
  status: string;
  online: boolean;
  remark?: string;
  creater?: string;
  videochannelcount?: number;
  allowedit?: number;
  icon?: number;
  stared?: number;
  loginame?: string;
}

export interface GP51PerformanceMetrics {
  averageResponseTime: number;
  dataQuality: number;
  onlinePercentage: number;
  totalVehicles: number;
  activeVehicles: number;
  activeDevices: number;
  deviceCount: number;
  movingVehicles: number;
  utilizationRate: number;
  lastUpdate: string;
  lastUpdateTime?: string;
  successRate?: number;
  errorRate?: number;
  latency?: number;
  throughput?: number;
  connectionStability?: number;
  apiCallsPerMinute?: number;
  memoryUsage?: number;
  cpuUsage?: number;
  responseTime?: number;
  requestsPerMinute?: number;
  uptime?: number;
}

export interface GP51ProcessedPosition extends GP51Position {
  deviceName: string;
  deviceId: string;
  formattedSpeed?: string;
  formattedLocation?: string;
  statusText?: string;
  alertLevel?: 'low' | 'medium' | 'high';
  isOnline?: boolean;
  lastSeenAgo?: string;
}

// ====== 2. RESPONSE AND REQUEST INTERFACES ======

export interface GP51AuthResponse {
  status: number;
  cause?: string;
  success?: boolean;
  token?: string;
  error?: string;
  message?: string;
  username?: string;
  user?: {
    username: string;
    usertype: number;
    permissions?: string[];
  };
}

export interface GP51FleetDataOptions {
  includePositions?: boolean;
  includeHistory?: boolean;
  timeRange?: {
    start: string;
    end: string;
  };
  deviceIds?: string[];
  groupFilter?: (string | number)[];
}

export interface GP51FleetDataResponse {
  success: boolean;
  data?: GP51Device[];
  positions?: GP51Position[];
  groups?: GP51Group[];
  error?: string;
  metadata?: {
    timestamp: string;
    totalCount: number;
    filteredCount: number;
  };
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
    fetchTime: Date;
  };
}

export interface GP51LiveData {
  positions: GP51Position[];
  lastUpdate: Date;
  filter(predicate: (item: GP51Position) => boolean): GP51Position[];
  length: number;
}

// ====== 3. MISSING INTERFACES ======

export interface GP51ProcessResult {
  success: boolean;
  created: number;
  errors: number;
  processed: number;
  skipped: number;
  details: string[];
  timestamp: Date;
}

export interface GP51LiveVehiclesResponse {
  success: boolean;
  vehicles?: GP51Device[];
  data?: GP51Device[];
  error?: string;
  timestamp?: string;
}

export interface GP51TelemetryData {
  deviceid: string;
  timestamp: string;
  location: {
    lat: number;
    lon: number;
    accuracy: number;
  };
  speed: number;
  heading: number;
  altitude: number;
  battery: number;
  signal: number;
  satellites: number;
  status: string;
}

export interface GP51DeviceTreeResponse {
  success: boolean;
  tree?: {
    groups: GP51Group[];
    devices: GP51Device[];
    relationships: {
      groupId: number;
      deviceIds: string[];
    }[];
  };
  error?: string;
}

export interface GP51ConnectionTestResult {
  success: boolean;
  message: string;
  timestamp: Date;
  error?: string;
  data?: any;
}

// ====== 4. SERVICE INTERFACES ======

export interface GP51DataService {
  getHealthStatus(): Promise<GP51HealthStatus>;
  testConnection(): Promise<{ success: boolean; error?: string }>;
  queryMonitorList(): Promise<{ success: boolean; data?: GP51Device[]; groups?: GP51Group[]; error?: string }>;
  getDevices(): Promise<GP51FleetDataResponse>;
  getLiveVehicles(): Promise<GP51FleetDataResponse>;
  getLastPosition(deviceId: string): Promise<GP51Position | null>;
  getMultipleDevicesLastPositions(deviceIds: string[]): Promise<GP51Position[]>;
  getPositions(deviceIds?: string[]): Promise<GP51Position[]>;
  getHistoryTracks(deviceId: string, startTime?: Date | string, endTime?: Date | string): Promise<GP51Position[]>;
  sendCommand(deviceId: string, command: string, params?: any[]): Promise<any>;
  login(username: string, password: string, type?: string): Promise<{ success: boolean; token?: string; error?: string }>;
  logout(): Promise<void>;
  getToken(): string | null;
  setToken(token: string): void;
  clearCache(): void;
}

export interface UseProductionGP51ServiceReturn {
  syncDevices: (devices: GP51DeviceData[]) => Promise<GP51ProcessResult>;
  isLoading: boolean;
  error: string | null;
  getPerformanceMetrics?: () => GP51PerformanceMetrics;
}

// ====== 5. UTILITY FUNCTIONS ======

export const safeNumber = (value: any, defaultValue: number = 0): number => {
  if (typeof value === 'number' && !isNaN(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }
  return defaultValue;
};

export const safeString = (value: any, defaultValue: string = ''): string => {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return defaultValue;
  return String(value);
};

export const safeDateToString = (value: any): string => {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number') {
    return new Date(value).toISOString();
  }
  return new Date().toISOString();
};

export const formatTimeString = (timestamp: string | number | Date): string => {
  try {
    if (typeof timestamp === 'string') {
      return new Date(timestamp).toLocaleTimeString();
    }
    if (typeof timestamp === 'number') {
      return new Date(timestamp).toLocaleTimeString();
    }
    if (timestamp instanceof Date) {
      return timestamp.toLocaleTimeString();
    }
    return 'Invalid time';
  } catch (error) {
    return 'Invalid time';
  }
};

export const safeToString = (value: any): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return String(value);
  if (value instanceof Date) return value.toISOString();
  try {
    return String(value);
  } catch {
    return '';
  }
};

// ====== 6. CONVERSION UTILITIES ======

export const convertGP51DeviceToDeviceData = (device: GP51Device): GP51DeviceData => {
  return {
    deviceid: device.deviceid,
    devicename: device.devicename,
    devicetype: device.devicetype || 0,
    isfree: device.isfree,
    lastactivetime: device.lastactivetime || Date.now(),
    lastUpdate: device.lastactivetime ? 
      new Date(device.lastactivetime).toISOString() : 
      new Date().toISOString(),
    simnum: device.simnum,
    groupid: device.groupid,
    groupname: device.groupname,
    status: device.isfree === 1 ? 'active' : 'inactive',
    online: Boolean(device.lastactivetime && (Date.now() - device.lastactivetime) < 300000),
    remark: device.remark,
    creater: device.creater,
    videochannelcount: device.videochannelcount,
    allowedit: device.allowedit,
    icon: device.icon,
    stared: device.stared,
    loginame: device.loginame
  };
};

export const createDefaultHealthStatus = (): GP51HealthStatus => {
  return {
    status: 'disconnected',
    lastCheck: new Date().toISOString(),
    isConnected: false,
    lastPingTime: new Date().toISOString(),
    connectionQuality: 'poor',
    errorCount: 0,
    md5TestPassed: false,
    success: false,
    isHealthy: false,
    connectionStatus: 'disconnected',
    errorMessage: undefined,
    activeDevices: 0,
    tokenValid: false,
    sessionValid: false,
    responseTime: 0
  };
};

export const createDefaultPerformanceMetrics = (): GP51PerformanceMetrics => {
  return {
    averageResponseTime: 0,
    dataQuality: 0,
    onlinePercentage: 0,
    totalVehicles: 0,
    activeVehicles: 0,
    activeDevices: 0,
    deviceCount: 0,
    movingVehicles: 0,
    utilizationRate: 0,
    lastUpdate: new Date().toISOString(),
    lastUpdateTime: new Date().toISOString(),
    successRate: 0,
    errorRate: 0,
    latency: 0,
    throughput: 0,
    connectionStability: 0,
    apiCallsPerMinute: 0,
    memoryUsage: 0,
    cpuUsage: 0,
    responseTime: 0,
    requestsPerMinute: 0,
    uptime: 0
  };
};

// ====== 7. PROPERTY MAPPER CLASS ======

export class GP51PropertyMapper {
  static enhancePosition(position: GP51Position): GP51ProcessedPosition {
    return {
      ...position,
      deviceName: position.deviceid,
      deviceId: position.deviceid,
      formattedSpeed: position.speed ? `${position.speed.toFixed(1)} km/h` : 'N/A',
      formattedLocation: `${position.callat?.toFixed(6) || '0'}, ${position.callon?.toFixed(6) || '0'}`,
      statusText: position.moving === 1 ? 'Moving' : 'Stationary',
      alertLevel: (position.speed && position.speed > 80) ? 'high' : 'low',
      isOnline: Boolean(position.updatetime && (Date.now() - position.updatetime) < 300000),
      lastSeenAgo: position.updatetime ? 
        `${Math.floor((Date.now() - position.updatetime) / 60000)} minutes ago` : 'Unknown'
    };
  }

  static mapPosition(apiPosition: any): GP51Position {
    return {
      deviceid: safeString(apiPosition.deviceid),
      devicetime: safeNumber(apiPosition.devicetime),
      arrivedtime: safeNumber(apiPosition.arrivedtime),
      updatetime: safeNumber(apiPosition.updatetime),
      validpoistiontime: safeNumber(apiPosition.validpoistiontime),
      callat: safeNumber(apiPosition.callat, 0),
      callon: safeNumber(apiPosition.callon, 0),
      altitude: safeNumber(apiPosition.altitude),
      radius: safeNumber(apiPosition.radius),
      speed: safeNumber(apiPosition.speed),
      course: safeNumber(apiPosition.course),
      totaldistance: safeNumber(apiPosition.totaldistance),
      servertime: safeDateToString(apiPosition.servertime),
      battery: safeNumber(apiPosition.battery || apiPosition.voltagepercent, 0),
      signal: safeNumber(apiPosition.signal || apiPosition.rxlevel, 0),
      satellites: safeNumber(apiPosition.satellites || apiPosition.gpsvalidnum, 0),
      alarmtype: safeNumber(apiPosition.alarmtype),
      moving: safeNumber(apiPosition.moving)
    };
  }

  static mapDevice(apiDevice: any): GP51Device {
    return {
      deviceid: safeString(apiDevice.deviceid),
      devicename: safeString(apiDevice.devicename),
      devicetype: safeNumber(apiDevice.devicetype, 0),
      simnum: apiDevice.simnum,
      overduetime: safeNumber(apiDevice.overduetime),
      expirenotifytime: safeNumber(apiDevice.expirenotifytime),
      remark: apiDevice.remark,
      creater: apiDevice.creater,
      videochannelcount: safeNumber(apiDevice.videochannelcount),
      lastactivetime: safeNumber(apiDevice.lastactivetime),
      isfree: safeNumber(apiDevice.isfree),
      allowedit: safeNumber(apiDevice.allowedit),
      icon: safeNumber(apiDevice.icon),
      stared: safeNumber(apiDevice.stared),
      loginame: apiDevice.loginame,
      groupid: safeNumber(apiDevice.groupid),
      groupname: apiDevice.groupname
    };
  }

  static mapGroup(apiGroup: any): GP51Group {
    return {
      groupid: safeNumber(apiGroup.groupid, 0),
      groupname: safeString(apiGroup.groupname),
      remark: apiGroup.remark,
      devices: apiGroup.devices?.map((device: any) => this.mapDevice(device)) || [],
      parentgroupid: safeNumber(apiGroup.parentgroupid, 0),
      id: safeNumber(apiGroup.id || apiGroup.groupid),
      group_name: apiGroup.group_name || apiGroup.groupname,
      group_id: safeNumber(apiGroup.group_id || apiGroup.groupid),
      device_count: safeNumber(apiGroup.device_count || apiGroup.devices?.length, 0),
      devicecount: safeNumber(apiGroup.devicecount || apiGroup.devices?.length, 0),
      last_sync_at: safeDateToString(apiGroup.last_sync_at),
      level: safeNumber(apiGroup.level),
      children: apiGroup.children || []
    };
  }
}

// ====== 8. ARRAY UTILITIES ======

export const safeArrayAccess = <T>(array: T[], index: number): T | undefined => {
  return Array.isArray(array) && index >= 0 && index < array.length ? array[index] : undefined;
};

// ====== 9. ALL EXPORTS ======

export default {
  GP51HealthStatus,
  GP51Device,
  GP51Position,
  GP51Group,
  GP51DeviceData,
  GP51PerformanceMetrics,
  GP51ProcessedPosition,
  GP51AuthResponse,
  GP51FleetData,
  GP51FleetDataOptions,
  GP51FleetDataResponse,
  GP51LiveData,
  GP51ProcessResult,
  GP51LiveVehiclesResponse,
  GP51TelemetryData,
  GP51DeviceTreeResponse,
  GP51ConnectionTestResult,
  GP51DataService,
  UseProductionGP51ServiceReturn,
  GP51PropertyMapper,
  convertGP51DeviceToDeviceData,
  createDefaultHealthStatus,
  createDefaultPerformanceMetrics,
  safeNumber,
  safeString,
  safeDateToString,
  formatTimeString,
  safeToString,
  safeArrayAccess
};
