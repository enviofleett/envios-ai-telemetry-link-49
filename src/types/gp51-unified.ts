// UNIFIED GP51 TYPE DEFINITIONS
// This file resolves all type conflicts and provides complete interfaces

// ====== 1. CORE GP51 TYPES ======

export interface GP51AuthResponse {
  status: number;
  cause: string;
  success: boolean;
  token?: string;
  username?: string;
  error?: string;
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
  vehicleInfo: any;
  isActive: boolean;
  simnum: string;
  overduetime: number;
  expirenotifytime: number;
  remark: string;
  creater: string;
  videochannelcount: number;
  isfree: number;
  allowedit: number;
  icon: number;
  stared: number;
  loginame: string;
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
  location: any;
  temperature: any;
  humidity: any;
  pressure: any;
  fuel: any;
  engine: any;
  door: any;
  air_condition: any;
  custom_data: any;
  raw_data: any;
  latitude: number;
  longitude: number;
  updatetime: any;
  arrivedtime?: string;
  validpoistiontime?: string;
  radius?: number;
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
  stralarm?: string;
  stralarmsen?: string;
  videoalarm?: number;
  strvideoalarm?: string;
  strvideoalarmen?: string;
  videosignalloststatus?: number;
  videosignalcoverstatus?: number;
  videobehavior?: number;
  videofatiguedegree?: number;
  exvoltage?: number;
  voltagev?: number;
  voltagepercent?: number;
  parklat?: number;
  parklon?: number;
  parktime?: string;
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
}

export interface GP51Group {
  groupid: string | number;
  groupname: string;
  parentgroupid: string | number;
  level: number;
  devicecount: number;
  children: any[];
  remark: string;
  devices: GP51Device[];
  id?: number;
  group_name?: string;
  group_id?: string | number;
  device_count?: number;
  last_sync_at?: string;
}

export interface GP51DeviceTreeResponse {
  success: boolean;
  data: GP51Device[];
  groups: GP51Group[];
  error?: string;
}

export interface GP51LiveVehiclesResponse {
  success: boolean;
  data: GP51Device[];
  error?: string;
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

export interface GP51FleetDataResponse {
  success: boolean;
  data?: GP51FleetData;
  error?: string;
}

export interface GP51ProcessResult {
  created: number;
  updated: number;
  deleted: number;
  errors: number;
  success: boolean;
  message?: string;
}

export interface GP51TestResult {
  name: string;
  success: boolean;
  testType: string;
  message: string;
  duration: number;
  responseTime: number;
  timestamp: Date;
  data?: any;
  error?: string;
}

export interface GP51TelemetryData {
  deviceId: string;
  timestamp: Date;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  batteryLevel: number;
  signalStrength: number;
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

export interface GP51ConnectionTestResult {
  success: boolean;
  message: string;
  timestamp: Date;
  data?: any;
  error?: string;
}

export interface GP51ConnectionTesterProps {
  onStatusChange?: (status: GP51ConnectionTestResult) => void;
}

// UPDATED GP51PerformanceMetrics interface with all missing properties
export interface GP51PerformanceMetrics {
  responseTime: number;
  success: boolean;
  requestStartTime: string;
  errorType?: string;
  deviceCount: number;
  groupCount: number;
  timestamp: string;
  apiCallCount: number;
  errorRate: number;
  
  // ADDED - Missing properties that were causing errors
  averageResponseTime: number;
  dataQuality: number;
  onlinePercentage: number;
  totalVehicles: number;
  activeVehicles: number;
  activeDevices: number;
  movingVehicles: number;
  utilizationRate: number;
  lastUpdate: string;
  lastUpdateTime?: string;
  
  // Vehicle movement metrics
  stoppedVehicles: number;
  
  // Additional device metrics
  inactiveDevices?: number;
  onlineDevices?: number;
  offlineDevices?: number;
  
