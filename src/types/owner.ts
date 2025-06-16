
// Lightweight reference type for vehicle relationships in owner context
export interface VehicleReference {
  device_id: string;
  device_name: string;
  status: string;
  created_at: string;
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
}
