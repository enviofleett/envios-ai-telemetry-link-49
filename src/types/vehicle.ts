
export type VehicleStatus = 'online' | 'offline' | 'idle' | 'moving' | 'inactive' | 'active' | 'maintenance' | 'unknown';

export type SyncStatus = 'success' | 'error' | 'syncing' | 'loading' | 'idle' | 'completed' | 'running';

export interface VehiclePosition {
  latitude: number;
  longitude: number;
  speed?: number;
  course?: number;
  timestamp?: string;
}

export interface VehicleData {
  id: string;
  device_id: string;
  device_name: string;
  user_id?: string;
  sim_number?: string;
  created_at: string;
  updated_at: string;
  vin?: string;
  license_plate?: string;
  is_active: boolean;
  last_position?: VehiclePosition;
  status: VehicleStatus;
  isOnline: boolean;
  isMoving: boolean;
  alerts: any[];
  lastUpdate: Date;
  envio_users?: {
    name?: string;
    email?: string;
  };
  // Additional properties that components are accessing
  speed?: number;
  course?: number;
  driver?: string | { name: string } | null;
  fuel?: number;
  mileage?: number;
  plateNumber?: string;
  model?: string;
  gp51_metadata?: { [key: string]: any };
  image_urls?: string[];
  fuel_tank_capacity_liters?: number;
  manufacturer_fuel_consumption_100km_l?: number;
  insurance_expiration_date?: string;
  license_expiration_date?: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
}

export interface VehicleDataMetrics {
  // Dashboard-compatible properties
  total: number;
  online: number;
  offline: number;
  idle: number;
  alerts: number;
  // Legacy properties
  totalVehicles: number;
  onlineVehicles: number;
  offlineVehicles: number;
  recentlyActiveVehicles: number;
  // Sync properties
  lastSyncTime: Date;
  positionsUpdated: number;
  errors: number;
  syncStatus: SyncStatus;
  errorMessage?: string;
}

export interface FilterState {
  search: string;
  status: 'all' | 'online' | 'offline' | 'active';
  user: string;
  online: 'all' | 'online' | 'offline';
}

export interface VehicleStatistics {
  total: number;
  totalCount: number;
  active: number;
  online: number;
  alerts: number;
}

export interface VehicleDbRecord {
  id: string;
  gp51_device_id: string;
  name: string;
  sim_number?: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
}

// Missing type exports that are being imported
export interface EnhancedVehicle extends VehicleData {
  enhanced?: boolean;
}

export interface ReportType {
  id: string;
  name: string;
  description: string;
}

export interface VehicleUpdate {
  device_name?: string;
  license_plate?: string;
  vin?: string;
  user_id?: string;
}

export type VehicleLocation = VehiclePosition;

export interface VehicleParkingPattern {
  vehicleId: string;
  patternType: string;
  frequency: number;
  duration: number;
  location: {
    latitude: number;
    longitude: number;
  };
}