  // Error handling
  error?: string;
}

// UPDATED GP51DeviceData interface to resolve import conflicts
export interface GP51DeviceData {
  deviceid: string;
  devicename: string;
  devicetype: number;
  isfree?: number;
  lastactivetime?: number;
  lastUpdate: string;
  simnum?: string;
  simcardno?: string;
  groupid?: number;
  groupname?: string;
  status: string; // MADE REQUIRED to fix import conflict
  online: boolean;
  remark?: string;
  creater?: string;
  videochannelcount?: number;
  allowedit?: number;
  icon?: number;
  stared?: number;
  loginame?: string;
}

// UPDATED GP51ProcessedPosition interface
export interface GP51ProcessedPosition extends GP51Position {
  deviceName: string; // ADDED - fixes deviceName error
  deviceId: string; // ADDED - alternative to deviceid for compatibility
  formattedSpeed?: string;
  formattedLocation?: string;
  statusText?: string;
  alertLevel?: 'low' | 'medium' | 'high';
  isOnline?: boolean;
  lastSeenAgo?: string;
}

// UPDATED RealAnalyticsData interface
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
    fuelEfficiency?: number; // ADDED - fixes realAnalyticsService error
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

// UPDATED GP51PropertyMapper with missing methods
export class GP51PropertyMapper {
  static enhancePosition(position: GP51Position): GP51ProcessedPosition {
    return {
      ...position,
      deviceName: position.deviceid || '',
      deviceId: position.deviceid || '',
      formattedSpeed: position.speed ? `${position.speed.toFixed(1)} km/h` : 'N/A',
      formattedLocation: `${position.callat?.toFixed(6) || 0}, ${position.callon?.toFixed(6) || 0}`,
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
      devicetime: apiPosition.devicetime,
      arrivedtime: apiPosition.arrivedtime,
      updatetime: apiPosition.updatetime,
      validpoistiontime: apiPosition.validpoistiontime,
      callat: apiPosition.callat || 0,
      callon: apiPosition.callon || 0,
      altitude: apiPosition.altitude,
      radius: apiPosition.radius,
      speed: apiPosition.speed,
      course: apiPosition.course,
      totaldistance: apiPosition.totaldistance,
      totaloil: apiPosition.totaloil,
      totalnotrunningad: apiPosition.totalnotrunningad,
      masteroil: apiPosition.masteroil,
      auxoil: apiPosition.auxoil,
      thirdoil: apiPosition.thirdoil,
      fourthoil: apiPosition.fourthoil,
      srcad0: apiPosition.srcad0,
      srcad1: apiPosition.srcad1,
      srcad2: apiPosition.srcad2,
      srcad3: apiPosition.srcad3,
      status: apiPosition.status,
      strstatus: apiPosition.strstatus,
      strstatusen: apiPosition.strstatusen,
      alarm: apiPosition.alarm,
      stralarm: apiPosition.stralarm,
      stralarmsen: apiPosition.stralarmsen,
      videoalarm: apiPosition.videoalarm,
      strvideoalarm: apiPosition.strvideoalarm,
      strvideoalarmen: apiPosition.strvideoalarmen,
      videosignalloststatus: apiPosition.videosignalloststatus,
      videosignalcoverstatus: apiPosition.videosignalcoverstatus,
      videobehavior: apiPosition.videobehavior,
      videofatiguedegree: apiPosition.videofatiguedegree,
      gotsrc: apiPosition.gotsrc,
      rxlevel: apiPosition.rxlevel,
      gpsvalidnum: apiPosition.gpsvalidnum,
      exvoltage: apiPosition.exvoltage,
      voltagev: apiPosition.voltagev,
      voltagepercent: apiPosition.voltagepercent,
      moving: apiPosition.moving,
      parklat: apiPosition.parklat,
      parklon: apiPosition.parklon,
      parktime: apiPosition.parktime,
      parkduration: apiPosition.parkduration,
      temp1: apiPosition.temp1,
      temp2: apiPosition.temp2,
      temp3: apiPosition.temp3,
      temp4: apiPosition.temp4,
      humi1: apiPosition.humi1,
      humi2: apiPosition.humi2,
      iostatus: apiPosition.iostatus,
      currentoverspeedstate: apiPosition.currentoverspeedstate,
      rotatestatus: apiPosition.rotatestatus,
      loadstatus: apiPosition.loadstatus,
      weight: apiPosition.weight,
      srcweightad0: apiPosition.srcweightad0,
      reportmode: apiPosition.reportmode,
      servertime: apiPosition.servertime || new Date().toISOString(),
      battery: apiPosition.battery || apiPosition.voltagepercent || 0,
      signal: apiPosition.signal || apiPosition.rxlevel || 0,
      satellites: apiPosition.satellites || apiPosition.gpsvalidnum || 0,
      latitude: apiPosition.callat || 0,
      longitude: apiPosition.callon || 0,
      updatetime: apiPosition.updatetime || Date.now()
    };
  }

