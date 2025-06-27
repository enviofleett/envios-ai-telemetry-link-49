
// Unified GP51 Type Definitions - Single Source of Truth
export interface GP51AuthResult {
  status: number;  
  cause: string;
  token?: string;
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
  isfree: number; // 1: normal, 2: experiencing, 3: disabled, 4: service fee overdue, 5: time expired
  allowedit: number;
  icon: number;
  stared: number;
  loginame?: string;
}

export interface GP51Group {
  groupid: number;
  groupname: string;
  remark?: string;
  devices: GP51Device[];
}

export interface GP51DeviceTreeResponse {
  status: number;
  cause: string;
  groups: GP51Group[];
}

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
  gotsrc: string; // "gps", "wifi", "LBS"
  rxlevel: number;
  gpsvalidnum: number;
  exvoltage: number;
  voltagev: number;
  voltagepercent: number;
  moving: number; // 0: static, 1: moving
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

export interface GP51LastPositionResponse {
  status: number;
  cause: string;
  lastquerypositiontime: number;
  records: GP51Position[];
}

// Analytics Types
export interface RealAnalyticsData {
  totalUsers: number;
  activeUsers: number;
  totalVehicles: number;
  activeVehicles: number;
  recentActivity: {
    newUsers: number;
    newVehicles: number;
    period: string;
    percentageChange: number;
  };
  gp51Status: {
    importedUsers: number;
    importedVehicles: number;
    lastSync: Date;
    status: 'success' | 'pending' | 'error';
  };
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
  performance: {
    averageSpeed: number;
    totalDistance: number;
    fuelEfficiency?: number;
    alertCount: number;
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

// Legacy aliases for backward compatibility
export type GPS51Device = GP51Device;
export type GPS51Group = GP51Group;
export type GPS51Position = GP51Position;
