
export interface VehicleGP51Metadata {
  latitude?: number;
  longitude?: number;
  speed?: number;
  course?: number;
  status?: string;
  statusText?: string;
  timestamp?: string;
  isMoving?: boolean;
  vehicleStatus?: 'online' | 'offline' | 'inactive' | 'unknown';
  importedAt?: string;
  lastGP51Sync?: string;
  importSource?: string;
  previousStatus?: string;
  statusHistory?: Array<{
    status: string;
    timestamp: string;
  }>;
  // Add index signature for Supabase Json compatibility
  [key: string]: any;
}

export interface VehicleWithGP51Metadata {
  id: string;
  device_id: string;
  device_name: string;
  gp51_metadata: VehicleGP51Metadata | null;
  updated_at: string;
}

export interface GP51ProcessedPosition {
  deviceId: string;
  deviceName: string;
  latitude: number;
  longitude: number;
  speed: number;
  course: number;
  timestamp: Date;
  status: string;
  statusText: string;
  isMoving: boolean;
  isOnline: boolean;
  odometer?: number;
  altitude?: number;
}

export interface GP51Device {
  deviceId: string;
  deviceName: string;
  deviceType?: string;
  groupId?: number;
  isOnline: boolean;
  lastUpdate?: Date;
}

export interface LiveVehicleFilterConfig {
  includeOffline?: boolean;
  deviceTypes?: string[];
  groupIds?: number[];
  lastSeenHours?: number;
}

export interface GP51ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
}

export interface GP51DeviceListResponse {
  devices: GP51Device[];
  total_devices: number;
  fetched_at: string;
}

export interface GP51PositionsResponse {
  positions: GP51ProcessedPosition[];
  total_positions: number;
  fetched_at: string;
}

export interface GP51LiveVehiclesResponse {
  devices: GP51Device[];
  telemetry: GP51ProcessedPosition[];
  total_devices: number;
  total_positions: number;
  fetched_at: string;
}

export interface ProcessVehicleDataResult {
  processed: number;
  created: number;
  updated: number;
  errors: string[];
}
