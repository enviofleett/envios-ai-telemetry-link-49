
// Lightweight database operation types to avoid TS2589 errors
// These types are specifically designed to break circular dependencies

export interface LightweightEnvioUser {
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
}

export interface LightweightVehicle {
  device_id: string;
  device_name: string;
  status: string;
  created_at: string;
  owner_id?: string | null;
  updated_at?: string;
}

export interface DatabaseUpdateResult {
  id: string;
  [key: string]: any;
}
