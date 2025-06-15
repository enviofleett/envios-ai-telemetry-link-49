/**
 * Represents the exact schema of a record from the `public.vehicles` table.
 * This is the source of truth from the database.
 */
export interface VehicleDbRecord {
  id: string;
  user_id: string;
  gp51_device_id: string;
  name: string;
  sim_number: string | null;
  created_at: string;
  updated_at: string;
}

// For Supabase insert operations (omit auto-generated fields)
export type VehicleInsert = Omit<VehicleDbRecord, 'id' | 'created_at' | 'updated_at'>;

// For Supabase update operations (all fields optional)
export type VehicleUpdate = Partial<Omit<VehicleDbRecord, 'id' | 'created_at' | 'updated_at'>>;


/**
 * Represents the rich vehicle data object used throughout the application's UI.
 * It's a combination of the `VehicleDbRecord` and other derived or fetched data
 * (e.g., from GP51 API, or joined tables).
 */
export interface VehicleData {
  id: string;
  device_id: string; // Mapped from gp51_device_id
  device_name: string; // Mapped from name
  user_id: string | null;
  sim_number: string | null;
  created_at: string;
  updated_at: string;

  // Joined data
  envio_users?: {
    name: string;
    email: string;
  };
  user_email?: string; // for legacy compatibility

  // Derived/fetched data (placeholders, to be populated by services)
  status: VehicleStatus;
  last_position?: {
    latitude: number;
    longitude: number;
    speed: number;
    course: number;
    timestamp: string;
  };
  is_active: boolean; 
  isOnline?: boolean;
  isMoving?: boolean;
  speed?: number;
  course?: number;

  // Other UI-related properties
  vin?: string;
  license_plate?: string;
  make?: string;
  model?: string;
  year?: number;
  color?: string;
  alerts?: string[];
  
  // Legacy compatibility
  lastUpdate?: Date;
  vehicleName?: string;
  plateNumber?: string | null;
  
  // Properties added to fix TS errors
  location?: VehicleLocation;
  gp51_metadata?: any;
  
  // Properties from enhancedVehicleDataService
  driver?: { name: string; } | string | null;
  deliveries?: any[];
  deliveryStatus?: string;
  fuel?: number;
  engineHours?: number;
  mileage?: number;
  fuelType?: string;
  engineSize?: number;
  envio_user_id?: string;
}

// Alias for backwards compatibility
export type EnhancedVehicle = VehicleData;
export type RawVehicleData = VehicleDbRecord;

// Define the comprehensive status enum, including 'active' and 'unknown'
export type VehicleStatus = 'online' | 'offline' | 'idle' | 'moving' | 'inactive' | 'active' | 'unknown';

// Consolidated Vehicle type definitions
export interface VehiclePosition {
  latitude: number; // Changed from 'lat' to align with GP51 API
  longitude: number; // Changed from 'lng' to align with GP51 API
  speed: number;
  course: number;
  timestamp: string;
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
  latitude: number;
  longitude: number;
  address?: string;
}

// Enhanced vehicle data interface - the primary type for UI components
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
  idle: number; // Added missing idle property
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
  syncStatus: 'success' | 'error' | 'pending' | 'syncing';
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

// Types for the Parking Monitoring System
export interface VehicleParkingEvent {
  id: string;
  vehicle_device_id: string;
  parked_at: string;
  unparked_at?: string;
  duration_minutes?: number;
  latitude: number;
  longitude: number;
  address?: string;
  is_night_parking: boolean;
  created_at: string;
}

export interface VehicleParkingPattern {
  id: string;
  vehicle_device_id: string;
  latitude: number;
  longitude: number;
  address?: string;
  parking_count: number;
  is_primary_night_location: boolean;
  last_seen_at: string;
  created_at: string;
  updated_at: string;
}
