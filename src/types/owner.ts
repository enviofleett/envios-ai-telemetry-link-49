
// Lighter vehicle reference to break circular dependency
export interface LightVehicleReference {
  id: string;
  device_id: string;
  device_name?: string;
}

export interface EnvioUser {
  id: string;
  name: string;
  email: string;
  phone_number: string | null;
  city: string | null;
  gp51_username: string | null;
  gp51_user_type: number;
  registration_status: string;
  created_at: string;
  updated_at: string;
  // Simplified vehicle references to avoid circular dependency
  assigned_vehicles?: LightVehicleReference[];
}

export interface VehicleData {
  device_id: string;
  device_name: string;
  status: string;
  created_at: string;
}
