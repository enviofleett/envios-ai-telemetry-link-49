
export interface Workshop {
  id: string;
  name: string;
  representative_name: string;
  email: string;
  phone?: string;
  city?: string;
  country?: string;
  address?: string;
  service_types: string[];
  rating: number;
  review_count: number;
  activation_fee: number;
  connection_fee: number;
  operating_hours?: string;
  verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface WorkshopConnection {
  id: string;
  workshop_id: string;
  user_id: string;
  connection_status: 'pending' | 'connected' | 'rejected' | 'suspended';
  connected_at?: string;
  connection_fee_paid: number;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkshopActivation {
  id: string;
  workshop_id: string;
  vehicle_ids: string[];
  activation_status: 'pending' | 'active' | 'expired' | 'cancelled';
  activated_at?: string;
  activation_fee_paid: number;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  service_duration_months: number;
  expires_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  activated_by?: string;
}

export interface WorkshopService {
  id: string;
  workshop_id: string;
  service_name: string;
  service_description?: string;
  price?: number;
  duration_hours?: number;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkshopReview {
  id: string;
  workshop_id: string;
  user_id: string;
  rating: number;
  review_text?: string;
  service_date?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkshopVehicleAssignment {
  id: string;
  workshop_id: string;
  vehicle_id: string;
  assignment_status: 'active' | 'inactive' | 'pending';
  assigned_at: string;
  assigned_by?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateWorkshopData {
  name: string;
  representative_name: string;
  email: string;
  phone?: string;
  city?: string;
  country?: string;
  address?: string;
  service_types: string[];
  activation_fee: number;
  connection_fee: number;
  operating_hours?: string;
}
