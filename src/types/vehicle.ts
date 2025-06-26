
export type VehicleStatus = 'online' | 'offline' | 'idle' | 'moving' | 'inactive' | 'active' | 'maintenance' | 'unknown';

export type SyncStatus = 'success' | 'error' | 'syncing' | 'loading' | 'idle' | 'completed' | 'running' | 'connected' | 'disconnected' | 'pending';

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
  gp51_device_id: string;
  device_name: string;
  name: string;
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
  // Additional properties for position data
  latitude?: number;
  longitude?: number;
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
  vehicleName?: string;
  envio_users?: {
    name?: string;
    email?: string;
  };
}

export interface VehicleMetrics {
  totalVehicles: number;
  onlineVehicles: number;
  offlineVehicles: number;
  movingVehicles: number;
  idleVehicles: number;
  recentlyActiveVehicles: number;
  lastSyncTime: Date;
  averageSpeed: number;
  totalDistance: number;
  syncStatus: SyncStatus;
  errors: string[];
  errorMessage?: string;
  total: number;
  online: number;
  offline: number;
  idle: number;
  alerts: number;
}

export interface VehicleEvent {
  id: string;
  vehicleId: string;
  type: string;
  message: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  isAcknowledged: boolean;
}

export interface SyncStatusData {
  isConnected: boolean;
  lastSync: Date;
  isSync: boolean;
}

export interface EnhancedVehicleData {
  vehicles: VehicleData[];
  allVehicles: VehicleData[];
  filteredVehicles: VehicleData[];
  userOptions: any[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: Error | null;
  lastUpdate: Date;
  refetch: () => Promise<void>;
  syncStatus: SyncStatusData;
  isConnected: boolean;
  forceSync: () => Promise<void>;
  forceRefresh: () => Promise<void>;
  events: VehicleEvent[];
  acknowledgeEvent: (eventId: string) => Promise<void>;
  metrics: VehicleMetrics;
}
