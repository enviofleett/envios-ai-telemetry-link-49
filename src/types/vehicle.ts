
// Consolidated Vehicle type definitions
export interface VehiclePosition {
  lat: number;
  lon: number;
  speed: number;
  course: number;
  updatetime: string;
  statusText: string;
}

export interface Vehicle {
  id: string;
  device_id: string;
  device_name: string;
  status?: string;
  sim_number?: string;
  notes?: string;
  is_active: boolean;
  last_position?: VehiclePosition;
  envio_user_id?: string;
  gp51_metadata?: any;
  created_at: string;
  updated_at: string;
  envio_users?: {
    name: string;
    email: string;
  };
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
