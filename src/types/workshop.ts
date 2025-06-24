
export interface Workshop {
  id: string;
  name: string;
  representative_name: string;
  email: string;
  phone_number?: string;
  address?: string;
  status: string;
  service_types?: string[] | any;
  created_at: string;
  updated_at: string;
  // Additional properties that components are expecting
  phone?: string;
  city?: string;
  country?: string;
  operating_hours?: string;
  connection_fee?: number;
  activation_fee?: number;
  verified?: boolean;
  is_active?: boolean;
  rating?: number;
  review_count?: number;
}

export interface WorkshopConnection {
  id: string;
  workshop_id: string;
  vehicle_id: string;
  connection_type: string;
  status: string;
  established_at: string;
  workshop?: Workshop;
}
