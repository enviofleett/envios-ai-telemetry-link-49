
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

// Enhanced vehicle data interface - the primary type for UI components
export interface VehicleData {
  id: string;
  deviceId: string;
  deviceName: string;
  vehicleName?: string;
  make?: string;
  model?: string;
  year?: number;
  licensePlate?: string;
  status: 'online' | 'offline' | 'idle' | 'moving';
  lastUpdate: Date; // Required - represents the last data update time
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
  isOnline: boolean;
  isMoving: boolean;
  fuel?: number;
  battery?: number;
  temperature?: number;
  alerts: string[]; // Required - array of alert messages
  lastPosition?: VehiclePosition;
  envio_user_id?: string;
  is_active: boolean;
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
