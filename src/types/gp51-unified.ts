
// UNIFIED GP51 TYPE DEFINITIONS
// Complete interfaces with all required exports

// ====== 1. CORE GP51 INTERFACES ======

export interface GP51HealthStatus {
  status: 'connected' | 'disconnected' | 'testing' | 'error';
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
  isActive?: boolean;
  isOnline?: boolean;
  simcardno?: string;
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
  gotsrc?: string;
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
}

export interface GP51DeviceData {
  deviceid: string;
  devicename: string;
  devicetype: number;
  isfree?: number;
  lastactivetime: number;
  lastUpdate: string;
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

// ====== 2. MISSING EXPORT INTERFACES ======

export interface GP51FleetDataOptions {
  includePositions?: boolean;
  includeHistory?: boolean;
  timeRange?: {
    start: string;
    end: string;
  };
  deviceIds?: string[];
  groupFilter?: string[];
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

export interface GP51LiveData {
  devices?: GP51Device[];
  positions: GP51Position[];
  lastUpdate: Date;
  isRealTime?: boolean;
  connectionStatus?: 'connected' | 'disconnected' | 'reconnecting';
  filter(predicate: (item: GP51Position) => boolean): GP51Position[];
  get length(): number;
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

// ====== 3. ADDITIONAL INTERFACES ======

export interface RealAnalyticsData {
  totalUsers: number;
  activeUsers: number;
  totalVehicles: number;
  activeVehicles: number;
  
  recentActivity: Array<{
    type: string;
    message: string;
    timestamp: Date;
    vehicleId?: string;
    percentageChange: number;
  }>;
  
  vehicleStatus?: {
    total: number;
    online: number;
    offline: number;
    moving: number;
    parked: number;
  };
  
  fleetUtilization?: {
    activeVehicles: number;
    totalVehicles: number;
    utilizationRate: number;
  };
  
  systemHealth?: {
    apiStatus: string;
    lastUpdate: Date;
    responseTime: number;
  };
  
  performance?: {
    averageSpeed: number;
    totalDistance: number;
    alertCount: number;
    fuelEfficiency?: number;
  };
  
  growth?: {
    newUsers: number;
    newVehicles: number;
    period: string;
    percentageChange: number;
  };
  
  sync?: {
    importedUsers: number;
    importedVehicles: number;
    lastSync: Date;
    status: string;
  };
}

export interface AnalyticsHookReturn {
  data: RealAnalyticsData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  analyticsData: RealAnalyticsData | null;
  loading: boolean;
  lastUpdated: string;
  refreshData: () => Promise<void>;
}

// ====== 4. UTILITY CLASSES ======

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
      deviceid: apiPosition.deviceid || '',
      devicetime: this.safeNumber(apiPosition.devicetime),
      arrivedtime: this.safeNumber(apiPosition.arrivedtime),
      updatetime: this.safeNumber(apiPosition.updatetime),
      validpoistiontime: this.safeNumber(apiPosition.validpoistiontime),
      callat: this.safeNumber(apiPosition.callat, 0),
      callon: this.safeNumber(apiPosition.callon, 0),
      altitude: this.safeNumber(apiPosition.altitude),
      radius: this.safeNumber(apiPosition.radius),
      speed: this.safeNumber(apiPosition.speed),
      course: this.safeNumber(apiPosition.course),
      totaldistance: this.safeNumber(apiPosition.totaldistance),
      servertime: apiPosition.servertime || new Date().toISOString(),
      battery: this.safeNumber(apiPosition.battery || apiPosition.voltagepercent, 0),
      signal: this.safeNumber(apiPosition.signal, 0),
      satellites: this.safeNumber(apiPosition.satellites || apiPosition.gpsvalidnum, 0),
      moving: this.safeNumber(apiPosition.moving)
    };
  }

  static mapDevice(apiDevice: any): GP51Device {
    return {
      deviceid: apiDevice.deviceid || '',
      devicename: apiDevice.devicename || '',
      devicetype: this.safeNumber(apiDevice.devicetype, 0),
      simnum: apiDevice.simnum,
      lastactivetime: this.safeNumber(apiDevice.lastactivetime),
      isfree: this.safeNumber(apiDevice.isfree),
      groupid: this.safeNumber(apiDevice.groupid),
      groupname: apiDevice.groupname,
      remark: apiDevice.remark,
      creater: apiDevice.creater,
      videochannelcount: this.safeNumber(apiDevice.videochannelcount),
      allowedit: this.safeNumber(apiDevice.allowedit),
      icon: this.safeNumber(apiDevice.icon),
      stared: this.safeNumber(apiDevice.stared),
      loginame: apiDevice.loginame
    };
  }

  static mapGroup(apiGroup: any): GP51Group {
    return {
      groupid: this.safeNumber(apiGroup.groupid, 0),
      groupname: apiGroup.groupname || '',
      remark: apiGroup.remark,
      devices: apiGroup.devices?.map((device: any) => this.mapDevice(device)) || [],
      parentgroupid: this.safeNumber(apiGroup.parentgroupid, 0),
      id: this.safeNumber(apiGroup.id || apiGroup.groupid),
      group_name: apiGroup.group_name || apiGroup.groupname,
      group_id: this.safeNumber(apiGroup.group_id || apiGroup.groupid),
      device_count: this.safeNumber(apiGroup.device_count || apiGroup.devices?.length, 0),
      devicecount: this.safeNumber(apiGroup.devicecount || apiGroup.devices?.length, 0),
      last_sync_at: apiGroup.last_sync_at || new Date().toISOString()
    };
  }

  private static safeNumber(value: any, defaultValue: number = 0): number {
    if (typeof value === 'number' && !isNaN(value)) {
      return value;
    }
    
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? defaultValue : parsed;
    }
    
    return defaultValue;
  }
}

// ====== 5. UTILITY FUNCTIONS ======

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
    responseTime: 150,
    requestsPerMinute: 10,
    uptime: 99.9
  };
};

export const safeToString = (value: any): string => {
  if (value === null || value === undefined) return '';
  return String(value);
};

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

// Additional exports that were missing
export interface GP51TestResult {
  success: boolean;
  message: string;
  timestamp: Date;
  testType: string;
  name: string;
  duration: number;
  responseTime: number;
  data?: any;
  error?: string;
}

export interface GP51ConnectionTestResult {
  success: boolean;
  message: string;
  timestamp: Date;
  error?: string;
  data?: any;
}

export interface GP51ConnectionTesterProps {
  onStatusChange?: (result: GP51ConnectionTestResult) => void;
}

export interface GP51AuthResponse {
  status: number;
  token?: string;
  cause?: string;
}