  static mapDevice(apiDevice: any): GP51Device {
    return {
      deviceid: apiDevice.deviceid || '',
      devicename: apiDevice.devicename || '',
      devicetype: String(apiDevice.devicetype || apiDevice.device_type || '0'),
      groupid: apiDevice.groupid || apiDevice.group_id || '',
      groupname: apiDevice.groupname || apiDevice.group_name || '',
      imei: apiDevice.imei || '',
      simcardno: apiDevice.simcardno || apiDevice.sim_card_no || '',
      status: apiDevice.status || 0,
      createtime: apiDevice.createtime || apiDevice.create_time || new Date().toISOString(),
      lastactivetime: apiDevice.lastactivetime || apiDevice.last_active_time || new Date().toISOString(),
      isOnline: apiDevice.isOnline || apiDevice.is_online || false,
      vehicleInfo: apiDevice.vehicleInfo || apiDevice.vehicle_info || null,
      isActive: apiDevice.isActive || apiDevice.is_active || false,
      // Additional properties for compatibility
      simnum: apiDevice.simnum || apiDevice.sim_card_no || '',
      overduetime: apiDevice.overduetime || 0,
      expirenotifytime: apiDevice.expirenotifytime || 0,
      remark: apiDevice.remark || '',
      creater: apiDevice.creater || '',
      videochannelcount: apiDevice.videochannelcount || 0,
      isfree: apiDevice.isfree || 0,
      allowedit: apiDevice.allowedit || 0,
      icon: apiDevice.icon || 0,
      stared: apiDevice.stared || 0,
      loginame: apiDevice.loginame || ''
    };
  }

  static mapGroup(apiGroup: any): GP51Group {
    return {
      groupid: apiGroup.groupid || apiGroup.group_id || '',
      groupname: apiGroup.groupname || apiGroup.group_name || '',
      parentgroupid: apiGroup.parentgroupid || apiGroup.parent_group_id || '',
      level: apiGroup.level || 0,
      devicecount: apiGroup.devicecount || apiGroup.device_count || 0,
      children: apiGroup.children || [],
      remark: apiGroup.remark || '',
      devices: apiGroup.devices || [],
      id: apiGroup.id || apiGroup.groupid,
      group_name: apiGroup.group_name || apiGroup.groupname,
      group_id: apiGroup.group_id || apiGroup.groupid,
      device_count: apiGroup.device_count || apiGroup.devices?.length || 0,
      last_sync_at: apiGroup.last_sync_at || new Date().toISOString()
    };
  }

  static validatePosition(position: any): boolean {
    return !!(
      position.deviceid && 
      typeof position.callat === 'number' && 
      typeof position.callon === 'number'
    );
  }

  static validateDevice(device: any): boolean {
    return !!(device.deviceid && device.devicename);
  }
}

// Utility functions
export const createDefaultPerformanceMetrics = (): GP51PerformanceMetrics => {
  return {
    responseTime: 0,
    success: true,
    requestStartTime: new Date().toISOString(),
    deviceCount: 0,
    groupCount: 0,
    timestamp: new Date().toISOString(),
    apiCallCount: 0,
    errorRate: 0,
    averageResponseTime: 0,
    dataQuality: 0,
    onlinePercentage: 0,
    totalVehicles: 0,
    activeVehicles: 0,
    activeDevices: 0,
    movingVehicles: 0,
    stoppedVehicles: 0,
    utilizationRate: 0,
    lastUpdate: new Date().toISOString(),
    lastUpdateTime: new Date().toISOString()
  };
};

export const convertGP51DeviceToDeviceData = (device: GP51Device): GP51DeviceData => {
  return {
    deviceid: device.deviceid,
    devicename: device.devicename,
    devicetype: device.devicetype || 0,
    isfree: device.isfree,
    lastactivetime: device.lastactivetime,
    lastUpdate: device.lastactivetime ? 
      new Date(device.lastactivetime).toISOString() : 
      new Date().toISOString(),
    simnum: device.simnum,
    simcardno: device.simcardno,
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

export const safeToString = (value: any): string => {
  if (value === null || value === undefined) return '';
  return String(value);
};
