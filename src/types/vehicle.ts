
export type VehicleStatus = 'online' | 'offline' | 'idle' | 'moving' | 'inactive' | 'active' | 'maintenance' | 'unknown';

export interface VehiclePosition {
  latitude: number;
  longitude: number;
  speed: number;
  course: number;
  timestamp: string;
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
  syncStatus: 'success' | 'error' | 'syncing';
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
