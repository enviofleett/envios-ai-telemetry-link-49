export interface GP51AuthResponse {
  status: number;
  cause: string;
  token?: string;
  success: boolean;
  error?: string;
}

export interface GP51ProcessResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export interface GP51TestResult {
  name: string;
  success: boolean;
  testType: string;
  message: string;
  duration: number;
  responseTime: number;
  timestamp: Date;
  error?: string;
  errors?: string[];
  data?: any;
}

export interface GP51LiveVehiclesResponse {
  success: boolean;
  data?: any[];
  groups?: any;
  error?: string;
}

export interface GP51Device {
  deviceid: string;
  devicename: string;
  devicetype: string;
  isfree: number;
  lastactivetime: string;
  icon?: string;
  groupid?: string;
  isOnline?: boolean;
  isMoving?: boolean;
  latitude?: number;
  longitude?: number;
  speed?: number;
  course?: number;
  timestamp?: Date;
}

export interface GP51Group {
  groupid: string;
  groupname: string;
  parentid: string;
  devices?: GP51Device[];
}

export interface GP51DeviceTreeResponse {
  success: boolean;
  data: GP51Device[];
  groups: GP51Group[];
  error?: string;
}

export interface GP51Position {
  deviceid: string;
  devicetime: number;
  arrivedtime: number;
  updatetime: number;
  validpoistiontime: number;
  callat: number;
  callon: number;
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
}

export interface GP51ProcessedPosition {
  deviceId: string;
  deviceName?: string;
  latitude: number;
  longitude: number;
  speed: number;
  course: number;
  timestamp: Date;
  isOnline: boolean;
  isMoving: boolean;
}

export interface GP51TelemetryData {
  deviceid: string;
  devicetime: number;
  speed: number;
  course: number;
  latitude: number;
  longitude: number;
  altitude: number;
  temperature: number;
  fuelLevel: number;
  batteryVoltage: number;
}

export interface GP51HealthStatus {
  status: string;
  lastCheck: Date;
  responseTime?: number;
  isConnected: boolean;
  lastPingTime: Date;
  tokenValid: boolean;
  sessionValid: boolean;
  activeDevices: number;
  errorMessage?: string;
  isHealthy: boolean;
  connectionStatus: string;
  isReallyConnected?: boolean;
}

export interface GP51PerformanceMetrics {
  // Core metrics
  responseTime: number;
  success: boolean;
  requestStartTime: string;
  timestamp: string;
  
  // Count metrics
  deviceCount: number;
  groupCount: number;
  apiCallCount: number;
  
  // Performance metrics
  errorRate: number;
  averageResponseTime: number;
  
  // Vehicle metrics
  totalVehicles: number;
  activeVehicles: number;
  activeDevices: number;
  movingVehicles: number;
  stoppedVehicles: number;
  
  // Additional metrics
  lastUpdateTime: Date;
  dataQuality: number;
  onlinePercentage: number;
  utilizationRate: number;
}

export class GP51PropertyMapper {
  static mapPosition(position: GP51Position): GP51ProcessedPosition {
    return {
      deviceId: position.deviceid,
      latitude: position.callat,
      longitude: position.callon,
      speed: position.speed,
      course: position.course,
      timestamp: new Date(position.devicetime),
      isOnline: position.status === 1,
      isMoving: position.moving === 1
    };
  }

  static enhancePosition(position: GP51Position): GP51ProcessedPosition {
    const processed = GP51PropertyMapper.mapPosition(position);
    return {
      ...processed,
      deviceName: position.deviceid,
    };
  }
}

interface ActivityData {
  type: "vehicle_online" | "vehicle_offline" | "alert" | "maintenance";
  message: string;
  timestamp: Date;
  vehicleId?: string;
  percentageChange?: number;
}

export interface RealAnalyticsData {
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
  recentActivity: ActivityData[];
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
