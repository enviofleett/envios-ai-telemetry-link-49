
export interface Workshop {
  id: string;
  name: string;
  representative_name: string;
  email: string;
  phone_number: string;
  location: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  // Additional properties for enhanced functionality
  phone?: string;
  city?: string;
  country?: string;
  address?: string;
  operating_hours?: string;
  service_types?: string[];
  connection_fee?: number;
  activation_fee?: number;
  verified?: boolean;
  is_active?: boolean;
  rating?: number;
  review_count?: number;
}

export interface WorkshopStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}
