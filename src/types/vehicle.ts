// Consolidated Vehicle type definitions
export interface VehiclePosition {
  lat: number;
  lon: number; // Standardized to 'lon' for internal consistency
  speed: number;
  course: number;
  timestamp: Date; // Changed from updatetime: string to timestamp: Date
  statusText: string;
}

// Raw GP51 position format (uses 'lng')
export interface GP51RawPosition {
  lat: number;
  lng: number; // GP51 uses 'lng'
  speed: number;
  course: number;
  updatetime: string;
  statusText: string;
}

// Vehicle location interface for enhanced vehicles
export interface VehicleLocation {
  lat: number;
  lng: number;
  address: string;
}

// Enhanced vehicle data interface - the primary type for UI components
export interface VehicleData {
  id: string;
  device_id: string; // Changed from deviceId to match DB
  device_name: string; // Changed from deviceName to match DB
  vin?: string;
  license_plate?: string; // Changed from licensePlate to match DB
  image_urls?: string[]; // Changed from imageUrls to match DB
  fuel_tank_capacity_liters?: number; // Changed from fuelTankCapacityLiters to match DB
  manufacturer_fuel_consumption_100km_l?: number; // Changed from manufacturerFuelConsumption100kmL to match DB
  insurance_expiration_date?: string; // Changed from insuranceExpirationDate to match DB
  license_expiration_date?: string; // Changed from licenseExpirationDate to match DB
  is_active: boolean; // Changed from isActive to match DB
  envio_user_id?: string; // Changed from envioUserId to match DB
  last_position?: {
    lat: number;
    lng: number; // Changed from lon to lng for consistency with components
    speed: number;
    timestamp: string; // Changed from Date to string for consistency
  };
  envio_users?: {
    name: string;
    email: string;
  }; // Changed from envioUsers to match DB join
  
  // Legacy compatibility properties
  vehicleName?: string;
  make?: string;
  model?: string;
  year?: number;
  status?: 'online' | 'offline' | 'idle' | 'moving';
  lastUpdate?: Date;
  position?: {
    latitude: number;
    longitude: number;
    speed: number;
    course: number;
    address?: string;
  };
  location?: {
    latitude: number;
    longitude: number;
    speed: number;
    course: number;
    address?: string;
  };
  speed?: number;
  course?: number;
  isOnline?: boolean;
  isMoving?: boolean;
  fuel?: number;
  battery?: number;
  temperature?: number;
  alerts?: string[];
}

// Enhanced vehicle interface with all analytics properties
export interface EnhancedVehicle {
  id: string;
  deviceId: string; // Standardized camelCase
  deviceName: string; // Standardized camelCase
  plateNumber: string;
  model: string;
  driver: string;
  speed: number;
  fuel: number;
  lastUpdate: Date;
  status: 'active' | 'idle' | 'maintenance' | 'offline';
  isOnline: boolean;
  isMoving: boolean;
  
  // Analytics properties - now required for all EnhancedVehicle objects
  location: VehicleLocation; // Updated to use VehicleLocation interface
  engineHours: number;
  mileage: number;
  fuelType: string;
  engineSize: number;
  
  // Optional compatibility properties
  deviceid?: string; // For backward compatibility
  devicename?: string; // For backward compatibility
  vehicle_name?: string;
  make?: string;
  year?: number;
  license_plate?: string;
  vin?: string;
  color?: string;
  fuel_type?: string;
  created_at?: string;
  updated_at?: string;
  is_active?: boolean;
  alerts?: string[];
  lastPosition?: {
    lat: number;
    lng: number;
    speed: number;
    course: number;
    updatetime: string;
    statusText: string;
  };
}

// Analytics data interfaces
export interface FuelRecord {
  date: string;
  consumption: number;
  efficiency: number;
  cost: number;
  distance?: number;
  performance?: number;
}

export interface EngineRecord {
  date: string;
  engineHours: number;
  idleTime: number;
  utilization: number;
  performance: number;
  trips?: number;
  estimatedFuel?: number;
  activity?: number;
}

export interface MileageRecord {
  date: string;
  distance: number;
  trips: number;
  estimatedFuel: number;
  activity: number;
  consumption?: number;
  efficiency?: number;
  cost?: number;
  engineHours?: number;
  idleTime?: number;
  utilization?: number;
  performance?: number;
}

// Unified metrics interface that includes both dashboard and sync data
export interface VehicleDataMetrics {
  // Dashboard-compatible properties (primary)
  total: number;
  online: number;
  offline: number;
  alerts: number;
  
  // Legacy properties (for backwards compatibility)
  totalVehicles: number;
  onlineVehicles: number;
  offlineVehicles: number;
  recentlyActiveVehicles: number;
  
  // Sync-related properties (moved from separate syncMetrics)
  lastSyncTime: Date;
  positionsUpdated: number;
  errors: number;
  syncStatus: 'success' | 'error' | 'pending';
  errorMessage?: string;
}

export interface VehicleMetrics {
  total: number;
  online: number;
  offline: number;
  alerts: number;
  lastUpdateTime: Date;
}

export interface SyncMetrics {
  totalVehicles: number;
  positionsUpdated: number;
  errors: number;
  lastSyncTime: Date;
}

export interface FilterState {
  search: string;
  status: string;
  user: string;
  online: string;
}

export interface VehicleStatistics {
  total: number;
  active: number;
  online: number;
  alerts: number;
}

export interface ReportType {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
}

interface UseUnifiedVehicleDataResult {
  vehicles: VehicleData[];
  metrics: VehicleDataMetrics; // Now includes all sync data
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  forceRefresh: () => Promise<void>;
  loadMore: () => void;
  hasMore: boolean;
  currentPage: number;
  getVehiclesByStatus: () => {
    online: VehicleData[];
    offline: VehicleData[];
    alerts: VehicleData[];
  };
  getVehicleById: (deviceId: string) => VehicleData | undefined;
  getOnlineVehicles: () => VehicleData[];
  getOfflineVehicles: () => VehicleData[];
  getMovingVehicles: () => VehicleData[];
  getIdleVehicles: () => VehicleData[];
  // Removed separate syncMetrics - all data is now in metrics
}
