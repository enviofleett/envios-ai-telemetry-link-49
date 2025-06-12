
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
}
